/**
 * AudioBridge — 게임 이벤트를 사운드로 매핑하는 접착 레이어.
 *
 * 다른 시스템(TowerEngine/WaveEngine 등)의 코드를 수정하지 않고
 * FlowController가 배선을 마친 "이후" 콜백을 래핑(wrap)하는 방식으로 훅을 건다.
 * 나머지 이벤트는 GameStore 상태 diff 구독으로 유도한다.
 *
 * FlowController 침습은 생성/dispose 각 1줄로 최소화 (동시 작업 세션 충돌 회피).
 */

import { audio } from './AudioEngine';
import { MusicSystem } from './MusicSystem';
import type { GameStore, GamePhase } from '@/app/store/GameStore';
import type { TowerEngine } from '@/engines/tower/TowerEngine';
import type { WaveEngine } from '@/engines/wave/WaveEngine';
import type { NebulaEngine } from '@/engines/nebula/NebulaEngine';
import type { HUD } from '@/shared/ui/HUD';
import type { RadialMenu } from '@/shared/ui/RadialMenu';

interface BridgeDeps {
  store: GameStore;
  towerEngine: TowerEngine;
  waveEngine: WaveEngine;
  nebulaEngine: NebulaEngine;
  hud: HUD;
  radialMenu: RadialMenu;
}

export class AudioBridge {
  private unsub: (() => void) | null = null;
  private music = new MusicSystem();
  private restorePlaceNebula: (() => void) | null = null;

  constructor(deps: BridgeDeps) {
    const { store, towerEngine, waveEngine, nebulaEngine, hud, radialMenu } = deps;

    // ── 콜백 래핑 (배선 완료 후 호출되므로 기존 핸들러 보존) ──

    const prevHit = towerEngine.onEnemyHit;
    towerEngine.onEnemyHit = (enemy, damage) => {
      prevHit?.(enemy, damage);
      // 데미지가 클수록 낮고 묵직한 타격음 (타워 티어 다양성 표현)
      const pitch = Math.max(0.45, 1.5 / (1 + damage / 25));
      audio.play('enemy_hit', { pitch });
    };

    const prevExplode = towerEngine.onBetelgeuseExplode;
    towerEngine.onBetelgeuseExplode = (tower) => {
      prevExplode?.(tower);
      audio.play('supernova');
    };

    const prevRadial = radialMenu.onSelect;
    radialMenu.onSelect = (itemId: string) => {
      if (itemId === 'sell') audio.play('tower_sell');
      else if (itemId.startsWith('evo_')) audio.play('tower_evolve');
      else if (itemId === 'cancel_place') audio.play('ui_click');
      // confirm_place는 store.towersPlaced diff에서 tower_place로 처리
      prevRadial?.(itemId);
    };

    const prevTowerSel = hud.onTowerSelected;
    hud.onTowerSelected = (towerId) => {
      prevTowerSel?.(towerId);
      audio.play('ui_select');
    };

    // 성운 배치: 콜백이 없어 메서드를 감싼다 (성공 시에만 사운드)
    const origPlaceNebula = nebulaEngine.placeNebula.bind(nebulaEngine);
    nebulaEngine.placeNebula = (id: string, row: number, col: number) => {
      const placed = origPlaceNebula(id, row, col);
      if (placed) audio.play('nebula_place');
      return placed;
    };
    this.restorePlaceNebula = () => { nebulaEngine.placeNebula = origPlaceNebula; };

    void waveEngine; // 적 도착 피해는 store.baseHp diff로 감지

    // ── 스토어 diff 구독 ──

    let prev = {
      phase: store.getState().phase as GamePhase,
      baseHp: store.getState().baseHp,
      enemiesKilled: store.getState().enemiesKilled,
      towersPlaced: store.getState().towersPlaced,
      spellGauge: store.getState().spellGauge,
    };

    this.unsub = store.subscribe(() => {
      const s = store.getState();

      if (s.phase !== prev.phase) {
        switch (s.phase) {
          case 'wave':
            audio.play('wave_start');
            this.music.setIntensity(0.8);
            break;
          case 'result':
            audio.play('wave_clear');
            this.music.setIntensity(0.4);
            break;
          case 'build':
            this.music.setIntensity(0.4);
            break;
          case 'clear':
            audio.play('victory');
            this.music.stop();
            break;
          case 'gameover':
            audio.play('gameover');
            this.music.stop();
            break;
        }
      }

      if (s.baseHp < prev.baseHp) audio.play('base_damage');
      if (s.enemiesKilled > prev.enemiesKilled) audio.play('enemy_kill');
      if (s.towersPlaced > prev.towersPlaced) audio.play('tower_place');
      // 게이지 감소 = 스펠 시전 (증가는 킬 보상)
      if (s.spellGauge < prev.spellGauge) audio.play('spell_cast');

      prev = {
        phase: s.phase,
        baseHp: s.baseHp,
        enemiesKilled: s.enemiesKilled,
        towersPlaced: s.towersPlaced,
        spellGauge: s.spellGauge,
      };
    });

    // 앰비언트 음악 시작 (AudioContext는 첫 제스처 후 활성화됨)
    this.music.start();
    this.music.setIntensity(0.4);
  }

  dispose() {
    this.unsub?.();
    this.unsub = null;
    this.restorePlaceNebula?.();
    this.restorePlaceNebula = null;
    this.music.stop();
  }
}
