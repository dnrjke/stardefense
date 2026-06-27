import type { GameStore } from '@/app/store/GameStore';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import { NEBULA_DEFS } from '@/shared/data/NebulaData';
import { SPELL_DEFS } from '@/shared/data/SpellData';
import { ENEMY_DEFS } from '@/shared/data/EnemyData';
import type { WaveDef } from '@/shared/data/WaveData';
import { EVOLUTION_TREE, getEvolutions } from '@/engines/tower/EvolutionSystem';
import { ciToRgb } from '@/shared/data/ColorUtil';
import { createNebulaPreview, createTowerPreview, disposeNebulaPreview } from '@/shared/ui/NebulaPreview';

/** Detect mobile landscape: narrow height + touch support */
function isMobileLandscape(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  return hasTouch && vh <= 600 && vw > vh;
}

/** Safe-area CSS value with fallback */
function safeInset(side: string, fallback = '0px'): string {
  return `env(safe-area-inset-${side}, ${fallback})`;
}

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
  private infoPanel!: HTMLDivElement;
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
  crisisWarning: string | null = null;
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

    const mob = isMobileLandscape();

    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;font-family:monospace;color:#fff;';
    document.body.appendChild(this.container);

    // Top bar — compact on mobile
    this.topBar = document.createElement('div');
    this.topBar.style.cssText = `position:absolute;top:0;left:0;right:0;height:${mob ? 36 : 40}px;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:space-between;padding:0 ${mob ? '8px' : '16px'};padding-left:calc(${mob ? '8px' : '16px'} + ${safeInset('left')});padding-right:calc(${mob ? '8px' : '16px'} + ${safeInset('right')});pointer-events:auto;font-size:${mob ? 12 : 14}px;`;
    this.container.appendChild(this.topBar);

    // Bottom bar — taller touch targets on mobile
    this.bottomBar = document.createElement('div');
    this.bottomBar.style.cssText = `position:absolute;bottom:0;left:0;right:0;height:${mob ? 56 : 64}px;background:rgba(0,0,0,0.7);display:flex;align-items:center;gap:${mob ? '4px' : '8px'};padding:0 ${mob ? '6px' : '16px'};padding-left:calc(${mob ? '6px' : '16px'} + ${safeInset('left')});padding-right:calc(${mob ? '6px' : '16px'} + ${safeInset('right')});padding-bottom:${safeInset('bottom')};pointer-events:auto;overflow-x:auto;-webkit-overflow-scrolling:touch;`;
    this.container.appendChild(this.bottomBar);

    // Tutorial overlay
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.style.cssText = `position:absolute;top:${mob ? 40 : 50}px;left:50%;transform:translateX(-50%);background:rgba(0,0,30,0.85);border:1px solid #446;padding:${mob ? '8px 16px' : '12px 24px'};border-radius:8px;font-size:${mob ? 12 : 14}px;text-align:center;pointer-events:auto;display:none;max-width:${mob ? '90vw' : '400px'};`;
    this.container.appendChild(this.tutorialOverlay);

    // Wave banner (shows briefly on wave clear)
    this.waveBanner = document.createElement('div');
    this.waveBanner.style.cssText = `position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:${mob ? 18 : 24}px;color:#4af;text-shadow:0 0 20px rgba(60,120,255,0.6);pointer-events:none;display:none;font-weight:bold;`;
    this.container.appendChild(this.waveBanner);

    // End screen
    this.endScreen = document.createElement('div');
    this.endScreen.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);pointer-events:auto;';
    this.container.appendChild(this.endScreen);

    // Left info panel — shows tower/nebula details when selected
    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `position:absolute;left:calc(8px + ${safeInset('left')});top:50px;width:${mob ? 140 : 180}px;background:rgba(0,0,10,0.85);border:1px solid #446;border-radius:8px;padding:12px;pointer-events:auto;display:none;font-size:${mob ? 10 : 11}px;line-height:1.5;color:#ccd;max-height:calc(100vh - 50px - ${mob ? 56 : 64}px - 16px);overflow-y:auto;touch-action:pan-y;scrollbar-width:none;-ms-overflow-style:none;`;
    this.container.appendChild(this.infoPanel);

    if (!document.getElementById('hideScrollbarStyle')) {
      const style = document.createElement('style');
      style.id = 'hideScrollbarStyle';
      style.textContent = '.hide-scrollbar::-webkit-scrollbar{display:none}';
      document.head.appendChild(style);
    }
    this.infoPanel.classList.add('hide-scrollbar');

    // Wave preview — inline in top bar (no separate overlay)
    this.wavePreview = document.createElement('span');
    this.wavePreview.style.cssText = `font-size:${mob ? 10 : 11}px;color:#8af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${mob ? '30vw' : '300px'};display:none;margin-left:${mob ? 4 : 8}px;`;

    // Start wave button — fixed bottom-right, above footer
    this.startWaveBtn = document.createElement('button');
    this.startWaveBtn.style.cssText = `position:absolute;right:calc(${mob ? '8px' : '16px'} + ${safeInset('right')});bottom:calc(${mob ? '64px' : '76px'} + ${safeInset('bottom')});background:#224;color:#aaf;border:2px solid #558;padding:${mob ? '10px 16px' : '10px 20px'};cursor:pointer;font-family:monospace;font-size:${mob ? 13 : 14}px;font-weight:bold;border-radius:8px;pointer-events:auto;display:none;z-index:12;text-shadow:0 0 8px rgba(100,120,255,0.4);`;
    this.startWaveBtn.onclick = () => this.onStartWave?.();
    this.container.appendChild(this.startWaveBtn);

    // Persistent spell panel (never destroyed during render)
    this.spellPanel = document.createElement('div');
    this.spellPanel.className = 'spell-panel';
    const spellRight = mob ? `calc(8px + ${safeInset('right')})` : '12px';
    const spellTop = mob ? '38px' : '50px';
    this.spellPanel.style.cssText = `position:absolute;right:${spellRight};top:${spellTop};display:flex;flex-direction:column;gap:${mob ? '4px' : '6px'};pointer-events:auto;`;

    const gaugeW = mob ? 72 : 100;
    const gaugeBar = document.createElement('div');
    gaugeBar.style.cssText = `width:${gaugeW}px;height:${mob ? 8 : 10}px;background:#222;border:1px solid #446;border-radius:4px;overflow:hidden;margin-bottom:${mob ? 2 : 4}px;`;
    this.spellGaugeFill = document.createElement('div');
    this.spellGaugeFill.style.cssText = 'width:0%;height:100%;background:linear-gradient(to right, #44a, #88f);transition:width 0.2s;';
    gaugeBar.appendChild(this.spellGaugeFill);
    this.spellPanel.appendChild(gaugeBar);

    this.spellGaugeLabel = document.createElement('div');
    this.spellGaugeLabel.style.cssText = `font-size:${mob ? 9 : 10}px;color:#88a;text-align:center;margin-bottom:${mob ? 2 : 4}px;`;
    this.spellPanel.appendChild(this.spellGaugeLabel);

    const spellBtnW = mob ? 90 : 120;
    for (const [sid, sdef] of Object.entries(SPELL_DEFS)) {
      const btn = document.createElement('button');
      btn.style.cssText = `background:#222;color:#556;border:1px solid #334;padding:${mob ? '6px 4px' : '6px 8px'};cursor:default;font-family:monospace;font-size:${mob ? 9 : 11}px;border-radius:4px;width:${spellBtnW}px;text-align:center;min-height:${mob ? '36px' : 'auto'};`;
      const nameLine = document.createElement('div');
      nameLine.textContent = mob ? sdef.nameKo : `${sdef.nameKo} [${sdef.gaugeCost}]`;
      btn.appendChild(nameLine);
      const descLine = document.createElement('div');
      descLine.textContent = sdef.description;
      descLine.style.cssText = `font-size:${mob ? 7 : 9}px;color:#667;margin-top:2px;`;
      btn.appendChild(descLine);
      this.spellPanel.appendChild(btn);
      this.spellButtons.set(sid, btn);
    }
    this.container.appendChild(this.spellPanel);

    // Mutation display panel (heat death mode)
    this.mutationPanel = document.createElement('div');
    const mutRight = mob ? `calc(8px + ${safeInset('right')})` : '12px';
    this.mutationPanel.style.cssText = `position:absolute;right:${mutRight};top:${mob ? '140px' : '200px'};display:none;flex-direction:column;gap:3px;pointer-events:none;max-width:${mob ? '80px' : '120px'};`;
    this.container.appendChild(this.mutationPanel);

    // Crisis warning banner (heat death mode)
    this.crisisBanner = document.createElement('div');
    this.crisisBanner.style.cssText = `position:absolute;top:${mob ? '36px' : '40px'};left:50%;transform:translateX(-50%);background:rgba(80,0,0,0.85);border:1px solid #f44;padding:${mob ? '4px 12px' : '6px 16px'};border-radius:6px;font-size:${mob ? 11 : 13}px;color:#f88;text-align:center;pointer-events:none;display:none;white-space:nowrap;text-shadow:0 0 8px rgba(255,60,60,0.4);`;
    this.container.appendChild(this.crisisBanner);

    // Re-render on orientation / resize changes
    window.addEventListener('resize', () => this.render());

    this.render();
  }

  render() {
    const state = this.store.getState();
    const mob = isMobileLandscape();

    // Update layout dimensions on render (handles orientation change)
    this.topBar.style.height = mob ? '36px' : '40px';
    this.topBar.style.fontSize = mob ? '12px' : '14px';
    this.bottomBar.style.height = mob ? '56px' : '64px';
    this.bottomBar.style.gap = mob ? '4px' : '8px';
    this.bottomBar.style.paddingBottom = safeInset('bottom');
    this.startWaveBtn.style.right = `calc(${mob ? '8px' : '16px'} + ${safeInset('right')})`;
    this.startWaveBtn.style.bottom = `calc(${mob ? '64px' : '76px'} + ${safeInset('bottom')})`;
    this.spellPanel.style.right = mob ? `calc(8px + ${safeInset('right')})` : '12px';
    this.spellPanel.style.top = mob ? '38px' : '50px';
    this.mutationPanel.style.right = mob ? `calc(8px + ${safeInset('right')})` : '12px';
    this.mutationPanel.style.top = mob ? '140px' : '200px';
    this.infoPanel.style.maxHeight = `calc(100vh - 50px - ${mob ? 56 : 64}px - 16px)`;

    // --- Top bar ---
    this.topBar.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'BACK';
    backBtn.style.cssText = `background:#322;color:#a88;border:1px solid #544;padding:${mob ? '6px 12px' : '4px 10px'};cursor:pointer;font-family:monospace;font-size:${mob ? 11 : 12}px;border-radius:4px;margin-right:${mob ? 6 : 12}px;min-height:${mob ? '32px' : 'auto'};`;
    backBtn.onclick = () => this.onBack?.();
    this.topBar.appendChild(backBtn);

    const info = document.createElement('span');
    info.style.cssText = mob ? 'font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' : '';
    if (this.isHeatDeath) {
      if (mob) {
        info.innerHTML = `W${state.currentWave} ISM:${state.ism} HP:${state.baseHp}`;
      } else {
        info.innerHTML = `WAVE ${state.currentWave} &nbsp; ISM: ${state.ism} &nbsp; BASE HP: ${state.baseHp}`;
      }
    } else {
      const waveDisplay = this.isSurvival
        ? `WAVE ${state.currentWave} (Cycle ${state.survivalCycle + 1})`
        : `WAVE ${state.currentWave}/${state.totalWaves}`;
      if (mob) {
        info.innerHTML = `W${state.currentWave}${this.isSurvival ? '' : '/' + state.totalWaves} ISM:${state.ism} HP:${state.baseHp}`;
      } else {
        info.innerHTML = `${waveDisplay} &nbsp; ISM: ${state.ism} &nbsp; BASE HP: ${state.baseHp}/${state.maxBaseHp}`;
      }
    }
    this.topBar.appendChild(info);

    // Wave preview inline in topBar (between info and speed)
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
        this.topBar.appendChild(this.wavePreview);
      }
    }

    // Active synergy badges
    if (this.activeSynergyNames.length > 0) {
      const synergyBar = document.createElement('div');
      synergyBar.style.cssText = `display:flex;gap:4px;align-items:center;margin-left:${mob ? 4 : 8}px;flex-shrink:1;overflow:hidden;`;
      for (const name of this.activeSynergyNames) {
        const isNew = name.startsWith('+');
        const label = isNew ? name.slice(1) : name;
        const badge = document.createElement('span');
        badge.textContent = isNew ? `★${label}` : label;
        const bg = isNew ? 'rgba(60,200,120,0.5)' : 'rgba(100,80,200,0.4)';
        const fg = isNew ? '#8f6' : '#c8b4ff';
        const border = isNew ? '#4a4' : '#8866cc';
        badge.style.cssText = `font-size:${mob ? 8 : 9}px;background:${bg};color:${fg};border:1px solid ${border};border-radius:3px;padding:1px 4px;white-space:nowrap;`;
        synergyBar.appendChild(badge);
      }
      this.topBar.appendChild(synergyBar);
    }

    const speedBtn = document.createElement('button');
    speedBtn.textContent = `x${state.speed}`;
    speedBtn.style.cssText = `background:${state.speed > 1 ? '#553' : '#333'};color:${state.speed > 1 ? '#ff4' : '#aaa'};border:1px solid ${state.speed > 1 ? '#885' : '#555'};padding:${mob ? '6px 14px' : '4px 12px'};cursor:pointer;font-family:monospace;font-size:${mob ? 12 : 13}px;font-weight:bold;border-radius:4px;min-height:${mob ? '32px' : 'auto'};flex-shrink:0;`;
    speedBtn.onclick = () => this.onCycleSpeed?.();
    this.topBar.appendChild(speedBtn);

    // Update spell panel in-place (no DOM recreation)
    this.updateSpellPanel(state);

    // Update left info panel
    this.updateInfoPanel(mob);

    // --- Bottom bar ---
    this.bottomBar.innerHTML = '';

    const palettePad = mob ? '8px 8px' : '6px 12px';
    const paletteFontSize = mob ? 11 : 12;
    const paletteMinH = mob ? 'min-height:44px;' : '';

    // Start wave button — independent, bottom-right above footer
    if (state.phase === 'build') {
      this.startWaveBtn.textContent = mob ? `WAVE ${state.currentWave + 1} ▶` : `START WAVE ${state.currentWave + 1}`;
      this.startWaveBtn.style.display = 'block';
    } else {
      this.startWaveBtn.style.display = 'none';
      this.wavePreview.style.display = 'none';
    }

    // Tower palette
    for (const tid of state.availableTowers) {
      const def = TOWER_DEFS[tid];
      if (!def) continue;
      const btn = document.createElement('button');
      const selected = this.selectedTowerId === tid;
      btn.textContent = mob ? `${def.nameKo}(${def.cost})` : `${def.nameKo} (${def.cost})`;
      btn.style.cssText = `background:${selected ? '#446' : '#223'};color:#ddf;border:1px solid ${selected ? '#88a' : '#445'};padding:${palettePad};cursor:pointer;font-family:monospace;font-size:${paletteFontSize}px;border-radius:4px;white-space:nowrap;flex-shrink:0;${paletteMinH}`;
      btn.onclick = () => {
        this.selectedNebulaId = null;
        this.selectedTowerId = this.selectedTowerId === tid ? null : tid;
        this.onTowerSelected?.(this.selectedTowerId);
        this.render();
      };
      this.bottomBar.appendChild(btn);
    }

    // Heat death: mutation display + crisis banner
    this.updateMutationPanel(mob);
    this.updateCrisisBanner();

    // Nebula separator (only if nebulae available)
    if (this.availableNebulae.length > 0) {
      const nebSep = document.createElement('div');
      nebSep.style.cssText = 'width:1px;height:32px;background:#253;flex-shrink:0;';
      this.bottomBar.appendChild(nebSep);
    }

    // Nebula palette
    if (this.availableNebulae.length === 0) return;

    for (const nid of this.availableNebulae) {
      const def = NEBULA_DEFS[nid];
      const btn = document.createElement('button');
      const selected = this.selectedNebulaId === nid;
      btn.textContent = mob ? `${def.nameKo}(${def.cost})` : `${def.nameKo} (${def.cost})`;
      btn.style.cssText = `background:${selected ? '#243' : '#1a2a1a'};color:#aec;border:1px solid ${selected ? '#4a6' : '#354'};padding:${palettePad};cursor:pointer;font-family:monospace;font-size:${paletteFontSize}px;border-radius:4px;white-space:nowrap;flex-shrink:0;${paletteMinH}`;
      btn.onclick = () => {
        this.selectedTowerId = null;
        this.selectedNebulaId = this.selectedNebulaId === nid ? null : nid;
        this.onNebulaSelected?.(this.selectedNebulaId);
        this.render();
      };
      this.bottomBar.appendChild(btn);
    }
  }

  showTutorial(text: string) {
    this.tutorialOverlay.textContent = text;
    this.tutorialOverlay.style.display = 'block';
  }

  hideTutorial() {
    this.tutorialOverlay.style.display = 'none';
  }

  private updateSpellPanel(state: ReturnType<GameStore['getState']>) {
    const mob = isMobileLandscape();
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

  private updateInfoPanel(mob: boolean) {
    disposeNebulaPreview();
    if (!this.selectedTowerId && !this.selectedNebulaId) {
      this.infoPanel.style.display = 'none';
      this.infoPanel.innerHTML = '';
      return;
    }
    this.infoPanel.style.visibility = 'hidden';
    this.infoPanel.style.display = 'block';
    this.infoPanel.style.width = mob ? '140px' : '180px';
    this.infoPanel.innerHTML = '';

    const fs = mob ? 10 : 11;
    const fsSmall = mob ? 8 : 9;

    if (this.selectedTowerId) {
      const def = TOWER_DEFS[this.selectedTowerId];
      if (!def) return;

      // Name + spectral type
      const header = document.createElement('div');
      header.style.cssText = `font-size:${fs + 2}px;font-weight:bold;margin-bottom:6px;color:#eef;`;
      header.textContent = `${def.nameKo} [${def.spectralType}]`;
      this.infoPanel.appendChild(header);

      // Live shader preview (same GLSL as in-game towerStar shader)
      const previewSize = mob ? 56 : 64;
      const [r, g, b] = ciToRgb(def.ci);
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
        betelgeuse: `${def.wavesUntilExplosion ?? 5}웨이브 생존 후 광역 폭발\n반경 3타일, 100 데미지\n폭발 후 소멸`,
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
      const evo = getEvolutions(this.selectedTowerId);
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
    } else if (this.selectedNebulaId) {
      const def = NEBULA_DEFS[this.selectedNebulaId];
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

  private updateMutationPanel(mob: boolean) {
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
    const mob = isMobileLandscape();
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
    const mob = isMobileLandscape();
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

  dispose() {
    disposeNebulaPreview();
    this.container.remove();
  }
}
