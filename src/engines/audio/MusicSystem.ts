/**
 * MusicSystem — 생성형(generative) 우주 앰비언트 음악.
 *
 * 외부 음원 없이 Web Audio로 실시간 생성:
 *  - 드론 레이어: 디튠된 2-osc 패드, 느린 LFO 필터 모듈레이션
 *  - 코드 레이어: D 도리안 코드 풀에서 완만한 랜덤워크, 긴 크로스페이드
 *  - 플럭 레이어: 펜타토닉 랜덤 노트 + 리버브 (희소하게)
 *  - 강도(intensity): build 0.4 / wave 0.8 / gameover 0 — 필터 컷오프·플럭 빈도 반영
 *
 * 저작권: 자체 알고리즘 생성 — 제3자 소재 없음 (Docs/AUDIO.md)
 */

import { audio } from './AudioEngine';

// D 도리안 코드 풀 (루트 Hz, 낮은 옥타브)
const CHORDS: number[][] = [
  [73.42, 110.0, 146.83, 174.61],  // Dm7:  D2 A2 D3 F3
  [87.31, 130.81, 174.61, 220.0],  // F:    F2 C3 F3 A3
  [98.0, 146.83, 196.0, 246.94],   // G:    G2 D3 G3 B3
  [65.41, 98.0, 130.81, 196.0],    // C:    C2 G2 C3 G3
  [110.0, 164.81, 220.0, 261.63],  // Am:   A2 E3 A3 C4
];

// D 마이너 펜타토닉 (플럭용, 중고역)
const PLUCK_SCALE = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99];

interface ChordVoice {
  oscs: OscillatorNode[];
  gain: GainNode;
}

export class MusicSystem {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private reverb: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private currentChord: ChordVoice | null = null;
  private chordIndex = 0;
  private chordTimer: number | null = null;
  private pluckTimer: number | null = null;
  private running = false;
  private intensity = 0.4;

  start() {
    if (this.running) return;
    const bus = audio.getMusicBus();
    if (!bus) return;
    this.ctx = bus.ctx;
    this.reverb = bus.reverb;
    this.running = true;

    // 마스터 필터 → 뮤직 버스 (인텐시티에 따라 컷오프 변화)
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.5;

    this.out = this.ctx.createGain();
    this.out.gain.value = 0;
    this.filter.connect(this.out);
    this.out.connect(bus.bus);
    // 음악 전체에 은은한 잔향
    const revTap = this.ctx.createGain();
    revTap.gain.value = 0.5;
    this.out.connect(revTap);
    revTap.connect(this.reverb);

    const t = this.ctx.currentTime;
    this.out.gain.setTargetAtTime(0.5, t, 2.0); // 페이드인

    this.startDrone();
    this.scheduleChord(0);
    this.schedulePluck();
  }

  /** 페이즈 전환 시 강도 조절: build 0.4, wave 0.8 */
  setIntensity(v: number) {
    this.intensity = v;
    if (!this.ctx || !this.filter || !this.out) return;
    const t = this.ctx.currentTime;
    // 강도가 높을수록 밝고 크게
    this.filter.frequency.setTargetAtTime(500 + v * 1600, t, 1.5);
    this.out.gain.setTargetAtTime(0.35 + v * 0.35, t, 1.5);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.chordTimer !== null) { clearTimeout(this.chordTimer); this.chordTimer = null; }
    if (this.pluckTimer !== null) { clearTimeout(this.pluckTimer); this.pluckTimer = null; }

    if (this.ctx && this.out) {
      const t = this.ctx.currentTime;
      this.out.gain.setTargetAtTime(0, t, 0.8);
      // 페이드아웃 후 정리
      const oscs = [...this.droneOscs, ...(this.currentChord?.oscs ?? [])];
      const lfo = this.lfo;
      const out = this.out;
      setTimeout(() => {
        for (const o of oscs) { try { o.stop(); o.disconnect(); } catch { /* already stopped */ } }
        try { lfo?.stop(); lfo?.disconnect(); } catch { /* already stopped */ }
        try { out.disconnect(); } catch { /* already disconnected */ }
      }, 3000);
    }
    this.droneOscs = [];
    this.currentChord = null;
    this.lfo = null;
    this.out = null;
    this.filter = null;
  }

  // ── 드론 레이어 ──

  private startDrone() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.16;
    droneGain.connect(this.filter!);

    const freqs = [36.71, 55.0]; // D1, A1
    for (const f of freqs) {
      for (const det of [-5, 5]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det;
        o.start(t);
        this.droneOscs.push(o);
        o.connect(droneGain);
      }
    }

    // LFO로 필터 흔들기 (아주 느리게)
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter!.frequency);
    this.lfo.start(t);
  }

  // ── 코드 레이어 ──

  private scheduleChord(delayMs: number) {
    if (!this.running) return;
    this.chordTimer = window.setTimeout(() => {
      if (!this.running || !this.ctx) return;
      this.transitionChord();
      // 14~24초마다 코드 전환
      this.scheduleChord(14000 + Math.random() * 10000);
    }, delayMs);
  }

  private transitionChord() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const fadeSec = 6;

    // 이전 코드 페이드아웃
    if (this.currentChord) {
      const old = this.currentChord;
      old.gain.gain.setTargetAtTime(0, t, fadeSec / 3);
      setTimeout(() => {
        for (const o of old.oscs) { try { o.stop(); o.disconnect(); } catch { /* already stopped */ } }
        try { old.gain.disconnect(); } catch { /* already disconnected */ }
      }, fadeSec * 2500);
    }

    // 랜덤워크: 인접 코드로 이동 (±1) 또는 유지 반경 내 점프
    const step = Math.random() < 0.65 ? (Math.random() < 0.5 ? 1 : -1) : Math.floor(Math.random() * CHORDS.length) - this.chordIndex;
    this.chordIndex = (this.chordIndex + step + CHORDS.length) % CHORDS.length;
    const chord = CHORDS[this.chordIndex];

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.setTargetAtTime(0.07, t, fadeSec / 3);
    gain.connect(this.filter!);

    const oscs: OscillatorNode[] = [];
    for (const f of chord) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f * 2; // 한 옥타브 위에서 패드
      o.detune.value = (Math.random() * 2 - 1) * 7;
      o.start(t);
      o.connect(gain);
      oscs.push(o);
    }
    this.currentChord = { oscs, gain };
  }

  // ── 플럭 레이어 ──

  private schedulePluck() {
    if (!this.running) return;
    // 강도 높을수록 촘촘히: build ~7초, wave ~3.5초 간격
    const gap = (8000 - this.intensity * 5500) * (0.6 + Math.random() * 0.8);
    this.pluckTimer = window.setTimeout(() => {
      if (!this.running || !this.ctx) return;
      this.playPluck();
      this.schedulePluck();
    }, gap);
  }

  private playPluck() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const freq = PLUCK_SCALE[Math.floor(Math.random() * PLUCK_SCALE.length)];

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.start(t);
    o.stop(t + 2.0);

    let dest: AudioNode = g;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = (Math.random() * 2 - 1) * 0.7;
      g.connect(p);
      dest = p;
    }
    o.connect(g);
    dest.connect(this.out!);
    dest.connect(this.reverb!);
  }
}
