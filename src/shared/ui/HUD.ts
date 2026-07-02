import type { GameStore } from '@/app/store/GameStore';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import { NEBULA_DEFS } from '@/shared/data/NebulaData';
import { SPELL_DEFS } from '@/shared/data/SpellData';
import { ENEMY_DEFS } from '@/shared/data/EnemyData';
import type { WaveDef } from '@/shared/data/WaveData';
import { EVOLUTION_TREE, getEvolutions } from '@/engines/tower/EvolutionSystem';
import { ciToRgb } from '@/shared/data/ColorUtil';
import { createNebulaPreview, createTowerPreview, disposeNebulaPreview, preloadPreviewShaders } from '@/shared/ui/NebulaPreview';
import { getTowerRoleTag, getRoleTagStyle } from '@/shared/data/TowerRoleTags';
import { displayMode } from '@/shared/ui/DisplayMode';
import { audio, type VolumeChannel } from '@/engines/audio/AudioEngine';
import { getTowerVisual, applyVisualTint } from '@/shared/data/TowerVisuals';

export class HUD {
  private container: HTMLDivElement;
  private topBar: HTMLDivElement;
  private bottomBar: HTMLDivElement;
  private tutorialOverlay: HTMLDivElement;
  private endScreen: HTMLDivElement;
  private waveBanner: HTMLDivElement;
  private store: GameStore;

  private selectedTowerId: string | null = null;
  private selectedNebulaId: string | null = null;
  /** 하단 팔레트 카테고리 탭 (성운 해금 맵에서만 표시) */
  private paletteTab: 'stars' | 'nebulae' = 'stars';
  private paletteTabs!: HTMLDivElement;
  /** 터치 기기(모바일+태블릿) 전용: 팔레트 버튼 홀드로 열람 중인 정보 대상 (바깥 탭 시 해제) */
  private holdInfoKey: { kind: 'tower' | 'nebula'; id: string } | null = null;
  private dismissHoldInfo = (e: PointerEvent) => {
    if (!displayMode.isTouch || !this.holdInfoKey) return;
    if (this.infoPanel.contains(e.target as Node)) return;
    this.holdInfoKey = null;
    this.updateInfoPanel();
  };
  private infoPanel!: HTMLDivElement;
  private audioBtn!: HTMLButtonElement;
  private audioPanel!: HTMLDivElement;
  private audioMuteBtn!: HTMLButtonElement;
  private audioSliders = new Map<VolumeChannel, { slider: HTMLInputElement; pct: HTMLSpanElement }>();
  /** 패널 바깥 클릭 시 닫기 (오디오 버튼 자체 클릭은 토글 로직에 위임) */
  private dismissAudioPanel = (e: PointerEvent) => {
    if (this.audioPanel.style.display === 'none') return;
    const t = e.target as Node;
    if (this.audioPanel.contains(t) || this.audioBtn.contains(t)) return;
    this.audioPanel.style.display = 'none';
  };
  private wavePreview!: HTMLSpanElement;
  private startWaveBtn!: HTMLButtonElement;
  private spellPanel!: HTMLDivElement;
  private spellGaugeFill!: HTMLDivElement;
  private spellGaugeLabel!: HTMLDivElement;
  private spellButtons: Map<string, HTMLButtonElement> = new Map();
  private spellCdLabels: Map<string, HTMLSpanElement> = new Map();
  private mutationPanel!: HTMLDivElement;
  private crisisBanner!: HTMLDivElement;
  availableNebulae: string[] = [];
  currentWaves: WaveDef[] = [];
  isSurvival = false;
  isHeatDeath = false;
  activeMutationNames: string[] = [];
  activeSynergyNames: string[] = [];
  activeSynergyData: { id: string; nameKo: string; description: string; isNew?: boolean }[] = [];
  crisisWarning: string | null = null;
  private selectedSynergyId: string | null = null;
  private synergyTooltip!: HTMLDivElement;
  private backBtn!: HTMLButtonElement;
  private speedBtn!: HTMLButtonElement;
  private infoEl!: HTMLSpanElement;
  private topBarCenter!: HTMLDivElement;
  private _lastSynergyKey = '';
  private _lastBottomKey = '';
  onTowerSelected: ((towerId: string | null) => void) | null = null;
  onNebulaSelected: ((nebulaId: string | null) => void) | null = null;
  onStartWave: (() => void) | null = null;
  onRestart: (() => void) | null = null;
  onCycleSpeed: (() => void) | null = null;
  onBack: (() => void) | null = null;
  onContinue: (() => void) | null = null;
  onCastSpell: ((spellId: string) => void) | null = null;

  constructor(store: GameStore) {
    this.store = store;

    const mob = displayMode.isMobile;

    this.container = document.createElement('div');
    // Safe-area 컨테이너: 노치/상태바/홈 인디케이터 안쪽에만 인터랙티브 UI 배치.
    // 캔버스는 edge-to-edge 유지, absolute라 iOS standalone body 확장 시에도 실제 화면 하단까지 도달.
    this.container.style.cssText = 'position:absolute;top:var(--sd-safe-t, 0px);left:var(--sd-safe-l, 0px);right:var(--sd-safe-r, 0px);bottom:var(--sd-safe-b, 0px);pointer-events:none;z-index:10;font-family:monospace;color:#fff;';
    document.body.appendChild(this.container);

    // Wave preview — inline in top bar center
    this.wavePreview = document.createElement('span');
    this.wavePreview.style.cssText = `font-size:var(--sd-wavepreview-fs);color:#8af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:var(--sd-wavepreview-maxw);display:none;`;

    // Top bar — persistent chrome (back/speed never recreated during render)
    this.topBar = document.createElement('div');
    this.topBar.style.cssText = `position:absolute;top:0;left:0;right:0;height:var(--sd-top-h);background:rgba(0,0,0,0.7);display:flex;align-items:center;gap:var(--sd-top-gap);padding:var(--sd-top-pad);padding-left:var(--sd-top-pad-l);padding-right:var(--sd-top-pad-r);pointer-events:auto;font-size:var(--sd-top-fs);z-index:15;`;
    this.container.appendChild(this.topBar);

    this.backBtn = document.createElement('button');
    this.backBtn.textContent = 'BACK';
    this.backBtn.style.cssText = `background:#322;color:#a88;border:1px solid #544;padding:var(--sd-back-pad);cursor:pointer;font-family:monospace;font-size:var(--sd-back-fs);border-radius:4px;flex-shrink:0;min-height:var(--sd-back-minh);`;
    this.backBtn.onclick = () => this.onBack?.();
    this.topBar.appendChild(this.backBtn);

    this.infoEl = document.createElement('span');
    this.infoEl.style.cssText = 'font-size:var(--sd-info-fs);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;';
    this.topBar.appendChild(this.infoEl);

    this.topBarCenter = document.createElement('div');
    this.topBarCenter.style.cssText = `display:flex;align-items:center;gap:4px;flex:1;min-width:0;overflow:hidden;margin-left:var(--sd-topbar-center-ml);`;
    this.topBar.appendChild(this.topBarCenter);
    this.topBarCenter.appendChild(this.wavePreview);

    this.speedBtn = document.createElement('button');
    this.speedBtn.style.cssText = `background:#333;color:#aaa;border:1px solid #555;padding:var(--sd-speed-pad);cursor:pointer;font-family:monospace;font-size:var(--sd-speed-fs);font-weight:bold;border-radius:4px;min-height:var(--sd-speed-minh);flex-shrink:0;`;
    this.speedBtn.onclick = () => this.onCycleSpeed?.();
    this.topBar.appendChild(this.speedBtn);

    // 오디오 버튼 — 클릭 시 볼륨 조절 패널 토글 (설정은 AudioEngine이 localStorage에 유지)
    this.audioBtn = document.createElement('button');
    this.audioBtn.style.cssText = this.speedBtn.style.cssText;
    this.audioBtn.textContent = audio.muted ? '\u{1F507}' : '\u{1F50A}';
    this.audioBtn.onclick = () => {
      const open = this.audioPanel.style.display !== 'none';
      this.audioPanel.style.display = open ? 'none' : 'block';
      if (!open) this.refreshAudioPanel();
    };
    this.topBar.appendChild(this.audioBtn);
    this.buildAudioPanel();

    // Bottom bar — taller touch targets on mobile
    this.bottomBar = document.createElement('div');
    this.bottomBar.style.cssText = `position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;gap:var(--sd-bot-gap);padding:var(--sd-bot-pad);padding-left:var(--sd-bot-pad-l);padding-right:var(--sd-bot-pad-r);padding-bottom:var(--sd-bot-pad-b);pointer-events:auto;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;`;
    this.container.appendChild(this.bottomBar);

    // 팔레트 카테고리 탭 — 하단바 좌상단에 부착 (성운 해금 시에만 표시)
    this.paletteTabs = document.createElement('div');
    this.paletteTabs.style.cssText = 'position:absolute;left:var(--sd-bot-pad-l, 6px);bottom:0;display:none;gap:2px;pointer-events:auto;z-index:11;';
    this.container.appendChild(this.paletteTabs);

    // Tutorial overlay
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.style.cssText = `position:absolute;top:var(--sd-tut-top);left:50%;transform:translateX(-50%);background:rgba(0,0,30,0.85);border:1px solid #446;padding:var(--sd-tut-pad);border-radius:8px;font-size:var(--sd-tut-fs);text-align:center;pointer-events:auto;display:none;max-width:var(--sd-tut-maxw);`;
    this.container.appendChild(this.tutorialOverlay);

    // Wave banner (shows briefly on wave clear)
    this.waveBanner = document.createElement('div');
    this.waveBanner.style.cssText = `position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:var(--sd-wave-fs);color:#4af;text-shadow:0 0 20px rgba(60,120,255,0.6);pointer-events:none;display:none;font-weight:bold;`;
    this.container.appendChild(this.waveBanner);

    // End screen
    this.endScreen = document.createElement('div');
    this.endScreen.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);pointer-events:auto;';
    this.container.appendChild(this.endScreen);

    // Left info panel — shows tower/nebula details when selected
    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `position:absolute;left:8px;top:50px;width:var(--sd-info-w);background:rgba(0,0,10,0.85);border:1px solid #446;border-radius:8px;padding:12px;pointer-events:auto;display:none;font-size:var(--sd-info-fs);line-height:1.5;color:#ccd;max-height:var(--sd-info-maxh);overflow-y:auto;touch-action:pan-y;scrollbar-width:none;-ms-overflow-style:none;`;
    this.container.appendChild(this.infoPanel);

    if (!document.getElementById('hideScrollbarStyle')) {
      const style = document.createElement('style');
      style.id = 'hideScrollbarStyle';
      style.textContent = '.hide-scrollbar::-webkit-scrollbar{display:none}';
      document.head.appendChild(style);
    }
    this.infoPanel.classList.add('hide-scrollbar');
    this.bottomBar.classList.add('hide-scrollbar');

    // 터치 기기: 정보 패널 바깥을 탭하면 닫힘 (capture — 탭 자체의 동작은 그대로 진행)
    document.addEventListener('pointerdown', this.dismissHoldInfo, true);
    document.addEventListener('pointerdown', this.dismissAudioPanel, true);

    // Synergy tooltip — toggled by clicking a badge
    this.synergyTooltip = document.createElement('div');
    this.synergyTooltip.style.cssText = `position:fixed;top:calc(var(--sd-safe-t, 0px) + var(--sd-syn-top));left:50%;transform:translateX(-50%);background:rgba(10,5,30,0.92);border:1px solid #8866cc;border-radius:6px;padding:var(--sd-syn-pad);font-size:var(--sd-syn-fs);color:#dcd;font-family:monospace;pointer-events:auto;display:none;z-index:30;max-width:var(--sd-syn-maxw);line-height:1.5;white-space:pre-wrap;`;
    this.synergyTooltip.onclick = () => { this.selectedSynergyId = null; this.synergyTooltip.style.display = 'none'; };
    document.body.appendChild(this.synergyTooltip);

    // Start wave button — fixed bottom-right, above footer
    this.startWaveBtn = document.createElement('button');
    this.startWaveBtn.style.cssText = `position:absolute;right:var(--sd-start-r);bottom:var(--sd-start-b);background:#224;color:#aaf;border:2px solid #558;padding:var(--sd-start-pad);cursor:pointer;font-family:monospace;font-size:var(--sd-start-fs);font-weight:bold;border-radius:8px;pointer-events:auto;display:none;z-index:12;text-shadow:0 0 8px rgba(100,120,255,0.4);`;
    this.startWaveBtn.onclick = () => this.onStartWave?.();
    this.container.appendChild(this.startWaveBtn);

    // Persistent spell panel (never destroyed during render)
    this.spellPanel = document.createElement('div');
    this.spellPanel.className = 'spell-panel';
    this.spellPanel.style.cssText = `position:absolute;right:var(--sd-spell-r);top:calc(var(--sd-top-h) + 8px);display:flex;flex-direction:column;gap:var(--sd-spell-gap);pointer-events:auto;z-index:12;`;

    const gaugeBar = document.createElement('div');
    gaugeBar.style.cssText = `width:var(--sd-spell-gauge-w);height:var(--sd-spell-gauge-h);background:#222;border:1px solid #446;border-radius:4px;overflow:hidden;margin-bottom:var(--sd-spell-gauge-mb);`;
    this.spellGaugeFill = document.createElement('div');
    this.spellGaugeFill.style.cssText = 'width:0%;height:100%;background:linear-gradient(to right, #44a, #88f);transition:width 0.2s;';
    gaugeBar.appendChild(this.spellGaugeFill);
    this.spellPanel.appendChild(gaugeBar);

    this.spellGaugeLabel = document.createElement('div');
    this.spellGaugeLabel.style.cssText = 'font-size:var(--sd-spell-fs);color:#88a;text-align:center;margin-bottom:var(--sd-spell-gauge-mb);';
    this.spellPanel.appendChild(this.spellGaugeLabel);

    for (const [sid, sdef] of Object.entries(SPELL_DEFS)) {
      const btn = document.createElement('button');
      btn.style.cssText = `background:#222;color:#556;border:1px solid #334;padding:var(--sd-spell-btn-pad);cursor:default;font-family:monospace;font-size:var(--sd-spell-fs);border-radius:4px;width:var(--sd-spell-w);text-align:center;min-height:var(--sd-spell-btn-minh);`;
      const nameLine = document.createElement('div');
      nameLine.textContent = mob ? sdef.nameKo : `${sdef.nameKo} [${sdef.gaugeCost}]`;
      btn.appendChild(nameLine);
      const descLine = document.createElement('div');
      descLine.textContent = sdef.description;
      descLine.style.cssText = `font-size:var(--sd-spell-desc-fs);color:#667;margin-top:2px;`;
      btn.appendChild(descLine);
      this.spellPanel.appendChild(btn);
      this.spellButtons.set(sid, btn);
    }
    this.container.appendChild(this.spellPanel);

    // Mutation display panel (heat death mode)
    this.mutationPanel = document.createElement('div');
    this.mutationPanel.style.cssText = `position:absolute;right:var(--sd-mut-r);top:var(--sd-mut-top);display:none;flex-direction:column;gap:3px;pointer-events:none;max-width:var(--sd-mut-maxw);`;
    this.container.appendChild(this.mutationPanel);

    // Crisis warning banner (heat death mode)
    this.crisisBanner = document.createElement('div');
    this.crisisBanner.style.cssText = `position:absolute;top:var(--sd-crisis-top);left:50%;transform:translateX(-50%);background:rgba(80,0,0,0.85);border:1px solid #f44;padding:var(--sd-crisis-pad);border-radius:6px;font-size:var(--sd-crisis-fs);color:#f88;text-align:center;pointer-events:none;display:none;white-space:nowrap;text-shadow:0 0 8px rgba(255,60,60,0.4);`;
    this.container.appendChild(this.crisisBanner);

    // Re-render on orientation / resize changes
    window.addEventListener('resize', () => this.render());
    window.visualViewport?.addEventListener('resize', () => this.render());

    // Preload shader programs for instant preview rendering
    preloadPreviewShaders();

    this.render();
  }

  render() {
    const state = this.store.getState();

    this.updateTopBar(state);
    this.updateSpellPanel(state);
    this.updateInfoPanel();
    this.renderBottomBar(state);
    this.updateMutationPanel();
    this.updateCrisisBanner();
  }

  /** Lightweight HUD refresh during wave — skips bottom palette rebuild */
  updateChrome() {
    const state = this.store.getState();
    this.updateTopBar(state);
    this.updateSpellPanel(state);
    this.updateStartWaveBtn(state);
  }

  private updateTopBar(state: ReturnType<GameStore['getState']>) {
    const mob = displayMode.isMobile;
    if (this.isHeatDeath) {
      if (mob) {
        this.infoEl.innerHTML = `W${state.currentWave} ISM:${state.ism} HP:${state.baseHp}`;
      } else {
        this.infoEl.innerHTML = `WAVE ${state.currentWave} &nbsp; ISM: ${state.ism} &nbsp; BASE HP: ${state.baseHp}`;
      }
    } else {
      const waveDisplay = this.isSurvival
        ? `WAVE ${state.currentWave} (Cycle ${state.survivalCycle + 1})`
        : `WAVE ${state.currentWave}/${state.totalWaves}`;
      if (mob) {
        this.infoEl.innerHTML = `W${state.currentWave}${this.isSurvival ? '' : '/' + state.totalWaves} ISM:${state.ism} HP:${state.baseHp}`;
      } else {
        this.infoEl.innerHTML = `${waveDisplay} &nbsp; ISM: ${state.ism} &nbsp; BASE HP: ${state.baseHp}/${state.maxBaseHp}`;
      }
    }

    this.speedBtn.textContent = `x${state.speed}`;
    this.speedBtn.style.background = state.speed > 1 ? '#553' : '#333';
    this.speedBtn.style.color = state.speed > 1 ? '#ff4' : '#aaa';
    this.speedBtn.style.borderColor = state.speed > 1 ? '#885' : '#555';

    // Wave preview (build phase only)
    if (state.phase === 'build' && this.currentWaves.length > 0) {
      const nextIdx = this.isSurvival
        ? state.currentWave % this.currentWaves.length
        : state.currentWave;
      const nextWave = this.currentWaves[nextIdx];
      if (nextWave) {
        const parts: string[] = [];
        for (const s of nextWave.spawns) {
          const eDef = ENEMY_DEFS[s.enemyId];
          const name = eDef ? eDef.nameKo : s.enemyId;
          parts.push(`${name}x${s.count}`);
        }
        this.wavePreview.textContent = parts.join(' ');
        this.wavePreview.style.display = 'inline';
      } else {
        this.wavePreview.style.display = 'none';
      }
    } else {
      this.wavePreview.style.display = 'none';
    }

    this.updateSynergyBadges();
    this.updateStartWaveBtn(state);
  }

  private updateSynergyBadges() {
    const mob = displayMode.isMobile;
    const synergySource = this.activeSynergyData.length > 0 ? this.activeSynergyData : null;
    const synergyKey = synergySource
      ? `${this.selectedSynergyId ?? ''}|${synergySource.map(s => `${s.id}:${s.isNew ? 1 : 0}`).join(',')}`
      : '';

    if (synergyKey !== this._lastSynergyKey) {
      this._lastSynergyKey = synergyKey;
      // Keep wavePreview, remove only synergy badges
      while (this.topBarCenter.childElementCount > 1) {
        this.topBarCenter.lastElementChild?.remove();
      }

      if (synergySource && synergySource.length > 0) {
        for (const syn of synergySource) {
          const isNew = syn.isNew ?? false;
          const selected = this.selectedSynergyId === syn.id;
          const badge = document.createElement('span');
          badge.textContent = isNew ? `★${syn.nameKo}` : syn.nameKo;
          const bg = selected ? 'rgba(140,120,255,0.7)' : isNew ? 'rgba(60,200,120,0.5)' : 'rgba(100,80,200,0.4)';
          const fg = selected ? '#fff' : isNew ? '#8f6' : '#c8b4ff';
          const border = selected ? '#aaf' : isNew ? '#4a4' : '#8866cc';
          badge.style.cssText = `font-size:var(--sd-syn-fs);background:${bg};color:${fg};border:1px solid ${border};border-radius:3px;padding:1px 4px;white-space:nowrap;cursor:pointer;flex-shrink:0;`;
          badge.onclick = (e) => {
            e.stopPropagation();
            if (this.selectedSynergyId === syn.id) {
              this.selectedSynergyId = null;
              this.synergyTooltip.style.display = 'none';
            } else {
              this.selectedSynergyId = syn.id;
              this.synergyTooltip.innerHTML = `<div style="color:${isNew ? '#8f6' : '#c8b4ff'};font-weight:bold;margin-bottom:4px;">${syn.nameKo}</div><div style="color:#aab;">${syn.description}</div>`;
              this.synergyTooltip.style.display = 'block';
            }
            this._lastSynergyKey = '';
            this.updateSynergyBadges();
          };
          this.topBarCenter.appendChild(badge);
        }
      } else if (this.selectedSynergyId) {
        this.selectedSynergyId = null;
        this.synergyTooltip.style.display = 'none';
      }
    }

    if (this.selectedSynergyId && synergySource && !synergySource.some(s => s.id === this.selectedSynergyId)) {
      this.selectedSynergyId = null;
      this.synergyTooltip.style.display = 'none';
      this._lastSynergyKey = '';
      this.updateSynergyBadges();
    }
  }

  private updateStartWaveBtn(state: ReturnType<GameStore['getState']>) {
    const mob = displayMode.isMobile;
    if (state.phase === 'build') {
      this.startWaveBtn.textContent = mob ? `WAVE ${state.currentWave + 1} ▶` : `START WAVE ${state.currentWave + 1}`;
      this.startWaveBtn.style.display = 'block';
    } else {
      this.startWaveBtn.style.display = 'none';
    }
  }

  private renderBottomBar(state: ReturnType<GameStore['getState']>) {
    const mob = displayMode.isMobile;
    const bottomKey = [
      displayMode.mode,
      state.phase,
      state.availableTowers.join(','),
      this.availableNebulae.join(','),
      this.selectedTowerId ?? '',
      this.selectedNebulaId ?? '',
      this.paletteTab,
    ].join('|');
    if (bottomKey === this._lastBottomKey) return;
    this._lastBottomKey = bottomKey;

    this.bottomBar.innerHTML = '';

    const paletteMinH = mob ? 'min-height:44px;' : '';  // touch target size — keep as JS

    // 카테고리 탭 — 성운이 해금된 맵에서만 (그 외엔 탭 없이 항성만: 초반 맵 UI 간결화)
    const hasNebulae = this.availableNebulae.length > 0;
    this.renderPaletteTabs(hasNebulae);
    const showStars = !hasNebulae || this.paletteTab === 'stars';
    const showNebulae = hasNebulae && this.paletteTab === 'nebulae';

    // Tower palette
    if (showStars) for (const tid of state.availableTowers) {
      const def = TOWER_DEFS[tid];
      if (!def) continue;
      const btn = document.createElement('button');
      const selected = this.selectedTowerId === tid;
      btn.textContent = mob ? `${def.nameKo}(${def.cost})` : `${def.nameKo} (${def.cost})`;
      btn.style.cssText = `background:${selected ? '#446' : '#223'};color:#ddf;border:1px solid ${selected ? '#88a' : '#445'};padding:var(--sd-bot-btn-pad);cursor:pointer;font-family:monospace;font-size:var(--sd-bot-btn-fs);border-radius:4px;white-space:nowrap;flex-shrink:0;${paletteMinH}`;
      btn.onclick = () => {
        this.selectedNebulaId = null;
        this.selectedTowerId = this.selectedTowerId === tid ? null : tid;
        this.onTowerSelected?.(this.selectedTowerId);
        this.render();
      };
      if (displayMode.isTouch) this.bindHoldToInspect(btn, 'tower', tid);
      this.bottomBar.appendChild(btn);
    }

    // Nebula palette
    if (!showNebulae) return;

    for (const nid of this.availableNebulae) {
      const def = NEBULA_DEFS[nid];
      const btn = document.createElement('button');
      const selected = this.selectedNebulaId === nid;
      btn.textContent = mob ? `${def.nameKo}(${def.cost})` : `${def.nameKo} (${def.cost})`;
      btn.style.cssText = `background:${selected ? '#243' : '#1a2a1a'};color:#aec;border:1px solid ${selected ? '#4a6' : '#354'};padding:var(--sd-bot-btn-pad);cursor:pointer;font-family:monospace;font-size:var(--sd-bot-btn-fs);border-radius:4px;white-space:nowrap;flex-shrink:0;${paletteMinH}`;
      btn.onclick = () => {
        this.selectedTowerId = null;
        this.selectedNebulaId = this.selectedNebulaId === nid ? null : nid;
        this.onNebulaSelected?.(this.selectedNebulaId);
        this.render();
      };
      if (displayMode.isTouch) this.bindHoldToInspect(btn, 'nebula', nid);
      this.bottomBar.appendChild(btn);
    }
  }

  /** 팔레트 좌상단 카테고리 탭 렌더링. 하단바 높이에 맞춰 바로 위에 부착 */
  private renderPaletteTabs(visible: boolean) {
    if (!visible) {
      this.paletteTabs.style.display = 'none';
      if (this.paletteTab !== 'stars') this.paletteTab = 'stars';
      return;
    }
    this.paletteTabs.style.display = 'flex';
    this.paletteTabs.innerHTML = '';

    const tabs: { id: 'stars' | 'nebulae'; label: string; hasSelection: boolean }[] = [
      { id: 'stars', label: '★ 항성', hasSelection: this.selectedTowerId !== null },
      { id: 'nebulae', label: '✻ 성운', hasSelection: this.selectedNebulaId !== null },
    ];

    for (const tab of tabs) {
      const active = this.paletteTab === tab.id;
      const btn = document.createElement('button');
      // 비활성 탭에 현재 선택이 있으면 점 표시로 위치 안내
      btn.textContent = tab.label + (!active && tab.hasSelection ? ' •' : '');
      btn.style.cssText = [
        `background:${active ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)'}`,
        `color:${active ? (tab.id === 'stars' ? '#8af' : '#8ea') : '#667'}`,
        `border:1px solid ${active ? '#446' : '#334'}`,
        'border-bottom:none',
        'border-radius:6px 6px 0 0',
        'padding:3px 10px 4px',
        'cursor:pointer',
        'font-family:monospace',
        'font-size:var(--sd-bot-btn-fs, 11px)',
        'white-space:nowrap',
      ].join(';');
      btn.onclick = () => {
        if (this.paletteTab === tab.id) return;
        this.paletteTab = tab.id;
        this.render();
      };
      this.paletteTabs.appendChild(btn);
    }

    // 하단바 실제 높이 위에 부착 (레이아웃 확정 후 측정)
    requestAnimationFrame(() => {
      this.paletteTabs.style.bottom = `${this.bottomBar.offsetHeight}px`;
    });
  }

  /** 터치 기기: 팔레트 버튼을 ~400ms 홀드하면 정보 패널 표시. 홀드 후 딸려오는 click(선택 토글)은 무시 */
  private bindHoldToInspect(btn: HTMLButtonElement, kind: 'tower' | 'nebula', id: string) {
    btn.style.userSelect = 'none';
    (btn.style as any).webkitUserSelect = 'none';
    (btn.style as any).webkitTouchCallout = 'none';
    btn.oncontextmenu = (e) => e.preventDefault();

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;
    let held = false;

    const cancel = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    btn.onpointerdown = (e) => {
      held = false;
      startX = e.clientX;
      startY = e.clientY;
      cancel();
      timer = setTimeout(() => {
        timer = null;
        held = true;
        this.holdInfoKey = { kind, id };
        this.updateInfoPanel();
      }, 400);
    };
    btn.onpointermove = (e) => {
      if (timer && (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10)) cancel();
    };
    btn.onpointerup = cancel;
    btn.onpointercancel = cancel;
    btn.onpointerleave = cancel;

    // 홀드가 발동됐으면 뒤따르는 click(선택 토글)을 무시
    const prevClick = btn.onclick;
    btn.onclick = (e) => {
      if (held) { held = false; return; }
      prevClick?.call(btn, e);
    };
  }

  showTutorial(text: string) {
    this.tutorialOverlay.textContent = text;
    this.tutorialOverlay.style.display = 'block';
  }

  hideTutorial() {
    this.tutorialOverlay.style.display = 'none';
  }

  private updateSpellPanel(state: ReturnType<GameStore['getState']>) {
    const mob = displayMode.isMobile;
    this.spellGaugeFill.style.width = `${state.spellGauge}%`;
    this.spellGaugeLabel.textContent = mob ? `${Math.floor(state.spellGauge)}%` : `GAUGE ${Math.floor(state.spellGauge)}/100`;

    for (const [sid, sdef] of Object.entries(SPELL_DEFS)) {
      const btn = this.spellButtons.get(sid);
      if (!btn) continue;
      const cd = state.spellCooldowns[sid] ?? 0;
      const canCast = state.spellGauge >= sdef.gaugeCost && cd <= 0;
      const cdText = cd > 0 ? ` (${Math.ceil(cd)}s)` : '';
      const nameEl = btn.children[0] as HTMLDivElement;
      if (nameEl) nameEl.textContent = mob ? `${sdef.nameKo}${cdText}` : `${sdef.nameKo} [${sdef.gaugeCost}]${cdText}`;
      btn.style.background = canCast ? '#335' : '#222';
      btn.style.color = canCast ? '#aaf' : '#556';
      btn.style.borderColor = canCast ? '#558' : '#334';
      btn.style.cursor = canCast ? 'pointer' : 'default';
      btn.onclick = canCast ? () => this.onCastSpell?.(sid) : null;
    }
  }

  private _lastInfoKey: string | null = null;

  private updateInfoPanel() {
    const mob = displayMode.isMobile;
    // 터치 기기(모바일+태블릿): 선택과 무관하게 홀드로 열람 중인 대상만 표시 (화면 가림 최소화)
    const touch = displayMode.isTouch;
    const towerId = touch
      ? (this.holdInfoKey?.kind === 'tower' ? this.holdInfoKey.id : null)
      : this.selectedTowerId;
    const nebulaId = touch
      ? (this.holdInfoKey?.kind === 'nebula' ? this.holdInfoKey.id : null)
      : this.selectedNebulaId;
    // 모드가 바뀌면 JS 보간 폰트 크기 등이 달라지므로 캐시 키에 모드 포함
    const infoKey = (towerId ?? nebulaId) ? `${displayMode.mode}|${towerId ?? nebulaId}` : null;
    if (!infoKey) {
      if (this._lastInfoKey !== null) {
        disposeNebulaPreview();
        this.infoPanel.style.display = 'none';
        this.infoPanel.innerHTML = '';
        this._lastInfoKey = null;
      }
      return;
    }
    if (infoKey === this._lastInfoKey) return;
    this._lastInfoKey = infoKey;

    disposeNebulaPreview();
    this.infoPanel.style.visibility = 'hidden';
    this.infoPanel.style.display = 'block';
    this.infoPanel.innerHTML = '';

    const fs = mob ? 10 : 11;     // used in JS string interpolation for DOM creation
    const fsSmall = mob ? 8 : 9;

    if (towerId) {
      const def = TOWER_DEFS[towerId];
      if (!def) return;

      // Name
      const header = document.createElement('div');
      header.style.cssText = `font-size:${fs + 2}px;font-weight:bold;margin-bottom:4px;color:#eef;line-height:1.2;`;
      header.textContent = def.nameKo;
      this.infoPanel.appendChild(header);

      // Spectral type + role tag
      const metaRow = document.createElement('div');
      metaRow.style.cssText = 'display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:8px;';

      const specChip = document.createElement('span');
      specChip.style.cssText = `font-size:${fsSmall}px;color:#667;font-family:monospace;padding:1px 5px;border-radius:3px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);line-height:1.5;`;
      specChip.textContent = def.spectralType;
      metaRow.appendChild(specChip);

      const role = getTowerRoleTag(towerId, def);
      if (role) {
        const rs = getRoleTagStyle(role.category);
        const rolePill = document.createElement('span');
        rolePill.textContent = role.label;
        rolePill.title = '전투 역할';
        rolePill.style.cssText = [
          `font-size:${fsSmall}px`,
          'font-weight:bold',
          'padding:2px 8px',
          'border-radius:99px',
          `background:${rs.bg}`,
          `border:1px solid ${rs.border}`,
          `color:${rs.color}`,
          'letter-spacing:0.2px',
          'line-height:1.5',
          'white-space:nowrap',
        ].join(';');
        metaRow.appendChild(rolePill);
      }

      this.infoPanel.appendChild(metaRow);

      // Live shader preview (same GLSL as in-game towerStar shader)
      const previewSize = mob ? 56 : 64;
      const [r, g, b] = applyVisualTint(ciToRgb(def.ci), getTowerVisual(def));
      const previewCanvas = createTowerPreview([r, g, b], previewSize);
      this.infoPanel.appendChild(previewCanvas);

      // Stats table
      const rate = def.attackRate > 0 ? def.attackRate.toFixed(1) : '-';
      const dmg = def.noAttack ? '-' : `${def.damage}`;
      const sellValue = Math.floor(def.cost * 0.5);
      const statsHtml = `<div style="font-size:${fs}px;color:#aab;line-height:1.8;">` +
        `DMG: <span style="color:#fff;">${dmg}</span><br>` +
        `RATE: <span style="color:#fff;">${rate}/s</span><br>` +
        `RNG: <span style="color:#fff;">${def.range}</span><br>` +
        `COST: <span style="color:#fff;">${def.cost} ISM</span><br>` +
        `<span style="font-size:${fsSmall}px;color:#a88;">철거 환불: ${sellValue} ISM</span>` +
        `</div>`;
      const stats = document.createElement('div');
      stats.innerHTML = statsHtml;
      this.infoPanel.appendChild(stats);

      // Special ability / mechanic notes
      const specialDescs: Record<string, string> = {
        betelgeuse: `${def.wavesUntilExplosion ?? 5}웨이브 생존 후 초신성 폭발\n반경 ${def.explosionRadius ?? 3}타일, ${Math.round(def.damage * (def.explosionDamageMult ?? 12.5))} 데미지\n폭발 자리에 잔해 성운(지속 피해 영역) 영구 잔류`,
        magnetar: '높은 사거리의 자기장 사격',
        supernova_remnant: '자동 공격 없음\n주변 적에게 지속 피해 (DoT 영역)',
        planetary_nebula: '자동 공격 없음\n범위 내 적 방어력 -5 디버프 오라',
        black_hole: '자동 공격 없음\n반경 내 적 즉사 (보스 포함)',
        pulsar: `자동 공격 없음\n${def.pulsarInterval ?? 2}초 주기 360° 넉백 + ${def.pulsarStunDuration ?? 0.5}초 기절`,
        flare_star: `통상 사격 + 5초마다 플레어 폭발\n범위 내 전체 적에게 데미지×2`,
        binary_system: '2연발 사격 (각 발 동일 데미지)\n두 발이 동시에 발사된다',
        a_supergiant: '통상 사격 + 반경 2.5타일 버프 오라\n주변 아군 타워 데미지 +15%',
        pulsating_variable: '자동 공격 없음\n3초 주기 범위 2타일 에너지 펄스\n30 데미지',
        sgr_repeater: `통상 사격 + 10초마다 감마선 버스트\n직선 관통 공격 (데미지×3)`,
      };
      if (def.specialType && specialDescs[def.specialType]) {
        const special = document.createElement('div');
        special.style.cssText = `font-size:${fsSmall}px;color:#f8d;margin-top:6px;border-top:1px solid #335;padding-top:4px;white-space:pre-line;line-height:1.5;`;
        special.textContent = specialDescs[def.specialType];
        this.infoPanel.appendChild(special);
      }

      if (def.splashRadius) {
        const splash = document.createElement('div');
        splash.style.cssText = `font-size:${fsSmall}px;color:#fa8;margin-top:4px;white-space:pre-line;line-height:1.5;`;
        splash.textContent = `항성풍 스플래시: 반경 ${def.splashRadius}타일\n직격 100% / 범위 내 50% 피해`;
        this.infoPanel.appendChild(splash);
      }

      // Lore description
      if (def.descriptionKo) {
        const lore = document.createElement('div');
        lore.style.cssText = `font-size:${mob ? 9 : 10}px;color:#778;margin-top:6px;line-height:1.5;border-top:1px solid #223;padding-top:4px;`;
        lore.textContent = def.descriptionKo;
        this.infoPanel.appendChild(lore);
      }

      // Evolution tree with actual costs
      const evo = getEvolutions(towerId);
      if (evo) {
        const evoDiv = document.createElement('div');
        evoDiv.style.cssText = `font-size:${fsSmall}px;color:#8af;margin-top:6px;border-top:1px solid #335;padding-top:4px;line-height:1.6;`;
        let evoHtml = '<div style="color:#669;margin-bottom:2px;">진화</div>';
        for (const p of evo.paths) {
          const actualCost = Math.round(p.cost * (def.cost / 50));
          evoHtml += `→ ${p.nameKo} <span style="color:#fff;">(${actualCost} ISM)</span> ${p.description}<br>`;
        }
        evoDiv.innerHTML = evoHtml;
        this.infoPanel.appendChild(evoDiv);
      }
    } else if (nebulaId) {
      const def = NEBULA_DEFS[nebulaId];
      if (!def) return;

      // Name + messier type
      const header = document.createElement('div');
      header.style.cssText = `font-size:${fs + 2}px;font-weight:bold;margin-bottom:6px;color:#eef;`;
      header.textContent = `${def.nameKo} [${def.messierType}]`;
      this.infoPanel.appendChild(header);

      // Live shader preview (same GLSL as in-game)
      const previewSize = mob ? 56 : 64;
      const previewCanvas = createNebulaPreview(def.messierType, def.shaderColor, previewSize);
      this.infoPanel.appendChild(previewCanvas);

      // Effect description
      const effectDescs: Record<string, string> = {
        attack_buff: `공격력 +${Math.round(def.effectValue * 100)}%`,
        homing: '투사체 유도',
        slow: `감속 ${Math.round(def.effectValue * 100)}%`,
        armor_debuff: `방어력 -${def.effectValue}`,
        dot: `초당 ${def.effectValue} 피해`,
      };
      const effectText = effectDescs[def.effect] ?? def.effect;
      const effectEl = document.createElement('div');
      effectEl.style.cssText = `font-size:${fs}px;color:#aec;margin-bottom:6px;`;
      effectEl.textContent = effectText;
      this.infoPanel.appendChild(effectEl);

      // Range + Cost
      const statsEl = document.createElement('div');
      statsEl.style.cssText = `font-size:${fs}px;color:#aab;line-height:1.8;`;
      statsEl.innerHTML = `RNG: <span style="color:#fff;">${def.range}</span><br>COST: <span style="color:#fff;">${def.cost} ISM</span>`;
      this.infoPanel.appendChild(statsEl);

      // Placement rule
      const placeNote = document.createElement('div');
      placeNote.style.cssText = `font-size:${fsSmall}px;color:#886;margin-top:4px;`;
      placeNote.textContent = '※ 경로 타일 위에만 배치 가능';
      this.infoPanel.appendChild(placeNote);

      // Stacking diminish info
      if (def.effect !== 'homing') {
        const stackEl = document.createElement('div');
        stackEl.style.cssText = `font-size:${fsSmall}px;color:#997;margin-top:4px;border-top:1px solid #332;padding-top:4px;line-height:1.5;`;

        if (def.effect === 'slow') {
          const v = def.effectValue;
          let mult = 1.0;
          const rows: string[] = [];
          for (let i = 0; i < 4; i++) {
            const dim = 1 / (1 + i * 0.5);
            mult *= (1.0 - v * dim);
            const spd = Math.max(Math.round(mult * 100), 20);
            rows.push(`${i + 1}개: 속도 ${spd}%`);
          }
          stackEl.innerHTML = `중첩 시 감속 (곱셈 적용, 하한 20%)<br><span style="color:#aab;">${rows.join(' → ')}</span>`;
        } else {
          const v = def.effectValue;
          const rows: string[] = [];
          for (let i = 0; i < 3; i++) {
            const dim = 1 / (1 + i * 0.5);
            const val = +(v * dim).toFixed(1);
            const label = def.effect === 'attack_buff' ? `+${Math.round(val * 100)}%`
              : def.effect === 'armor_debuff' ? `-${val}`
              : `${val}`;
            rows.push(`${i + 1}개: ${label}`);
          }
          stackEl.innerHTML = `중첩 시 효과 감쇠<br><span style="color:#aab;">${rows.join(' → ')} …</span>`;
        }
        this.infoPanel.appendChild(stackEl);
      }

      // Lore description
      if (def.descriptionKo) {
        const lore = document.createElement('div');
        lore.style.cssText = `font-size:${mob ? 9 : 10}px;color:#778;margin-top:6px;line-height:1.5;border-top:1px solid #223;padding-top:4px;`;
        lore.textContent = def.descriptionKo;
        this.infoPanel.appendChild(lore);
      }
    }

    this.infoPanel.style.visibility = 'visible';
  }

  private updateMutationPanel() {
    const mob = displayMode.isMobile;
    if (!this.isHeatDeath || this.activeMutationNames.length === 0) {
      this.mutationPanel.style.display = 'none';
      return;
    }
    this.mutationPanel.style.display = 'flex';
    this.mutationPanel.innerHTML = '';

    const label = document.createElement('div');
    label.textContent = '돌연변이';
    label.style.cssText = `font-size:${mob ? 8 : 9}px;color:#f8d;text-align:right;margin-bottom:2px;`;
    this.mutationPanel.appendChild(label);

    for (const name of this.activeMutationNames) {
      const tag = document.createElement('div');
      tag.textContent = name;
      tag.style.cssText = `font-size:${mob ? 9 : 10}px;color:#c8a;background:rgba(255,100,200,0.1);border:1px solid rgba(255,100,200,0.3);border-radius:3px;padding:1px 4px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
      this.mutationPanel.appendChild(tag);
    }
  }

  private updateCrisisBanner() {
    if (!this.crisisWarning) {
      this.crisisBanner.style.display = 'none';
      return;
    }
    this.crisisBanner.textContent = this.crisisWarning;
    this.crisisBanner.style.display = 'block';
  }

  setCrisisWarning(text: string | null) {
    this.crisisWarning = text;
    this.updateCrisisBanner();
  }

  setActiveMutations(names: string[]) {
    this.activeMutationNames = names;
  }

  showHeatDeathEndScreen(wave: number, kills: number, mutations: string[], bestWave: number, isNewBest: boolean) {
    const mob = displayMode.isMobile;
    this.endScreen.style.display = 'flex';
    this.endScreen.innerHTML = '';

    const title = document.createElement('div');
    title.textContent = '열사의 장 — 종료';
    title.style.cssText = `font-size:${mob ? 20 : 28}px;margin-bottom:${mob ? 8 : 16}px;color:#f8d;text-shadow:0 0 20px rgba(255,100,200,0.4);`;
    this.endScreen.appendChild(title);

    const stats = document.createElement('div');
    stats.style.cssText = `font-size:${mob ? 12 : 14}px;color:#aab;margin-bottom:${mob ? 12 : 20}px;text-align:center;line-height:2;`;
    stats.innerHTML = `도달 웨이브: <span style="color:#fff;font-size:${mob ? 16 : 20}px;font-weight:bold;">${wave}</span><br>적 처치: ${kills}<br>돌연변이: ${mutations.length}개`;
    if (isNewBest) {
      stats.innerHTML += `<br><span style="color:#ff4;font-weight:bold;">★ 신기록! ★</span>`;
    } else {
      stats.innerHTML += `<br>최고 기록: ${bestWave} 웨이브`;
    }
    this.endScreen.appendChild(stats);

    if (mutations.length > 0) {
      const mutList = document.createElement('div');
      mutList.style.cssText = `font-size:${mob ? 10 : 11}px;color:#c8a;margin-bottom:${mob ? 12 : 20}px;text-align:center;line-height:1.6;`;
      mutList.textContent = mutations.join(', ');
      this.endScreen.appendChild(mutList);
    }

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;';
    const endBtnPad = mob ? '10px 20px' : '10px 24px';
    const endBtnFont = mob ? 13 : 14;
    const endBtnMinH = mob ? 'min-height:44px;' : '';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = '재도전';
    retryBtn.style.cssText = `background:#335;color:#aaf;border:1px solid #558;padding:${endBtnPad};cursor:pointer;font-family:monospace;font-size:${endBtnFont}px;border-radius:4px;${endBtnMinH}`;
    retryBtn.onclick = () => this.onRestart?.();
    btnRow.appendChild(retryBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = '맵 선택';
    backBtn.style.cssText = `background:#322;color:#a88;border:1px solid #544;padding:${endBtnPad};cursor:pointer;font-family:monospace;font-size:${endBtnFont}px;border-radius:4px;${endBtnMinH}`;
    backBtn.onclick = () => this.onBack?.();
    btnRow.appendChild(backBtn);

    this.endScreen.appendChild(btnRow);
  }

  showEndScreen(victory: boolean, _mapId?: string) {
    const mob = displayMode.isMobile;
    this.endScreen.style.display = 'flex';
    this.endScreen.innerHTML = '';

    const state = this.store.getState();

    const title = document.createElement('div');
    title.textContent = victory ? 'WAVE CLEAR!' : 'GAME OVER';
    title.style.cssText = `font-size:${mob ? 22 : 32}px;margin-bottom:${mob ? 8 : 16}px;color:${victory ? '#4af' : '#f44'}`;
    this.endScreen.appendChild(title);

    const desc = document.createElement('div');
    desc.textContent = victory ? '방어 성공! 다음 항로가 개방됩니다.' : '기지가 파괴되었습니다.';
    desc.style.cssText = `font-size:${mob ? 12 : 14}px;margin-bottom:${mob ? 8 : 16}px;color:#aaa`;
    this.endScreen.appendChild(desc);

    const stats = document.createElement('div');
    stats.style.cssText = `font-size:${mob ? 11 : 13}px;color:#889;margin-bottom:${mob ? 12 : 24}px;text-align:center;line-height:1.8;`;
    if (victory) {
      stats.innerHTML = `적 처치: ${state.enemiesKilled}<br>타워 배치: ${state.towersPlaced}<br>웨이브 생존: ${state.currentWave}`;
    } else {
      stats.innerHTML = `도달 웨이브: ${state.currentWave}<br>적 처치: ${state.enemiesKilled}<br>타워 배치: ${state.towersPlaced}`;
    }
    this.endScreen.appendChild(stats);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;';

    const endBtnPad = mob ? '10px 20px' : '10px 24px';
    const endBtnFont = mob ? 13 : 14;
    const endBtnMinH = mob ? 'min-height:44px;' : '';

    if (victory) {
      const contBtn = document.createElement('button');
      contBtn.textContent = 'CONTINUE';
      contBtn.style.cssText = `background:#335;color:#aaf;border:1px solid #558;padding:${endBtnPad};cursor:pointer;font-family:monospace;font-size:${endBtnFont}px;border-radius:4px;${endBtnMinH}`;
      contBtn.onclick = () => this.onContinue?.();
      btnRow.appendChild(contBtn);
    } else {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'RETRY';
      retryBtn.style.cssText = `background:#335;color:#aaf;border:1px solid #558;padding:${endBtnPad};cursor:pointer;font-family:monospace;font-size:${endBtnFont}px;border-radius:4px;${endBtnMinH}`;
      retryBtn.onclick = () => this.onRestart?.();
      btnRow.appendChild(retryBtn);

      const backBtn = document.createElement('button');
      backBtn.textContent = 'MAP SELECT';
      backBtn.style.cssText = `background:#322;color:#a88;border:1px solid #544;padding:${endBtnPad};cursor:pointer;font-family:monospace;font-size:${endBtnFont}px;border-radius:4px;${endBtnMinH}`;
      backBtn.onclick = () => this.onBack?.();
      btnRow.appendChild(backBtn);
    }

    this.endScreen.appendChild(btnRow);
  }

  hideEndScreen() {
    this.endScreen.style.display = 'none';
  }

  showWaveBanner(waveNum: number, reward: number) {
    this.waveBanner.textContent = `WAVE ${waveNum} CLEAR  +${reward} ISM`;
    this.waveBanner.style.display = 'block';
    this.waveBanner.style.opacity = '1';
    setTimeout(() => {
      this.waveBanner.style.opacity = '0';
      this.waveBanner.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        this.waveBanner.style.display = 'none';
        this.waveBanner.style.transition = '';
      }, 500);
    }, 1200);
  }

  getSelectedTowerId(): string | null {
    return this.selectedTowerId;
  }

  getSelectedNebulaId(): string | null {
    return this.selectedNebulaId;
  }

  clearSelection() {
    this.selectedTowerId = null;
    this.selectedNebulaId = null;
  }

  /** 오디오 버튼 하단 부착형 볼륨 패널: 마스터/배경음악/효과음 슬라이더 + 음소거 토글 */
  private buildAudioPanel() {
    this.audioPanel = document.createElement('div');
    this.audioPanel.style.cssText = `position:absolute;top:calc(var(--sd-top-h) + 6px);right:6px;width:250px;background:rgba(5,5,25,0.94);border:1px solid #446;border-radius:8px;padding:10px 12px;pointer-events:auto;display:none;z-index:40;font-family:monospace;box-shadow:0 4px 16px rgba(0,0,0,0.5);`;
    this.container.appendChild(this.audioPanel);

    // 헤더: 제목 + 측면 음소거 토글
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    const title = document.createElement('span');
    title.textContent = '음량 설정';
    title.style.cssText = 'font-size:12px;color:#8af;font-weight:bold;';
    this.audioMuteBtn = document.createElement('button');
    this.audioMuteBtn.style.cssText = 'background:#333;color:#aaa;border:1px solid #555;padding:3px 8px;cursor:pointer;font-family:monospace;font-size:13px;border-radius:4px;';
    this.audioMuteBtn.onclick = () => {
      audio.toggleMute();
      this.refreshAudioPanel();
    };
    header.appendChild(title);
    header.appendChild(this.audioMuteBtn);
    this.audioPanel.appendChild(header);

    const rows: { channel: VolumeChannel; label: string }[] = [
      { channel: 'master', label: '마스터' },
      { channel: 'music', label: '배경음악' },
      { channel: 'sfx', label: '효과음' },
    ];

    for (const { channel, label } of rows) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:7px 0;';

      const lab = document.createElement('span');
      lab.textContent = label;
      lab.style.cssText = 'font-size:11px;color:#ccc;width:56px;flex-shrink:0;';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.step = '1';
      slider.value = String(Math.round(audio.getVolume(channel) * 100));
      slider.style.cssText = 'flex:1;min-width:0;accent-color:#4af;cursor:pointer;height:18px;';

      const pct = document.createElement('span');
      pct.textContent = `${slider.value}%`;
      pct.style.cssText = 'font-size:11px;color:#8af;width:36px;text-align:right;flex-shrink:0;';

      slider.oninput = () => {
        audio.setVolume(channel, Number(slider.value) / 100);
        pct.textContent = `${slider.value}%`;
      };
      // 드래그 종료 시 확인음 (효과음/마스터만 — 음악은 재생 중이라 즉시 체감됨)
      slider.onchange = () => {
        if (channel !== 'music') audio.play('ui_select');
      };

      row.appendChild(lab);
      row.appendChild(slider);
      row.appendChild(pct);
      this.audioPanel.appendChild(row);
      this.audioSliders.set(channel, { slider, pct });
    }

    this.refreshAudioPanel();
  }

  /** 뮤트 상태·슬라이더 값을 현재 설정과 동기화 */
  private refreshAudioPanel() {
    const muted = audio.muted;
    this.audioBtn.textContent = muted ? '\u{1F507}' : '\u{1F50A}';
    this.audioMuteBtn.textContent = muted ? '\u{1F507} 해제' : '\u{1F50A} 음소거';
    for (const [channel, { slider, pct }] of this.audioSliders) {
      const v = Math.round(audio.getVolume(channel) * 100);
      slider.value = String(v);
      pct.textContent = `${v}%`;
      slider.style.opacity = muted ? '0.45' : '1';
      pct.style.opacity = muted ? '0.45' : '1';
    }
  }

  dispose() {
    document.removeEventListener('pointerdown', this.dismissHoldInfo, true);
    document.removeEventListener('pointerdown', this.dismissAudioPanel, true);
    disposeNebulaPreview();
    this.synergyTooltip.remove();
    this.container.remove();
  }
}
