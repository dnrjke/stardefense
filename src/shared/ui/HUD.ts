import type { GameStore } from '@/app/store/GameStore';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import { NEBULA_DEFS } from '@/shared/data/NebulaData';
import { SPELL_DEFS } from '@/shared/data/SpellData';
import { ENEMY_DEFS } from '@/shared/data/EnemyData';
import type { WaveDef } from '@/shared/data/WaveData';

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

    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;font-family:monospace;color:#fff;';
    document.body.appendChild(this.container);

    // Top bar
    this.topBar = document.createElement('div');
    this.topBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:40px;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:space-between;padding:0 16px;pointer-events:auto;font-size:14px;';
    this.container.appendChild(this.topBar);

    // Bottom bar
    this.bottomBar = document.createElement('div');
    this.bottomBar.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:64px;background:rgba(0,0,0,0.7);display:flex;align-items:center;gap:8px;padding:0 16px;pointer-events:auto;';
    this.container.appendChild(this.bottomBar);

    // Tutorial overlay
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.style.cssText = 'position:absolute;top:50px;left:50%;transform:translateX(-50%);background:rgba(0,0,30,0.85);border:1px solid #446;padding:12px 24px;border-radius:8px;font-size:14px;text-align:center;pointer-events:auto;display:none;max-width:400px;';
    this.container.appendChild(this.tutorialOverlay);

    // Wave banner (shows briefly on wave clear)
    this.waveBanner = document.createElement('div');
    this.waveBanner.style.cssText = 'position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:#4af;text-shadow:0 0 20px rgba(60,120,255,0.6);pointer-events:none;display:none;font-weight:bold;';
    this.container.appendChild(this.waveBanner);

    // End screen
    this.endScreen = document.createElement('div');
    this.endScreen.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);pointer-events:auto;';
    this.container.appendChild(this.endScreen);

    // Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = 'position:fixed;background:rgba(0,0,20,0.9);border:1px solid #446;padding:8px 12px;border-radius:6px;font-size:11px;color:#ccd;pointer-events:none;z-index:30;display:none;max-width:200px;line-height:1.4;';
    document.body.appendChild(this.tooltip);

    // Wave preview
    this.wavePreview = document.createElement('div');
    this.wavePreview.style.cssText = 'position:absolute;top:50px;left:50%;transform:translateX(-50%);background:rgba(0,0,30,0.85);border:1px solid #446;padding:8px 16px;border-radius:6px;font-size:12px;text-align:center;pointer-events:none;display:none;max-width:500px;color:#8af;';
    this.container.appendChild(this.wavePreview);

    this.render();
  }

  render() {
    const state = this.store.getState();

    // Top bar
    this.topBar.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'BACK';
    backBtn.style.cssText = 'background:#322;color:#a88;border:1px solid #544;padding:4px 10px;cursor:pointer;font-family:monospace;font-size:12px;border-radius:4px;margin-right:12px;';
    backBtn.onclick = () => this.onBack?.();
    this.topBar.appendChild(backBtn);

    const info = document.createElement('span');
    const waveDisplay = this.isSurvival
      ? `WAVE ${state.currentWave} (Cycle ${state.survivalCycle + 1})`
      : `WAVE ${state.currentWave}/${state.totalWaves}`;
    info.innerHTML = `${waveDisplay} &nbsp; ISM: ${state.ism} &nbsp; BASE HP: ${state.baseHp}/${state.maxBaseHp}`;
    this.topBar.appendChild(info);

    const speedBtn = document.createElement('button');
    speedBtn.textContent = `x${state.speed}`;
    speedBtn.style.cssText = `background:${state.speed > 1 ? '#553' : '#333'};color:${state.speed > 1 ? '#ff4' : '#aaa'};border:1px solid ${state.speed > 1 ? '#885' : '#555'};padding:4px 12px;cursor:pointer;font-family:monospace;font-size:13px;font-weight:bold;border-radius:4px;`;
    speedBtn.onclick = () => this.onCycleSpeed?.();
    this.topBar.appendChild(speedBtn);

    // Spell buttons (right side floating panel)
    const spellPanel = this.container.querySelector('.spell-panel') as HTMLDivElement | null;
    if (spellPanel) spellPanel.remove();

    const spPanel = document.createElement('div');
    spPanel.className = 'spell-panel';
    spPanel.style.cssText = 'position:absolute;right:12px;top:50px;display:flex;flex-direction:column;gap:6px;pointer-events:auto;';

    const gaugeBar = document.createElement('div');
    gaugeBar.style.cssText = 'width:100px;height:10px;background:#222;border:1px solid #446;border-radius:4px;overflow:hidden;margin-bottom:4px;';
    const gaugeFill = document.createElement('div');
    gaugeFill.style.cssText = `width:${state.spellGauge}%;height:100%;background:linear-gradient(to right, #44a, #88f);transition:width 0.2s;`;
    gaugeBar.appendChild(gaugeFill);
    spPanel.appendChild(gaugeBar);

    const gaugeLabel = document.createElement('div');
    gaugeLabel.textContent = `GAUGE ${Math.floor(state.spellGauge)}/100`;
    gaugeLabel.style.cssText = 'font-size:10px;color:#88a;text-align:center;margin-bottom:4px;';
    spPanel.appendChild(gaugeLabel);

    for (const [sid, sdef] of Object.entries(SPELL_DEFS)) {
      const cd = state.spellCooldowns[sid] ?? 0;
      const canCast = state.spellGauge >= sdef.gaugeCost && cd <= 0;
      const btn = document.createElement('button');
      const cdText = cd > 0 ? ` (${Math.ceil(cd)}s)` : '';
      btn.textContent = `${sdef.nameKo} [${sdef.gaugeCost}]${cdText}`;
      btn.style.cssText = `background:${canCast ? '#335' : '#222'};color:${canCast ? '#aaf' : '#556'};border:1px solid ${canCast ? '#558' : '#334'};padding:6px 10px;cursor:${canCast ? 'pointer' : 'default'};font-family:monospace;font-size:11px;border-radius:4px;width:100px;text-align:center;`;
      btn.title = sdef.description;
      if (canCast) {
        btn.onclick = () => this.onCastSpell?.(sid);
      }
      spPanel.appendChild(btn);
    }

    this.container.appendChild(spPanel);

    // Bottom bar
    this.bottomBar.innerHTML = '';

    if (state.phase === 'build') {
      // Start wave button
      const startBtn = document.createElement('button');
      startBtn.textContent = `START WAVE ${state.currentWave + 1}`;
      startBtn.style.cssText = 'background:#335;color:#aaf;border:1px solid #558;padding:8px 16px;cursor:pointer;font-family:monospace;font-size:13px;border-radius:4px;';
      startBtn.onclick = () => this.onStartWave?.();
      this.bottomBar.appendChild(startBtn);

      const sep = document.createElement('div');
      sep.style.cssText = 'width:1px;height:32px;background:#334;';
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
        this.wavePreview.textContent = `WAVE ${state.currentWave + 1}: ${parts.join(', ')}`;
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
      btn.textContent = `${def.nameKo} (${def.cost})`;
      btn.style.cssText = `background:${selected ? '#446' : '#223'};color:#ddf;border:1px solid ${selected ? '#88a' : '#445'};padding:6px 12px;cursor:pointer;font-family:monospace;font-size:12px;border-radius:4px;`;
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
      nebSep.style.cssText = 'width:1px;height:32px;background:#253;';
      this.bottomBar.appendChild(nebSep);
    }

    // Nebula palette
    if (this.availableNebulae.length === 0) return;

    for (const nid of this.availableNebulae) {
      const def = NEBULA_DEFS[nid];
      const btn = document.createElement('button');
      const selected = this.selectedNebulaId === nid;
      btn.textContent = `${def.nameKo} (${def.cost})`;
      btn.style.cssText = `background:${selected ? '#243' : '#1a2a1a'};color:#aec;border:1px solid ${selected ? '#4a6' : '#354'};padding:6px 12px;cursor:pointer;font-family:monospace;font-size:12px;border-radius:4px;`;
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

  showEndScreen(victory: boolean, _mapId?: string) {
    this.endScreen.style.display = 'flex';
    this.endScreen.innerHTML = '';

    const state = this.store.getState();

    const title = document.createElement('div');
    title.textContent = victory ? 'WAVE CLEAR!' : 'GAME OVER';
    title.style.cssText = `font-size:32px;margin-bottom:16px;color:${victory ? '#4af' : '#f44'}`;
    this.endScreen.appendChild(title);

    const desc = document.createElement('div');
    desc.textContent = victory ? '방어 성공! 다음 항로가 개방됩니다.' : '기지가 파괴되었습니다.';
    desc.style.cssText = 'font-size:14px;margin-bottom:16px;color:#aaa';
    this.endScreen.appendChild(desc);

    const stats = document.createElement('div');
    stats.style.cssText = 'font-size:13px;color:#889;margin-bottom:24px;text-align:center;line-height:1.8;';
    if (victory) {
      stats.innerHTML = `적 처치: ${state.enemiesKilled}<br>타워 배치: ${state.towersPlaced}<br>웨이브 생존: ${state.currentWave}`;
    } else {
      stats.innerHTML = `도달 웨이브: ${state.currentWave}<br>적 처치: ${state.enemiesKilled}<br>타워 배치: ${state.towersPlaced}`;
    }
    this.endScreen.appendChild(stats);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;';

    if (victory) {
      const contBtn = document.createElement('button');
      contBtn.textContent = 'CONTINUE';
      contBtn.style.cssText = 'background:#335;color:#aaf;border:1px solid #558;padding:10px 24px;cursor:pointer;font-family:monospace;font-size:14px;border-radius:4px;';
      contBtn.onclick = () => this.onContinue?.();
      btnRow.appendChild(contBtn);
    } else {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'RETRY';
      retryBtn.style.cssText = 'background:#335;color:#aaf;border:1px solid #558;padding:10px 24px;cursor:pointer;font-family:monospace;font-size:14px;border-radius:4px;';
      retryBtn.onclick = () => this.onRestart?.();
      btnRow.appendChild(retryBtn);

      const backBtn = document.createElement('button');
      backBtn.textContent = 'MAP SELECT';
      backBtn.style.cssText = 'background:#322;color:#a88;border:1px solid #544;padding:10px 24px;cursor:pointer;font-family:monospace;font-size:14px;border-radius:4px;';
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
