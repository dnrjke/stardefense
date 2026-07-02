/**
 * AudioEngine — Web Audio API 기반 절차적(procedural) 사운드 신디사이저.
 *
 * 외부 오디오 에셋을 일절 사용하지 않고 모든 SFX를 런타임에 합성한다.
 * (저작권/출처 관리 불필요 — Docs/AUDIO.md 참조)
 *
 * 구조:
 *   sfxBus ─┐
 *   musicBus ┴→ masterGain → DynamicsCompressor → destination
 *   reverbSend → ConvolverNode(생성된 IR) → masterGain
 *
 * 브라우저 autoplay 정책: 첫 사용자 제스처(pointerdown/keydown)에서 resume.
 */

type SoundId =
  | 'ui_click'
  | 'ui_select'
  | 'ui_error'
  | 'tower_place'
  | 'tower_sell'
  | 'tower_evolve'
  | 'nebula_place'
  | 'enemy_hit'
  | 'enemy_kill'
  | 'base_damage'
  | 'wave_start'
  | 'wave_clear'
  | 'victory'
  | 'gameover'
  | 'supernova'
  | 'spell_cast';

interface ThrottleRule {
  minGapMs: number;
  /** minGap 안에 재요청 시 볼륨 감쇠 후 재생할지 (false면 스킵) */
  duck?: boolean;
}

const THROTTLE: Partial<Record<SoundId, ThrottleRule>> = {
  enemy_hit: { minGapMs: 55, duck: true },
  enemy_kill: { minGapMs: 70, duck: true },
  base_damage: { minGapMs: 200 },
  ui_click: { minGapMs: 40 },
};

// v2: masterVolume 추가, musicVolume 기본값 0.6으로 변경
const STORAGE_KEY = 'sd_audio_settings_v2';

export type VolumeChannel = 'master' | 'music' | 'sfx';

interface AudioSettings {
  muted: boolean;
  masterVolume: number; // 0..1
  sfxVolume: number;    // 0..1
  musicVolume: number;  // 0..1
}

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  masterVolume: 1,
  sfxVolume: 0.8,
  musicVolume: 0.6,
};

export class AudioEngine {
  private static _instance: AudioEngine | null = null;
  static get instance(): AudioEngine {
    if (!this._instance) this._instance = new AudioEngine();
    return this._instance;
  }

  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private sfxBus!: GainNode;
  private musicBusNode!: GainNode;
  private reverbSend!: GainNode;
  private noiseBuffer!: AudioBuffer;
  private lastPlayed = new Map<SoundId, number>();
  private settings: AudioSettings;
  private unlockBound = false;
  /** 설정 변경 구독 (HUD 버튼 갱신용) */
  onSettingsChanged: (() => void) | null = null;

  private constructor() {
    this.settings = this.loadSettings();
    this.bindUnlock();
    // 전역 버튼 클릭음 — HUD/맵 선택 등 모든 DOM 버튼 공통 (개별 배선 불필요)
    document.addEventListener('click', (e) => {
      const el = e.target as HTMLElement | null;
      if (el && typeof el.closest === 'function' && el.closest('button')) {
        this.play('ui_click');
      }
    }, { capture: true, passive: true });
  }

  // ── 설정 ──

  private loadSettings(): AudioSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          muted: !!p.muted,
          masterVolume: typeof p.masterVolume === 'number' ? p.masterVolume : DEFAULT_SETTINGS.masterVolume,
          sfxVolume: typeof p.sfxVolume === 'number' ? p.sfxVolume : DEFAULT_SETTINGS.sfxVolume,
          musicVolume: typeof p.musicVolume === 'number' ? p.musicVolume : DEFAULT_SETTINGS.musicVolume,
        };
      }
    } catch { /* 무시 — 기본값 사용 */ }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)); } catch { /* quota 등 무시 */ }
  }

  get muted() { return this.settings.muted; }

  getVolume(channel: VolumeChannel): number {
    switch (channel) {
      case 'master': return this.settings.masterVolume;
      case 'music': return this.settings.musicVolume;
      case 'sfx': return this.settings.sfxVolume;
    }
  }

  setVolume(channel: VolumeChannel, value: number) {
    const v = Math.min(1, Math.max(0, value));
    switch (channel) {
      case 'master': this.settings.masterVolume = v; break;
      case 'music': this.settings.musicVolume = v; break;
      case 'sfx': this.settings.sfxVolume = v; break;
    }
    this.applyVolumes();
    this.saveSettings();
    this.onSettingsChanged?.();
  }

  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    this.applyVolumes();
    this.saveSettings();
    this.onSettingsChanged?.();
    return this.settings.muted;
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.masterVolume, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(this.settings.sfxVolume, t, 0.02);
    this.musicBusNode.gain.setTargetAtTime(this.settings.musicVolume, t, 0.02);
  }

  // ── 초기화 / 잠금 해제 ──

  private bindUnlock() {
    if (this.unlockBound) return;
    this.unlockBound = true;
    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 24;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    compressor.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.connect(compressor);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.settings.sfxVolume;
    this.sfxBus.connect(this.masterGain);

    this.musicBusNode = this.ctx.createGain();
    this.musicBusNode.gain.value = this.settings.musicVolume;
    this.musicBusNode.connect(this.masterGain);

    // 리버브: 지수 감쇠 노이즈로 스테레오 IR 생성 (2.2초, 우주적 잔향)
    const convolver = this.ctx.createConvolver();
    convolver.buffer = this.buildImpulseResponse(2.2, 3.2);
    convolver.connect(this.masterGain);
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = 0.35;
    this.reverbSend.connect(convolver);

    // 화이트노이즈 버퍼 (1초) — 폭발/타격 합성용, 재사용
    const len = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    return this.ctx;
  }

  private buildImpulseResponse(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  /** 음악 시스템이 연결할 버스 (컨텍스트 없으면 null) */
  getMusicBus(): { ctx: AudioContext; bus: GainNode; reverb: GainNode } | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    return { ctx, bus: this.musicBusNode, reverb: this.reverbSend };
  }

  // ── 합성 헬퍼 ──

  /** ADSR 없이 exp 감쇠 엔벨로프를 가진 게인 노드 생성 */
  private env(t0: number, peak: number, attack: number, decay: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    return g;
  }

  private osc(type: OscillatorType, freq: number, t0: number, dur: number): OscillatorNode {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  }

  private noise(t0: number, dur: number): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    return src;
  }

  private pan(spread: number): StereoPannerNode | GainNode {
    if (typeof this.ctx!.createStereoPanner === 'function') {
      const p = this.ctx!.createStereoPanner();
      p.pan.value = (Math.random() * 2 - 1) * spread;
      return p;
    }
    return this.ctx!.createGain();
  }

  /** rate 변주: 1 ± jitter */
  private jitter(amount: number): number {
    return 1 + (Math.random() * 2 - 1) * amount;
  }

  // ── 공개 재생 API ──

  play(id: SoundId, opts?: { volume?: number; pitch?: number }) {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running' || this.settings.muted) return;

    // 스로틀
    let volScale = opts?.volume ?? 1;
    const rule = THROTTLE[id];
    if (rule) {
      const now = performance.now();
      const last = this.lastPlayed.get(id) ?? -Infinity;
      const elapsed = now - last;
      if (elapsed < rule.minGapMs) {
        if (!rule.duck) return;
        volScale *= 0.35;
        if (elapsed < rule.minGapMs * 0.4) return;
      }
      this.lastPlayed.set(id, now);
    }

    const t = ctx.currentTime;
    const pitch = opts?.pitch ?? 1;
    switch (id) {
      case 'ui_click': this.sfxUiClick(t, volScale); break;
      case 'ui_select': this.sfxUiSelect(t, volScale); break;
      case 'ui_error': this.sfxUiError(t, volScale); break;
      case 'tower_place': this.sfxTowerPlace(t, volScale); break;
      case 'tower_sell': this.sfxTowerSell(t, volScale); break;
      case 'tower_evolve': this.sfxTowerEvolve(t, volScale); break;
      case 'nebula_place': this.sfxNebulaPlace(t, volScale); break;
      case 'enemy_hit': this.sfxEnemyHit(t, volScale, pitch); break;
      case 'enemy_kill': this.sfxEnemyKill(t, volScale); break;
      case 'base_damage': this.sfxBaseDamage(t, volScale); break;
      case 'wave_start': this.sfxWaveStart(t, volScale); break;
      case 'wave_clear': this.sfxWaveClear(t, volScale); break;
      case 'victory': this.sfxVictory(t, volScale); break;
      case 'gameover': this.sfxGameover(t, volScale); break;
      case 'supernova': this.sfxSupernova(t, volScale); break;
      case 'spell_cast': this.sfxSpellCast(t, volScale); break;
    }
  }

  // ── 개별 사운드 정의 ──

  /** 낮고 둥근 블립 — 버튼 클릭 (사인 하강 글라이드 + LP, 고역 트랜지언트 제거) */
  private sfxUiClick(t: number, v: number) {
    const base = 520 * this.jitter(0.04);
    const o = this.osc('sine', base, t, 0.09);
    o.frequency.exponentialRampToValueAtTime(base * 0.72, t + 0.08);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400;
    const g = this.env(t, 0.11 * v, 0.006, 0.08);
    o.connect(f).connect(g).connect(this.sfxBus);
  }

  /** 따뜻한 저역 2음 상승 + 은은한 잔향 — 팔레트 선택 (우주적 소프트 톤) */
  private sfxUiSelect(t: number, v: number) {
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1800;
    const g = this.env(t, 0.09 * v, 0.02, 0.28);
    const o1 = this.osc('sine', 440, t, 0.14);
    const o2 = this.osc('sine', 660, t + 0.09, 0.24);
    // 옥타브 아래 서브톤으로 몸통을 채워 얇은 느낌 제거
    const o3 = this.osc('sine', 220, t, 0.3);
    const g3 = this.env(t, 0.04 * v, 0.03, 0.28);
    o1.connect(f); o2.connect(f);
    f.connect(g).connect(this.sfxBus);
    o3.connect(g3).connect(this.sfxBus);
    g.connect(this.reverbSend);
  }

  /** 낮은 버즈 — 배치 불가/자금 부족 */
  private sfxUiError(t: number, v: number) {
    const o = this.osc('square', 160, t, 0.14);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.13);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 700;
    const g = this.env(t, 0.09 * v, 0.004, 0.13);
    o.connect(f).connect(g).connect(this.sfxBus);
  }

  /** 깊고 따뜻한 블룸 — 항성 배치 (저음 상승 + 배음) */
  private sfxTowerPlace(t: number, v: number) {
    const g = this.env(t, 0.35 * v, 0.02, 0.55);
    const o1 = this.osc('sine', 90, t, 0.6);
    o1.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    const o2 = this.osc('triangle', 270, t, 0.6);
    o2.frequency.exponentialRampToValueAtTime(540, t + 0.35);
    const g2 = this.env(t, 0.08 * v, 0.05, 0.5);
    o1.connect(g);
    o2.connect(g2);
    g.connect(this.sfxBus);
    g2.connect(this.sfxBus);
    g.connect(this.reverbSend);
  }

  /** 하강 스윕 — 철거 */
  private sfxTowerSell(t: number, v: number) {
    const o = this.osc('triangle', 600, t, 0.3);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.28);
    const g = this.env(t, 0.18 * v, 0.008, 0.28);
    o.connect(g).connect(this.sfxBus);
  }

  /** 상승 쉬머 아르페지오 — 진화 */
  private sfxTowerEvolve(t: number, v: number) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    for (let i = 0; i < notes.length; i++) {
      const nt = t + i * 0.07;
      const o = this.osc('sine', notes[i], nt, 0.4);
      const g = this.env(nt, 0.14 * v, 0.01, 0.38);
      o.connect(g).connect(this.sfxBus);
      g.connect(this.reverbSend);
    }
    // 반짝임: 고역 노이즈 브러시
    const n = this.noise(t, 0.5);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6000;
    const ng = this.env(t, 0.05 * v, 0.05, 0.45);
    n.connect(f).connect(ng).connect(this.sfxBus);
  }

  /** 몽환적 패드 스웰 — 성운 배치 */
  private sfxNebulaPlace(t: number, v: number) {
    const g = this.env(t, 0.16 * v, 0.15, 0.8);
    const o1 = this.osc('sine', 220, t, 1.0);
    const o2 = this.osc('sine', 330, t, 1.0);
    o2.detune.value = 8;
    o1.connect(g); o2.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverbSend);
  }

  /** 레이저 재핑 — 투사체 명중 (피치 변주로 타워 다양성 표현) */
  private sfxEnemyHit(t: number, v: number, pitch: number) {
    const base = 1400 * pitch * this.jitter(0.12);
    const o = this.osc('sawtooth', base, t, 0.09);
    o.frequency.exponentialRampToValueAtTime(base * 0.35, t + 0.08);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = base * 0.8; f.Q.value = 1.5;
    const g = this.env(t, 0.07 * v, 0.002, 0.085);
    const p = this.pan(0.5);
    o.connect(f).connect(g).connect(p).connect(this.sfxBus);
  }

  /** 소형 폭발 + 스파클 — 적 처치 */
  private sfxEnemyKill(t: number, v: number) {
    const n = this.noise(t, 0.25);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3000 * this.jitter(0.2), t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.22);
    const g = this.env(t, 0.16 * v, 0.003, 0.22);
    const p = this.pan(0.6);
    n.connect(f).connect(g).connect(p).connect(this.sfxBus);

    const o = this.osc('sine', 200 * this.jitter(0.15), t, 0.15);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.14);
    const og = this.env(t, 0.14 * v, 0.003, 0.14);
    o.connect(og).connect(p);
  }

  /** 경보 + 둔탁한 타격 — 기지 피해 */
  private sfxBaseDamage(t: number, v: number) {
    const o = this.osc('sine', 70, t, 0.35);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    const g = this.env(t, 0.4 * v, 0.005, 0.32);
    o.connect(g).connect(this.sfxBus);

    const alarm = this.osc('square', 440, t + 0.02, 0.3);
    alarm.frequency.setValueAtTime(440, t + 0.02);
    alarm.frequency.setValueAtTime(349, t + 0.17);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1200;
    const ag = this.env(t + 0.02, 0.08 * v, 0.01, 0.3);
    alarm.connect(f).connect(ag).connect(this.sfxBus);
  }

  /** 저역 스웁 상승 — 웨이브 시작 */
  private sfxWaveStart(t: number, v: number) {
    const o = this.osc('sawtooth', 60, t, 0.7);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.6);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(1800, t + 0.6);
    f.Q.value = 4;
    const g = this.env(t, 0.22 * v, 0.05, 0.62);
    o.connect(f).connect(g).connect(this.sfxBus);
    g.connect(this.reverbSend);
  }

  /** 밝은 차임 — 웨이브 클리어 */
  private sfxWaveClear(t: number, v: number) {
    const notes = [659.25, 783.99, 987.77]; // E5 G5 B5
    for (let i = 0; i < notes.length; i++) {
      const nt = t + i * 0.09;
      const o = this.osc('sine', notes[i], nt, 0.5);
      const g = this.env(nt, 0.13 * v, 0.008, 0.48);
      o.connect(g).connect(this.sfxBus);
      g.connect(this.reverbSend);
    }
  }

  /** 장조 팡파르 — 맵 클리어 */
  private sfxVictory(t: number, v: number) {
    const seq = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
    for (let i = 0; i < seq.length; i++) {
      const nt = t + i * 0.13;
      const o = this.osc('triangle', seq[i], nt, 0.9);
      const o2 = this.osc('sine', seq[i] / 2, nt, 0.9);
      const g = this.env(nt, 0.16 * v, 0.01, 0.85);
      o.connect(g); o2.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverbSend);
    }
  }

  /** 하강 다크 드론 — 게임 오버 */
  private sfxGameover(t: number, v: number) {
    const o1 = this.osc('sawtooth', 220, t, 2.2);
    o1.frequency.exponentialRampToValueAtTime(55, t + 2.0);
    const o2 = this.osc('sawtooth', 223, t, 2.2);
    o2.frequency.exponentialRampToValueAtTime(57, t + 2.0);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 2.0);
    const g = this.env(t, 0.22 * v, 0.1, 2.0);
    o1.connect(f); o2.connect(f);
    f.connect(g).connect(this.sfxBus);
    g.connect(this.reverbSend);
  }

  /** 대형 폭발 — 베텔게우스 초신성 */
  private sfxSupernova(t: number, v: number) {
    // 서브 붐
    const o = this.osc('sine', 120, t, 1.2);
    o.frequency.exponentialRampToValueAtTime(30, t + 1.0);
    const og = this.env(t, 0.55 * v, 0.008, 1.05);
    o.connect(og).connect(this.sfxBus);
    // 폭풍 노이즈
    const n = this.noise(t, 1.4);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(8000, t);
    f.frequency.exponentialRampToValueAtTime(150, t + 1.3);
    const ng = this.env(t, 0.4 * v, 0.01, 1.3);
    n.connect(f).connect(ng).connect(this.sfxBus);
    ng.connect(this.reverbSend);
  }

  /** 스펠 시전 — 상승 스윕 + 쉬머 */
  private sfxSpellCast(t: number, v: number) {
    const o = this.osc('sine', 300, t, 0.6);
    o.frequency.exponentialRampToValueAtTime(1200, t + 0.5);
    const g = this.env(t, 0.18 * v, 0.02, 0.55);
    o.connect(g).connect(this.sfxBus);
    g.connect(this.reverbSend);
    const n = this.noise(t + 0.1, 0.5);
    const f = this.ctx!.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 5000;
    const ng = this.env(t + 0.1, 0.06 * v, 0.08, 0.4);
    n.connect(f).connect(ng).connect(this.sfxBus);
  }
}

export const audio = AudioEngine.instance;
