import * as BABYLON from '@babylonjs/core';
import { FixedTimestep } from '@/core/FixedTimestep';
import { MapEngine } from '@/engines/map/MapEngine';
import { TowerEngine } from '@/engines/tower/TowerEngine';
import { WaveEngine } from '@/engines/wave/WaveEngine';
import { NebulaEngine } from '@/engines/nebula/NebulaEngine';
import { HUD } from '@/shared/ui/HUD';
import { NEBULA_DEFS } from '@/shared/data/NebulaData';
import { RadialMenu } from '@/shared/ui/RadialMenu';
import { createGameStore } from '@/app/store/GameStore';
import type { GameStore } from '@/app/store/GameStore';
import { createCampaignStore } from '@/app/store/CampaignStore';
import type { CampaignStore } from '@/app/store/CampaignStore';
import { MapSelectScreen } from '@/shared/ui/MapSelectScreen';
import { createMap1_1, createMap1_2, createMap1_3, createMap1_B, createMap2_1, createMap2_2, createMap2_3, createMap2_B, createMap3_1, createMap3_2, createMap3_2b, createMap3_3, createMap3_B, createMap4_1, createMap4_2, createMap4_3, createMap4_B, createMapHeatDeath } from '@/shared/data/MapData';
import { MAP_1_1_WAVES, MAP_1_2_WAVES, MAP_1_3_WAVES, MAP_1_B_WAVES, MAP_2_1_WAVES, MAP_2_2_WAVES, MAP_2_3_WAVES, MAP_2_B_WAVES, MAP_3_1_WAVES, MAP_3_2_WAVES, MAP_3_2B_WAVES, MAP_3_3_WAVES, MAP_3_B_WAVES, MAP_4_1_WAVES, MAP_4_2_WAVES, MAP_4_3_WAVES, MAP_4_B_WAVES } from '@/shared/data/WaveData';
import { HEAT_DEATH_CONFIG, getHeatDeathScaling } from '@/shared/data/HeatDeathConfig';
import { MUTATION_DEFS, pickRandomMutations, computeMutationModifiers } from '@/shared/data/MutationData';
import { getCrisisForWave } from '@/shared/data/CrisisData';
import { generateHeatDeathWave, generateCrisisWave, generateExtinctionBossWave } from '@/shared/data/HeatDeathWaveGenerator';
import { loadRecord, saveRecord, isNewBest } from '@/app/store/RecordStore';
import { MutationSelectUI } from '@/shared/ui/MutationSelectUI';
import { MAP_ENVIRONMENTS } from '@/shared/data/MapEnvironment';
import { SpellEngine } from '@/engines/spell/SpellEngine';
import { TOWER_DEFS, type TowerDef } from '@/shared/data/TowerData';
import { ciToRgb } from '@/shared/data/ColorUtil';
import { getEvolutions, getEvolutionCost } from '@/engines/tower/EvolutionSystem';
import type { MapDef } from '@/shared/data/MapData';
import type { WaveDef } from '@/shared/data/WaveData';
import type { TowerEntity } from '@/engines/tower/TowerEntity';

// ── Tutorial messages (map_1_1 specific) ──
const TUTORIALS: Record<number, string> = {
  0: '성간 물질(ISM)로 항성을 배치하세요. 하단에서 태양을 선택 후 타일을 클릭합니다.',
  1: '항성이 자동으로 적을 공격합니다. 다음 웨이브를 시작하세요.',
  2: '빠른 적 "혜성"이 등장합니다. 프록시마(속사 타워)가 해금되었습니다!',
  4: '빌드 페이즈에서 타워를 추가하거나 기존 배치를 보강하세요.',
};

// ── Map configuration registry ──
interface MapConfig {
  createMap: () => MapDef;
  waves: WaveDef[];
  availableTowers: string[];
  availableNebulae?: string[];
  unlockOnClear?: string;
  environment?: string;
  isSurvival?: boolean;
  isHeatDeath?: boolean;
}

const MAP_CONFIGS: Record<string, MapConfig> = {
  map_1_1: {
    createMap: createMap1_1,
    waves: MAP_1_1_WAVES,
    availableTowers: ['sol'],
    unlockOnClear: 'map_1_2',
  },
  map_1_2: {
    createMap: createMap1_2,
    waves: MAP_1_2_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius'],
    unlockOnClear: 'map_1_3',
  },
  map_1_3: {
    createMap: createMap1_3,
    waves: MAP_1_3_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius'],
    unlockOnClear: 'map_1_b',
  },
  map_1_b: {
    createMap: createMap1_B,
    waves: MAP_1_B_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius'],
    unlockOnClear: 'map_2_1',
  },
  map_2_1: {
    createMap: createMap2_1,
    waves: MAP_2_1_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel'],
    unlockOnClear: 'map_2_2',
  },
  map_2_2: {
    createMap: createMap2_2,
    waves: MAP_2_2_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse'],
    unlockOnClear: 'map_2_3',
  },
  map_2_3: {
    createMap: createMap2_3,
    waves: MAP_2_3_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_2_b',
  },
  map_2_b: {
    createMap: createMap2_B,
    waves: MAP_2_B_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_3_1',
  },
  map_3_1: {
    createMap: createMap3_1,
    waves: MAP_3_1_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_3_2',
  },
  map_3_2: {
    createMap: createMap3_2,
    waves: MAP_3_2_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_3_2b',
  },
  map_3_2b: {
    createMap: createMap3_2b,
    waves: MAP_3_2B_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_3_3',
  },
  map_3_3: {
    createMap: createMap3_3,
    waves: MAP_3_3_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_3_b',
  },
  map_3_b: {
    createMap: createMap3_B,
    waves: MAP_3_B_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    unlockOnClear: 'map_4_1',
  },
  map_4_1: {
    createMap: createMap4_1,
    waves: MAP_4_1_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    environment: 'dark_sector',
    unlockOnClear: 'map_4_2',
  },
  map_4_2: {
    createMap: createMap4_2,
    waves: MAP_4_2_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    environment: 'gravity_well',
    unlockOnClear: 'map_4_3',
  },
  map_4_3: {
    createMap: createMap4_3,
    waves: MAP_4_3_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    environment: 'nebula_rich',
    isSurvival: true,
    unlockOnClear: 'map_4_b',
  },
  map_4_b: {
    createMap: createMap4_B,
    waves: MAP_4_B_WAVES,
    availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar', 'wolf_rayet'],
    availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
    environment: 'dark_sector',
    unlockOnClear: 'map_heat_death',
  },
  map_heat_death: {
    createMap: createMapHeatDeath,
    waves: [],
    availableTowers: HEAT_DEATH_CONFIG.availableTowers,
    availableNebulae: HEAT_DEATH_CONFIG.availableNebulae,
    isHeatDeath: true,
  },
};

export type ScreenState = 'mapSelect' | 'gameplay';

export class FlowController {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private campaignStore: CampaignStore;
  private mapSelectScreen: MapSelectScreen;

  // Persistent scene objects
  private camera!: BABYLON.ArcRotateCamera;
  private glowLayer!: BABYLON.GlowLayer;
  private starfieldSPS!: BABYLON.SolidParticleSystem;
  private starfieldMesh!: BABYLON.Mesh;
  private _starTime = 0;

  // Per-map game objects (nullable = not in gameplay)
  private mapEngine: MapEngine | null = null;
  private towerEngine: TowerEngine | null = null;
  private waveEngine: WaveEngine | null = null;
  private nebulaEngine: NebulaEngine | null = null;
  private spellEngine: SpellEngine | null = null;
  private gameStore: GameStore | null = null;
  private hud: HUD | null = null;
  private radialMenu: RadialMenu | null = null;
  private fixedStep: FixedTimestep | null = null;
  private selectedTower: TowerEntity | null = null;
  private storeUnsub: (() => void) | null = null;
  private mutationUI: MutationSelectUI | null = null;

  private currentMapId: string | null = null;
  private screenState: ScreenState = 'mapSelect';

  // Placement preview state
  private previewMesh: BABYLON.Mesh | null = null;
  private previewRangeDisc: BABYLON.Mesh | null = null;
  private previewTowerId: string | null = null;
  private previewRow = -1;
  private previewCol = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Babylon engine (created once, reused)
    this.engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
    }, true);

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.06, 1);
    this.scene.skipPointerMovePicking = true;

    this.setupCamera();
    this.setupLighting();
    this.setupGlow();
    this.setupStarfield();

    // Campaign
    this.campaignStore = createCampaignStore();
    this.campaignStore.getState().load();

    // Map select screen
    this.mapSelectScreen = new MapSelectScreen(this.campaignStore);
    this.mapSelectScreen.onMapStart = (mapId) => this.startMap(mapId);

    // Render loop (always running)
    this.engine.runRenderLoop(() => this.renderLoop());
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetAspect = 16 / 10;
    let cw: number;
    let ch: number;

    if (w / h > targetAspect) {
      ch = h;
      cw = h * targetAspect;
    } else {
      cw = w;
      ch = w / targetAspect;
    }

    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.transform = 'translate(-50%, -50%)';
    this.engine.resize();
  }

  showMapSelect() {
    this.cleanupGameplay();
    this.screenState = 'mapSelect';
    this.canvas.style.display = 'none';
    this.mapSelectScreen.show();
  }

  startMap(mapId: string) {
    const config = MAP_CONFIGS[mapId];
    if (!config) return;

    this.cleanupGameplay();

    this.screenState = 'gameplay';
    this.currentMapId = mapId;
    this.mapSelectScreen.hide();
    this.canvas.style.display = 'block';

    // Create map
    const mapDef = config.createMap();
    this.mapEngine = new MapEngine(this.scene, mapDef);
    const paths: BABYLON.Vector3[][] = [];
    for (let i = 0; i < this.mapEngine.pathCount; i++) {
      paths.push(this.mapEngine.getWaypoints(i));
    }

    const camDist = mapDef.cameraDistance ?? 16;
    this.camera.radius = camDist;
    this.camera.lowerRadiusLimit = camDist;
    this.camera.upperRadiusLimit = camDist;

    const mob = 'ontouchstart' in window && window.innerHeight <= 500 && window.innerWidth > window.innerHeight;
    const hudOffset = mob ? camDist * 0.06 : 0;
    this.camera.target = new BABYLON.Vector3(0, 0, hudOffset);

    const env = config.environment ? MAP_ENVIRONMENTS[config.environment] : undefined;
    const ismMult = env?.ismMultiplier ?? 1;

    // Create engines
    this.waveEngine = new WaveEngine(this.scene, paths);
    this.waveEngine.speedMultiplier = env?.speedMultiplier ?? 1;
    this.towerEngine = new TowerEngine(this.scene, this.mapEngine);
    this.nebulaEngine = new NebulaEngine(this.scene, this.mapEngine);
    this.spellEngine = new SpellEngine(this.scene);

    // Store
    const totalWaves = config.isSurvival ? 9999 : config.waves.length;
    this.gameStore = createGameStore(totalWaves);
    const store = this.gameStore;

    // Set available towers from config
    for (const tid of config.availableTowers) {
      if (tid !== 'sol') {
        store.getState().unlockTower(tid);
      }
    }

    // HUD
    this.hud = new HUD(store);
    this.hud.availableNebulae = config.availableNebulae ?? [];
    this.hud.currentWaves = config.waves;
    this.hud.isSurvival = config.isSurvival ?? false;
    this.hud.isHeatDeath = config.isHeatDeath ?? false;
    this.hud.render();
    this.radialMenu = new RadialMenu();
    this.fixedStep = new FixedTimestep();

    // Heat Death mode setup
    if (config.isHeatDeath) {
      store.getState().setHeatDeathMode(true);
      store.setState({ ism: HEAT_DEATH_CONFIG.startingIsm, baseHp: HEAT_DEATH_CONFIG.baseHp, maxBaseHp: HEAT_DEATH_CONFIG.baseHp });

      this.mutationUI = new MutationSelectUI();
      this.mutationUI.onSelect = (mutId) => {
        store.getState().addMutation(mutId);
        const mutDef = MUTATION_DEFS[mutId];
        if (mutDef) {
          const names = store.getState().activeMutations.map(id => MUTATION_DEFS[id]?.nameKo ?? id);
          this.hud!.setActiveMutations(names);
        }
        store.getState().setPhase('build');
        this.hud!.setCrisisWarning(null);
        this.hud!.render();
      };
    }

    // Wire radial menu
    this.radialMenu.onSelect = (itemId) => {
      if (itemId === 'confirm_place') {
        this.confirmPlacement();
        return;
      }
      if (itemId === 'cancel_place') {
        this.clearPreview();
        return;
      }

      if (!this.selectedTower) return;
      if (itemId === 'sell') {
        const refund = this.towerEngine!.sellTower(this.selectedTower);
        if (refund > 0) store.getState().addIsm(refund);
        this.hud!.render();
      } else if (itemId.startsWith('evo_')) {
        const evoId = itemId.slice(4);
        const evoDef = getEvolutions(this.selectedTower.def.id);
        if (evoDef) {
          const path = evoDef.paths.find(p => p.targetId === evoId);
          if (path) {
            const dynamicCost = getEvolutionCost(this.selectedTower.def, path);
            if (store.getState().spendIsm(dynamicCost)) {
              this.towerEngine!.evolveTower(this.selectedTower, evoId);
            }
          }
        }
        this.hud!.render();
      }
      this.selectedTower = null;
    };

    this.radialMenu.onClose = () => {
      this.selectedTower = null;
      this.clearPreview();
    };

    // Wire betelgeuse explosion
    this.towerEngine.onBetelgeuseExplode = (tower) => {
      const enemies = this.waveEngine!.getAliveEnemies();
      const explosionRange = 3;
      const explosionRangeSq = explosionRange * explosionRange;
      const explosionDamage = 100;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.position.x - tower.mesh.position.x;
        const dz = enemy.position.z - tower.mesh.position.z;
        if (dx * dx + dz * dz <= explosionRangeSq) {
          this.waveEngine!.killEnemy(enemy, explosionDamage);
        }
      }
      this.spawnExplosionEffect(tower.mesh.position, explosionRange);
    };

    // Wire game logic
    this.towerEngine.onEnemyHit = (enemy, damage) => {
      const armorReduction = this.nebulaEngine!.getEnemyArmorReduction(enemy.position);
      const adjustedDamage = damage + armorReduction;
      const killed = this.waveEngine!.killEnemy(enemy, adjustedDamage);
      if (killed) {
        const reward = Math.round(enemy.def.reward * ismMult);
        store.getState().addIsm(reward);
        const gaugeAmt = this.towerEngine!.getActiveSynergies().some(s => s.id === 'stellar_recycling') ? 6.25 : 5;
        store.getState().addSpellGauge(gaugeAmt);
        store.getState().incrementEnemiesKilled();
        this.showFloatingIsm(reward, enemy.position);
      }
    };

    this.waveEngine.onEnemyReachedEnd = () => {
      store.getState().damageBase(1);
    };

    this.waveEngine.onWaveCleared = () => {
      const state = store.getState();

      for (const tower of this.towerEngine!.getTowers()) {
        tower.onWaveCompleted();
      }

      // Check betelgeuse explosions immediately after wave tracking
      for (const tower of [...this.towerEngine!.getTowers()]) {
        if (tower.readyToExplode) {
          this.towerEngine!.onBetelgeuseExplode?.(tower);
          this.towerEngine!.removeTower(tower);
        }
      }

      if (config.isHeatDeath) {
        const reward = HEAT_DEATH_CONFIG.waveRewardBase + state.currentWave * HEAT_DEATH_CONFIG.waveRewardPerWave;
        const modifiers = computeMutationModifiers(state.activeMutations);
        const finalReward = Math.round(reward * modifiers.waveRewardMult);
        state.addIsm(finalReward);
        this.hud!.showWaveBanner(state.currentWave, finalReward);
        this.hud!.setCrisisWarning(null);

        // Mutation selection every 5 waves
        if (state.currentWave > 0 && state.currentWave % 5 === 0) {
          state.setPhase('result');
          setTimeout(() => {
            if (store.getState().phase !== 'result') return;
            const mutations = pickRandomMutations(store.getState().activeMutations, 3);
            if (mutations.length > 0 && this.mutationUI) {
              this.mutationUI.show(mutations);
            } else {
              store.getState().setPhase('build');
              this.hud!.render();
            }
          }, 1000);
        } else {
          state.setPhase('result');
          setTimeout(() => {
            if (store.getState().phase === 'result') {
              store.getState().setPhase('build');
              this.hud!.render();
            }
          }, 1500);
        }

        // Preview next crisis
        const nextCrisis = getCrisisForWave(state.currentWave + 1);
        if (nextCrisis) {
          this.hud!.setCrisisWarning(`다음 웨이브: ${nextCrisis.nameKo}`);
        }
      } else {
        const waveIndex = this.getSurvivalWaveIndex(state.currentWave, config);
        const waveDef = config.waves[waveIndex];
        const reward = waveDef ? Math.round(waveDef.reward * ismMult) : 0;
        if (reward > 0) state.addIsm(reward);
        if (waveDef) this.hud!.showWaveBanner(state.currentWave, reward);

        // Proxima unlock on map_1_1 wave 2 clear
        if (mapId === 'map_1_1' && state.currentWave === 2) {
          store.getState().unlockTower('proxima');
        }

        // Survival cycle tracking
        if (config.isSurvival && state.currentWave % config.waves.length === 0) {
          store.getState().incrementSurvivalCycle();
        }

        if (!config.isSurvival && state.currentWave >= state.totalWaves) {
          state.setPhase('clear');
          this.hud!.showEndScreen(true, mapId);
        } else {
          state.setPhase('result');
          setTimeout(() => {
            if (store.getState().phase === 'result') {
              store.getState().setPhase('build');
              this.showTutorial();
              this.hud!.render();
            }
          }, 1500);
        }
      }
      this.hud!.render();
    };

    this.hud.onStartWave = () => {
      if (store.getState().phase !== 'build') return;
      this.radialMenu!.hide();
      store.getState().nextWave();

      const waveIdx = store.getState().currentWave;
      store.getState().setPhase('wave');
      this.hud!.hideTutorial();
      this.hud!.render();

      if (config.isHeatDeath) {
        const state = store.getState();
        const scaling = getHeatDeathScaling(waveIdx);
        const modifiers = computeMutationModifiers(state.activeMutations);

        // Extinction boss every 25 waves
        if (waveIdx > 0 && waveIdx % 25 === 0) {
          const bossIndex = Math.floor(waveIdx / 25) - 1;
          const bossWave = generateExtinctionBossWave(bossIndex, waveIdx, scaling);
          this.waveEngine!.startWave(bossWave);
          return;
        }

        // Crisis every 10 waves
        const crisis = getCrisisForWave(waveIdx);
        if (crisis) {
          this.hud!.setCrisisWarning(`⚠ ${crisis.nameKo}: ${crisis.description}`);
          if (crisis.type === 'swarm' || crisis.type === 'antimatter_flood') {
            const crisisWave = generateCrisisWave(crisis.type, waveIdx, scaling);
            this.waveEngine!.startWave(crisisWave);
            return;
          }
          if (crisis.type === 'entropy_permanent') {
            store.getState().setEntropyPermanent();
          }
          if (crisis.type === 'shrink_build') {
            store.getState().incrementBuildShrink();
          }
        }

        const waveDef = generateHeatDeathWave(waveIdx, scaling, modifiers, state.entropyPermanent);
        this.waveEngine!.startWave(waveDef);
      } else {
        const waveIndex = this.getSurvivalWaveIndex(waveIdx, config);
        const waveDef = config.waves[waveIndex];
        if (config.isSurvival) {
          const cycle = store.getState().survivalCycle;
          const scaledWave = this.scaleSurvivalWave(waveDef, cycle);
          this.waveEngine!.startWave(scaledWave);
        } else {
          this.waveEngine!.startWave(waveDef);
        }
      }
    };

    this.hud.onTowerSelected = () => {
      this.radialMenu!.hide();
    };

    this.hud.onRestart = () => {
      this.startMap(mapId);
    };

    this.hud.onCycleSpeed = () => {
      store.getState().cycleSpeed();
      this.fixedStep?.resetAccumulator();
      this.hud!.render();
    };

    this.hud.onBack = () => {
      this.showMapSelect();
    };

    this.hud.onContinue = () => {
      this.onMapVictory(mapId);
    };

    this.hud.onCastSpell = (spellId: string) => {
      if (!this.spellEngine || !this.waveEngine || !this.gameStore) return;
      const enemies = this.waveEngine.getAliveEnemies();
      this.spellEngine.castSpell(spellId, enemies, this.gameStore);
      this.hud!.render();
    };

    // Pointer handler — allowed during build AND wave phases
    this.scene.onPointerDown = (_evt, pickResult) => {
      const state = store.getState();
      if (state.phase === 'gameover') return;
      if (this.radialMenu!.isVisible()) return;

      if (!pickResult.hit || !pickResult.pickedMesh?.metadata) return;
      const meta = pickResult.pickedMesh.metadata;

      if (meta.type === 'tower') {
        const tower = this.towerEngine!.findTowerAt(meta.row, meta.col);
        if (!tower) return;

        this.selectedTower = tower;
        this.hud!.clearSelection();
        this.hud!.render();

        const screenPos = this.radialMenu!.worldToScreen(tower.mesh.position, this.scene, this.engine);
        const menuItems: import('@/shared/ui/RadialMenu').RadialMenuItem[] = [
          { id: 'sell', label: `철거\n+${tower.sellValue}`, color: '#f66' },
        ];
        const evo = getEvolutions(tower.def.id);
        if (evo) {
          for (const path of evo.paths) {
            const dynamicCost = getEvolutionCost(tower.def, path);
            const canAfford = store.getState().ism >= dynamicCost;
            menuItems.push({
              id: `evo_${path.targetId}`,
              label: `${path.nameKo}\n${dynamicCost}`,
              color: '#6f6',
              disabled: !canAfford,
            });
          }
        }
        this.radialMenu!.show(screenPos.x, screenPos.y, menuItems);
        return;
      }

      if (meta.type === 'tile') {
        const nebulaId = this.hud!.getSelectedNebulaId();
        if (nebulaId) {
          const nebDef = NEBULA_DEFS[nebulaId];
          if (!nebDef) return;
          if (!store.getState().spendIsm(nebDef.cost)) return;
          const placed = this.nebulaEngine!.placeNebula(nebulaId, meta.row, meta.col);
          if (!placed) {
            store.getState().addIsm(nebDef.cost);
          }
          this.hud!.render();
          return;
        }

        const towerId = this.hud!.getSelectedTowerId();
        if (!towerId) return;

        const def = TOWER_DEFS[towerId];
        if (!def) return;
        const costMult = env?.towerCostMultiplier ?? 1;
        const finalCost = Math.round(def.cost * costMult);
        if (store.getState().ism < finalCost) return;

        if (!this.mapEngine!.isBuildable(meta.row, meta.col)) return;

        this.showPlacementPreview(towerId, def, meta.row, meta.col, finalCost);
      }
    };

    // Store subscription for HUD updates
    this.storeUnsub = store.subscribe(() => {
      const state = store.getState();
      this.hud!.render();
      if (state.phase === 'gameover') {
        if (config.isHeatDeath) {
          const wave = state.currentWave;
          const kills = state.enemiesKilled;
          const mutNames = state.activeMutations.map(id => MUTATION_DEFS[id]?.nameKo ?? id);
          const record = loadRecord();
          const newBest = isNewBest(wave, kills);
          if (newBest) {
            saveRecord({ bestWave: wave, bestKills: kills, lastMutations: state.activeMutations, bestTime: Date.now() - state.heatDeathStartTime });
          }
          this.hud!.showHeatDeathEndScreen(wave, kills, mutNames, record.bestWave, newBest);
        } else {
          this.hud!.showEndScreen(false, mapId);
        }
      }
    });

    // Tutorial
    this.showTutorial();
  }

  onMapVictory(mapId: string) {
    const config = MAP_CONFIGS[mapId];
    if (!config) return;

    this.campaignStore.getState().completeMap(mapId);
    if (config.unlockOnClear) {
      this.campaignStore.getState().unlockMap(config.unlockOnClear);
    }
    this.campaignStore.getState().save();

    this.showMapSelect();
  }

  returnToMapSelect() {
    this.showMapSelect();
  }

  private getSurvivalWaveIndex(waveNum: number, config: MapConfig): number {
    if (!config.isSurvival) return waveNum - 1;
    return (waveNum - 1) % config.waves.length;
  }

  private scaleSurvivalWave(waveDef: WaveDef, cycle: number): WaveDef {
    if (cycle <= 0) return waveDef;
    const scale = 1 + cycle * 0.2;
    return {
      reward: Math.round(waveDef.reward * scale),
      spawns: waveDef.spawns.map(s => ({ ...s })),
    };
  }

  private showPlacementPreview(towerId: string, def: TowerDef, row: number, col: number, cost: number) {
    this.clearPreview();

    const worldPos = this.mapEngine!.tileToWorld(row, col);
    const [r, g, b] = ciToRgb(def.ci);
    const color = new BABYLON.Color3(r, g, b);

    const ghostMat = new BABYLON.StandardMaterial('previewMat', this.scene);
    ghostMat.diffuseColor = color;
    ghostMat.emissiveColor = color.scale(0.6);
    ghostMat.alpha = 0.5;
    ghostMat.specularColor = BABYLON.Color3.Black();

    this.previewMesh = BABYLON.MeshBuilder.CreateSphere('previewTower', {
      diameter: 0.6,
      segments: 16,
    }, this.scene);
    this.previewMesh.position.copyFrom(worldPos);
    this.previewMesh.position.y = 0.35;
    this.previewMesh.material = ghostMat;
    this.previewMesh.isPickable = false;

    const pulse = new BABYLON.Animation('previewPulse', 'scaling', 30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    pulse.setKeys([
      { frame: 0, value: new BABYLON.Vector3(0.9, 0.9, 0.9) },
      { frame: 15, value: new BABYLON.Vector3(1.1, 1.1, 1.1) },
      { frame: 30, value: new BABYLON.Vector3(0.9, 0.9, 0.9) },
    ]);
    this.previewMesh.animations = [pulse];
    this.scene.beginAnimation(this.previewMesh, 0, 30, true);

    const rangeMat = new BABYLON.StandardMaterial('previewRangeMat', this.scene);
    rangeMat.diffuseColor = color.scale(0.2);
    rangeMat.emissiveColor = color.scale(0.1);
    rangeMat.alpha = 0.35;
    rangeMat.specularColor = BABYLON.Color3.Black();

    this.previewRangeDisc = BABYLON.MeshBuilder.CreateDisc('previewRange', {
      radius: def.range,
      tessellation: 48,
    }, this.scene);
    this.previewRangeDisc.rotation.x = Math.PI / 2;
    this.previewRangeDisc.position.copyFrom(worldPos);
    this.previewRangeDisc.position.y = 0.006;
    this.previewRangeDisc.material = rangeMat;
    this.previewRangeDisc.isPickable = false;

    this.previewTowerId = towerId;
    this.previewRow = row;
    this.previewCol = col;

    const screenPos = this.radialMenu!.worldToScreen(
      new BABYLON.Vector3(worldPos.x, 0.35, worldPos.z), this.scene, this.engine,
    );
    this.radialMenu!.show(screenPos.x, screenPos.y, [
      { id: 'confirm_place', label: `배치\n-${cost}`, color: '#6f6' },
      { id: 'cancel_place', label: '취소', color: '#f66' },
    ]);
  }

  private confirmPlacement() {
    if (!this.previewTowerId || !this.gameStore || !this.towerEngine) return;

    const def = TOWER_DEFS[this.previewTowerId];
    if (!def) { this.clearPreview(); return; }

    const config = MAP_CONFIGS[this.currentMapId!];
    const env = config?.environment ? MAP_ENVIRONMENTS[config.environment] : undefined;
    const costMult = env?.towerCostMultiplier ?? 1;
    const finalCost = Math.round(def.cost * costMult);

    if (!this.gameStore.getState().spendIsm(finalCost)) { this.clearPreview(); return; }

    const placed = this.towerEngine.placeTower(this.previewTowerId, this.previewRow, this.previewCol);
    if (placed) {
      this.gameStore.getState().incrementTowersPlaced();
      this.animateTowerPlacement(placed.mesh);
    } else {
      this.gameStore.getState().addIsm(finalCost);
    }
    this.clearPreview();
    this.hud!.render();
  }

  private spawnExplosionEffect(pos: BABYLON.Vector3, radius: number) {
    const ring = BABYLON.MeshBuilder.CreateDisc('explosion', {
      radius: 0.1,
      tessellation: 48,
    }, this.scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos.x, 0.02, pos.z);
    const mat = new BABYLON.StandardMaterial('explosionMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0.4, 0.1);
    mat.emissiveColor = new BABYLON.Color3(1, 0.3, 0.05);
    mat.alpha = 0.8;
    mat.specularColor = BABYLON.Color3.Black();
    ring.material = mat;

    const scaleAnim = new BABYLON.Animation('explodeScale', 'scaling', 30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const target = radius * 2;
    scaleAnim.setKeys([
      { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
      { frame: 15, value: new BABYLON.Vector3(target, target, target) },
    ]);
    const alphaAnim = new BABYLON.Animation('explodeAlpha', 'material.alpha', 30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    alphaAnim.setKeys([
      { frame: 0, value: 0.8 },
      { frame: 15, value: 0 },
    ]);
    ring.animations = [scaleAnim, alphaAnim];
    this.scene.beginAnimation(ring, 0, 15, false, 1, () => ring.dispose());
  }

  private clearPreview() {
    if (this.previewMesh) { this.previewMesh.dispose(); this.previewMesh = null; }
    if (this.previewRangeDisc) { this.previewRangeDisc.dispose(); this.previewRangeDisc = null; }
    this.previewTowerId = null;
    this.previewRow = -1;
    this.previewCol = -1;
  }

  private animateTowerPlacement(mesh: BABYLON.Mesh) {
    const original = mesh.scaling.clone();
    mesh.scaling.setAll(0);
    const anim = new BABYLON.Animation('towerPlace', 'scaling', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([
      { frame: 0, value: new BABYLON.Vector3(0, 0, 0) },
      { frame: 9, value: original },
    ]);
    mesh.animations = [anim];
    this.scene.beginAnimation(mesh, 0, 9, false);
  }

  private showFloatingIsm(amount: number, worldPos: BABYLON.Vector3) {
    const projected = BABYLON.Vector3.Project(
      worldPos,
      BABYLON.Matrix.Identity(),
      this.scene.getTransformMatrix(),
      this.camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight()),
    );
    const dpr = this.engine.getHardwareScalingLevel();
    const rect = this.canvas.getBoundingClientRect();
    const screenPos = { x: projected.x * dpr + rect.left, y: projected.y * dpr + rect.top };
    const el = document.createElement('div');
    el.textContent = `+${amount}`;
    el.style.cssText = `position:fixed;left:${screenPos.x}px;top:${screenPos.y}px;color:#ff4;font-family:monospace;font-size:14px;font-weight:bold;pointer-events:none;z-index:20;text-shadow:0 0 4px rgba(255,255,0,0.5);transition:all 0.5s ease-out;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.top = `${screenPos.y - 40}px`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 500);
  }

  private showTutorial() {
    if (!this.gameStore || !this.hud) return;
    if (this.currentMapId !== 'map_1_1') return;
    const wave = this.gameStore.getState().currentWave;
    const msg = TUTORIALS[wave];
    if (msg) this.hud.showTutorial(msg);
    else this.hud.hideTutorial();
  }

  private cleanupGameplay() {
    this.scene.onPointerDown = undefined;
    this.clearPreview();

    if (this.storeUnsub) {
      this.storeUnsub();
      this.storeUnsub = null;
    }

    this.towerEngine?.clear();
    this.waveEngine?.clear();
    this.nebulaEngine?.dispose();
    this.hud?.dispose();
    this.radialMenu?.dispose();
    this.mutationUI?.dispose();
    this.mutationUI = null;

    // Dispose map meshes from scene
    const toDispose = this.scene.meshes.filter(m =>
      m.name.startsWith('tile_') ||
      m.name.startsWith('pathLine') ||
      m.name.startsWith('spawnMarker') ||
      m.name.startsWith('baseMarker')
    );
    for (const m of toDispose) m.dispose();

    // Dispose map materials
    const matsToDispose = this.scene.materials.filter(m =>
      m.name === 'tileBuildable' ||
      m.name === 'tilePath' ||
      m.name.startsWith('spawnMat') ||
      m.name === 'baseMat'
    );
    for (const m of matsToDispose) m.dispose();

    this.mapEngine = null;
    this.towerEngine = null;
    this.waveEngine = null;
    this.nebulaEngine = null;
    this.spellEngine = null;
    this.gameStore = null;
    this.hud = null;
    this.radialMenu = null;
    this.fixedStep = null;
    this.selectedTower = null;
    this.currentMapId = null;
  }

  private setupCamera() {
    this.camera = new BABYLON.ArcRotateCamera(
      'cam', -Math.PI / 2, 0.1, 16, BABYLON.Vector3.Zero(), this.scene,
    );
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = 0.1;
    this.camera.lowerRadiusLimit = 16;
    this.camera.upperRadiusLimit = 16;
    this.camera.panningSensibility = 0;
    this.camera.attachControl(this.canvas, false);
    this.camera.inputs.clear();
  }

  private setupLighting() {
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.6;
    hemi.diffuse = new BABYLON.Color3(0.7, 0.7, 1.0);
    hemi.groundColor = new BABYLON.Color3(0.1, 0.1, 0.2);
  }

  private setupGlow() {
    this.glowLayer = new BABYLON.GlowLayer('glowLayer', this.scene, {
      blurKernelSize: 32,
    });
    this.glowLayer.intensity = 0.5;
  }

  private setupStarfield() {
    this.starfieldSPS = new BABYLON.SolidParticleSystem('starfield', this.scene, { isPickable: false });
    const starModel = BABYLON.MeshBuilder.CreatePlane('starModel', { size: 1 }, this.scene);
    this.starfieldSPS.addShape(starModel, 400);
    starModel.dispose();
    this.starfieldMesh = this.starfieldSPS.buildMesh();
    this.starfieldMesh.isPickable = false;
    const starfieldMat = new BABYLON.StandardMaterial('starfieldMat', this.scene);
    starfieldMat.disableLighting = true;
    starfieldMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    starfieldMat.specularColor = BABYLON.Color3.Black();
    this.starfieldMesh.material = starfieldMat;
    this.glowLayer.addExcludedMesh(this.starfieldMesh);

    this.starfieldSPS.initParticles = () => {
      for (let i = 0; i < this.starfieldSPS.nbParticles; i++) {
        const p = this.starfieldSPS.particles[i];
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 20;
        const height = 8 + Math.random() * 15;
        p.position.x = Math.cos(angle) * radius;
        p.position.z = Math.sin(angle) * radius;
        p.position.y = height;
        p.rotation.x = Math.PI / 2;
        const sz = 0.02 + Math.random() * 0.06;
        p.scaling.x = sz;
        p.scaling.y = sz;
        p.scaling.z = sz;
        const temp = Math.random();
        if (temp < 0.7) {
          p.color = new BABYLON.Color4(0.9, 0.92, 1.0, 1);
        } else if (temp < 0.9) {
          p.color = new BABYLON.Color4(1.0, 0.95, 0.8, 1);
        } else {
          p.color = new BABYLON.Color4(0.7, 0.8, 1.0, 1);
        }
        p.props = { baseAlpha: 0.5 + Math.random() * 0.5, twinkleSpeed: 1 + Math.random() * 3, twinklePhase: Math.random() * Math.PI * 2 };
      }
    };

    const self = this;
    this.starfieldSPS.updateParticle = (p) => {
      const props = p.props as { baseAlpha: number; twinkleSpeed: number; twinklePhase: number };
      const twinkle = props.baseAlpha * (0.7 + 0.3 * Math.sin(self._starTime * props.twinkleSpeed + props.twinklePhase));
      if (p.color) p.color.a = twinkle;
      return p;
    };

    this.starfieldSPS.initParticles();
    this.starfieldSPS.setParticles();
  }

  private renderLoop() {
    if (this.screenState === 'mapSelect') {
      // Still render the 3D scene behind (starfield visible)
      const dtSec = this.engine.getDeltaTime() / 1000;
      this._starTime += dtSec;
      this.starfieldSPS.setParticles();
      this.scene.render();
      return;
    }

    // Gameplay
    if (!this.gameStore || !this.fixedStep || !this.towerEngine || !this.waveEngine) {
      this.scene.render();
      return;
    }

    const state = this.gameStore.getState();
    const rawDelta = Math.min(this.engine.getDeltaTime(), 50);
    const deltaMs = rawDelta * state.speed;
    const phase = state.phase;
    const dtSec = deltaMs / 1000;

    const alpha = this.fixedStep.advance(deltaMs, () => {
      if (phase === 'wave') {
        this.waveEngine!.fixedUpdate(this.fixedStep!.fixedDt);
        this.towerEngine!.fixedUpdate(this.fixedStep!.fixedDt, this.waveEngine!);
        const waveSynergies = this.towerEngine!.getActiveSynergies();
        this.hud!.activeSynergyNames = waveSynergies.map(s => s.nameKo);
        this.hud!.activeSynergyData = waveSynergies.map(s => ({ id: s.id, nameKo: s.nameKo, description: s.description }));
        if (this.nebulaEngine) {
          const enemies = this.waveEngine!.getAliveEnemies();
          this.nebulaEngine.applyDotDamage(enemies, this.fixedStep!.fixedDt);
        }
        this.gameStore!.getState().tickCooldowns(this.fixedStep!.fixedDt);
      }
    });

    // Build phase: evaluate synergies (no buffs applied, display only)
    if (phase === 'build' && this.towerEngine.getTowers().length > 0) {
      if (this.previewTowerId) {
        const def = TOWER_DEFS[this.previewTowerId];
        if (def) {
          const preview = this.towerEngine.previewSynergies(def, this.previewRow, this.previewCol);
          const current = this.towerEngine.evaluateSynergiesOnly();
          const curIds = new Set(current.map(s => s.id));
          this.hud!.activeSynergyNames = preview.map(s => curIds.has(s.id) ? s.nameKo : `+${s.nameKo}`);
          this.hud!.activeSynergyData = preview.map(s => ({
            id: s.id, nameKo: s.nameKo, description: s.description,
            isNew: !curIds.has(s.id),
          }));
        }
      } else {
        const synergies = this.towerEngine.evaluateSynergiesOnly();
        this.hud!.activeSynergyNames = synergies.map(s => s.nameKo);
        this.hud!.activeSynergyData = synergies.map(s => ({ id: s.id, nameKo: s.nameKo, description: s.description }));
      }
    }

    if (phase === 'wave') {
      this.waveEngine.interpolate(alpha);
      this.towerEngine.interpolate(alpha);
    }

    this.towerEngine.updateVisuals(dtSec);
    this.waveEngine.updateVisuals(dtSec);
    this.nebulaEngine?.updateVisuals(dtSec);

    this._starTime += dtSec;
    this.starfieldSPS.setParticles();

    this.scene.render();
  }
}
