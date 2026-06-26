import type { GameStore } from '@/app/store/GameStore';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import { NEBULA_DEFS } from '@/shared/data/NebulaData';
import { SPELL_DEFS } from '@/shared/data/SpellData';
import { ENEMY_DEFS } from '@/shared/data/EnemyData';
import type { WaveDef } from '@/shared/data/WaveData';

/** Detect mobile landscape: narrow height + touch support */
function isMobileLandscape(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  // Landscape mobile: height typically <= 500px, width > height
  return hasTouch && window.innerHeight <= 500 && window.innerWidth > window.innerHeight;
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
  private tooltip!: HTMLDivElement;
  private wavePreview!: HTMLDivElement;
  private spellPanel!: HTMLDivElement;
  private spellGaugeFill!: HTMLDivElement;
  private spellGaugeLabel!: HTMLDivElement;
  private spellButtons: Map<string, HTMLButtonElement> = new Map();
  private spellCdLabels: Map<string, HTMLSpanElement> = new Map();
  availableNebulae: string[] = [];
  currentWaves: WaveDef[] = [];
  isSurvival = false;
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

    // Tooltip — hidden on mobile (use long-press or skip)
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = 'position:fixed;background:rgba(0,0,20,0.9);border:1px solid #446;padding:8px 12px;border-radius:6px;font-size:11px;color:#ccd;pointer-events:none;z-index:30;display:none;max-width:200px;line-height:1.4;';
    document.body.appendChild(this.tooltip);

    // Wave preview
    this.wavePreview = document.createElement('div');
    this.wavePreview.style.cssText = `position:absolute;top:${mob ? 40 : 50}px;left:50%;transform:translateX(-50%);background:rgba(0,0,30,0.85);border:1px solid #446;padding:${mob ? '6px 10px' : '8px 16px'};border-radius:6px;font-size:${mob ? 10 : 12}px;text-align:center;pointer-events:none;display:none;max-width:${mob ? '80vw' : '500px'};color:#8af;`;
    this.container.appendChild(this.wavePreview);

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

    const spellBtnW = mob ? 72 : 100;
    for (const [sid, sdef] of Object.entries(SPELL_DEFS)) {
      const btn = document.createElement('button');
      btn.style.cssText = `background:#222;color:#556;border:1px solid #334;padding:${mob ? '8px 4px' : '6px 10px'};cursor:default;font-family:monospace;font-size:${mob ? 9 : 11}px;border-radius:4px;width:${spellBtnW}px;text-align:center;min-height:${mob ? '36px' : 'auto'};`;
      btn.title = sdef.description;
      btn.textContent = mob ? sdef.nameKo : `${sdef.nameKo} [${sdef.gaugeCost}]`;
      this.spellPanel.appendChild(btn);
      this.spellButtons.set(sid, btn);
    }
    this.container.appendChild(this.spellPanel);

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

    // --- Top bar ---
    this.topBar.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'BACK';
    backBtn.style.cssText = `background:#322;color:#a88;border:1px solid #544;padding:${mob ? '6px 12px' : '4px 10px'};cursor:pointer;font-family:monospace;font-size:${mob ? 11 : 12}px;border-radius:4px;margin-right:${mob ? 6 : 12}px;min-height:${mob ? '32px' : 'auto'};`;
    backBtn.onclick = () => this.onBack?.();
    this.topBar.appendChild(backBtn);

    const info = document.createElement('span');
    info.style.cssText = mob ? 'font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' : '';
    const waveDisplay = this.isSurvival
      ? `WAVE ${state.currentWave} (Cycle ${state.survivalCycle + 1})`
      : `WAVE ${state.currentWave}/${state.totalWaves}`;
    if (mob) {
      info.innerHTML = `W${state.currentWave}${this.isSurvival ? '' : '/' + state.totalWaves} ISM:${state.ism} HP:${state.baseHp}`;
    } else {
      info.innerHTML = `${waveDisplay} &nbsp; ISM: ${state.ism} &nbsp; BASE HP: ${state.baseHp}/${state.maxBaseHp}`;
    }
    this.topBar.appendChild(info);

    const speedBtn = document.createElement('button');
    speedBtn.textContent = `x${state.speed}`;
    speedBtn.style.cssText = `background:${state.speed > 1 ? '#553' : '#333'};color:${state.speed > 1 ? '#ff4' : '#aaa'};border:1px solid ${state.speed > 1 ? '#885' : '#555'};padding:${mob ? '6px 14px' : '4px 12px'};cursor:pointer;font-family:monospace;font-size:${mob ? 12 : 13}px;font-weight:bold;border-radius:4px;min-height:${mob ? '32px' : 'auto'};`;
    speedBtn.onclick = () => this.onCycleSpeed?.();
    this.topBar.appendChild(speedBtn);

    // Update spell panel in-place (no DOM recreation)
    this.updateSpellPanel(state);

    // --- Bottom bar ---
    this.bottomBar.innerHTML = '';

    const palettePad = mob ? '8px 8px' : '6px 12px';
    const paletteFontSize = mob ? 11 : 12;
    const paletteMinH = mob ? 'min-height:44px;' : '';

    if (state.phase === 'build') {
      const startBtn = document.createElement('button');
      startBtn.textContent = mob ? `WAVE ${state.currentWave + 1}` : `START WAVE ${state.currentWave + 1}`;
      startBtn.style.cssText = `background:#335;color:#aaf;border:1px solid #558;padding:${mob ? '8px 10px' : '8px 16px'};cursor:pointer;font-family:monospace;font-size:${mob ? 11 : 13}px;border-radius:4px;white-space:nowrap;${paletteMinH}flex-shrink:0;`;
      startBtn.onclick = () => this.onStartWave?.();
      this.bottomBar.appendChild(startBtn);

      const sep = document.createElement('div');
      sep.style.cssText = 'width:1px;height:32px;background:#334;flex-shrink:0;';
      this.bottomBar.appendChild(sep);
    }

    // Wave preview during build phase
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
          parts.push(`${name} x${s.count}`);
        }
        this.wavePreview.textContent = mob
          ? `W${state.currentWave + 1}: ${parts.join(', ')}`
          : `WAVE ${state.currentWave + 1}: ${parts.join(', ')}`;
        this.wavePreview.style.display = 'block';
      } else {
        this.wavePreview.style.display = 'none';
      }
    } else {
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
      if (!mob) {
        btn.onmouseenter = (e) => {
          const rate = def.attackRate > 0 ? def.attackRate.toFixed(1) : '-';
          const dmg = def.noAttack ? '-' : `${def.damage}`;
          this.tooltip.innerHTML = `<b>${def.nameKo}</b> [${def.spectralType}]<br>DMG: ${dmg} | RATE: ${rate}/s | RNG: ${def.range}<br>COST: ${def.cost} ISM`;
          this.tooltip.style.display = 'block';
          this.tooltip.style.left = `${(e as MouseEvent).clientX + 10}px`;
          this.tooltip.style.top = `${(e as MouseEvent).clientY - 60}px`;
        };
        btn.onmouseleave = () => {
          this.tooltip.style.display = 'none';
        };
      }
      btn.onclick = () => {
        this.selectedNebulaId = null;
        this.selectedTowerId = this.selectedTowerId === tid ? null : tid;
        this.onTowerSelected?.(this.selectedTowerId);
        this.render();
      };
      this.bottomBar.appendChild(btn);
    }

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
      btn.textContent = mob ? `${sdef.nameKo}${cdText}` : `${sdef.nameKo} [${sdef.gaugeCost}]${cdText}`;
      btn.style.background = canCast ? '#335' : '#222';
      btn.style.color = canCast ? '#aaf' : '#556';
      btn.style.borderColor = canCast ? '#558' : '#334';
      btn.style.cursor = canCast ? 'pointer' : 'default';
      btn.onclick = canCast ? () => this.onCastSpell?.(sid) : null;
    }
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
    this.tooltip.remove();
    this.container.remove();
  }
}
