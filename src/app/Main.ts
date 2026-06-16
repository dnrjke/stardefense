import * as BABYLON from '@babylonjs/core';
import { FixedTimestep } from '@/core/FixedTimestep';
import { MapEngine } from '@/engines/map/MapEngine';
import { TowerEngine } from '@/engines/tower/TowerEngine';
import { WaveEngine } from '@/engines/wave/WaveEngine';
import { HUD } from '@/shared/ui/HUD';
import { RadialMenu } from '@/shared/ui/RadialMenu';
import { createGameStore } from '@/app/store/GameStore';
import { createMap1_1 } from '@/shared/data/MapData';
import { MAP_1_1_WAVES } from '@/shared/data/WaveData';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import type { TowerEntity } from '@/engines/tower/TowerEntity';

// ── Tutorial messages ──
const TUTORIALS: Record<number, string> = {
  0: '성간 물질(ISM)로 항성을 배치하세요. 하단에서 태양을 선택 후 타일을 클릭합니다.',
  1: '항성이 자동으로 적을 공격합니다. 다음 웨이브를 시작하세요.',
  2: '빠른 적 "혜성"이 등장합니다. 프록시마(속사 타워)가 해금되었습니다!',
  4: '빌드 페이즈에서 타워를 추가하거나 기존 배치를 보강하세요.',
};

async function main() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  // ── Babylon Engine ──
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
  }, true);

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.06, 1);
  scene.skipPointerMovePicking = true;

  // ── Camera (top-down fixed) ──
  const camera = new BABYLON.ArcRotateCamera(
    'cam', -Math.PI / 2, 0.1, 16, BABYLON.Vector3.Zero(), scene,
  );
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = 0.1;
  camera.lowerRadiusLimit = 16;
  camera.upperRadiusLimit = 16;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, false);
  camera.inputs.clear();

  // ── Lighting ──
  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.6;
  hemi.diffuse = new BABYLON.Color3(0.7, 0.7, 1.0);
  hemi.groundColor = new BABYLON.Color3(0.1, 0.1, 0.2);

  // ── GlowLayer ──
  const glowLayer = new BABYLON.GlowLayer('glowLayer', scene, {
    blurKernelSize: 32,
  });
  glowLayer.intensity = 0.5;

  // ── Starfield Background ──
  // SolidParticleSystem with hundreds of bright points at varying depths
  const starfieldSPS = new BABYLON.SolidParticleSystem('starfield', scene, { isPickable: false });
  const starModel = BABYLON.MeshBuilder.CreatePlane('starModel', { size: 1 }, scene);
  starfieldSPS.addShape(starModel, 400);
  starModel.dispose();
  const starfieldMesh = starfieldSPS.buildMesh();
  starfieldMesh.isPickable = false;
  const starfieldMat = new BABYLON.StandardMaterial('starfieldMat', scene);
  starfieldMat.disableLighting = true;
  starfieldMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  starfieldMat.specularColor = BABYLON.Color3.Black();
  starfieldMesh.material = starfieldMat;
  // Exclude starfield from glow (it would bloom everything)
  glowLayer.addExcludedMesh(starfieldMesh);

  // Initialize star particles
  starfieldSPS.initParticles = () => {
    for (let i = 0; i < starfieldSPS.nbParticles; i++) {
      const p = starfieldSPS.particles[i];
      // Spread stars in a large dome above the map
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      const height = 8 + Math.random() * 15;
      p.position.x = Math.cos(angle) * radius;
      p.position.z = Math.sin(angle) * radius;
      p.position.y = height;
      // Face camera (billboard)
      p.rotation.x = Math.PI / 2;
      // Random size (tiny dots)
      const sz = 0.02 + Math.random() * 0.06;
      p.scaling.x = sz;
      p.scaling.y = sz;
      p.scaling.z = sz;
      // Slight color variation (white to blue-white to warm)
      const temp = Math.random();
      if (temp < 0.7) {
        p.color = new BABYLON.Color4(0.9, 0.92, 1.0, 1);
      } else if (temp < 0.9) {
        p.color = new BABYLON.Color4(1.0, 0.95, 0.8, 1);
      } else {
        p.color = new BABYLON.Color4(0.7, 0.8, 1.0, 1);
      }
      // Store base alpha for twinkling
      p.props = { baseAlpha: 0.5 + Math.random() * 0.5, twinkleSpeed: 1 + Math.random() * 3, twinklePhase: Math.random() * Math.PI * 2 };
    }
  };

  let _starTime = 0;
  starfieldSPS.updateParticle = (p) => {
    // Twinkling: subtle alpha oscillation
    const props = p.props as { baseAlpha: number; twinkleSpeed: number; twinklePhase: number };
    const twinkle = props.baseAlpha * (0.7 + 0.3 * Math.sin(_starTime * props.twinkleSpeed + props.twinklePhase));
    if (p.color) p.color.a = twinkle;
    return p;
  };

  starfieldSPS.initParticles();
  starfieldSPS.setParticles();

  // ── Map ──
  const mapDef = createMap1_1();
  const mapEngine = new MapEngine(scene, mapDef);
  const waypoints = mapEngine.getWaypoints();

  // ── Engines ──
  const waveEngine = new WaveEngine(scene, waypoints);
  const towerEngine = new TowerEngine(scene, mapEngine);

  // ── Store ──
  const store = createGameStore(MAP_1_1_WAVES.length);
  const hud = new HUD(store);
  const radialMenu = new RadialMenu();

  // ── Fixed Timestep ──
  const fixedStep = new FixedTimestep();

  // ── Radial Menu State ──
  let selectedTower: TowerEntity | null = null;

  radialMenu.onSelect = (itemId) => {
    if (!selectedTower) return;
    if (itemId === 'sell') {
      const refund = towerEngine.sellTower(selectedTower);
      if (refund > 0) store.getState().addIsm(refund);
      hud.render();
    }
    // Future: 'upgrade' handling
    selectedTower = null;
  };

  radialMenu.onClose = () => {
    selectedTower = null;
  };

  // ── Game Logic Wiring ──

  towerEngine.onEnemyHit = (enemy, damage) => {
    const killed = waveEngine.killEnemy(enemy, damage);
    if (killed) {
      store.getState().addIsm(enemy.def.reward);
    }
  };

  waveEngine.onEnemyReachedEnd = (_enemy) => {
    store.getState().damageBase(1);
  };

  waveEngine.onWaveCleared = () => {
    const state = store.getState();
    const waveDef = MAP_1_1_WAVES[state.currentWave - 1];
    if (waveDef) state.addIsm(waveDef.reward);

    if (waveDef) hud.showWaveBanner(state.currentWave, waveDef.reward);

    // Wave 2 클리어 시 프록시마 해금 (빌드 페이즈 진입 전)
    if (state.currentWave === 2) {
      store.getState().unlockTower('proxima');
    }

    if (state.currentWave >= state.totalWaves) {
      state.setPhase('clear');
      hud.showEndScreen(true);
    } else {
      state.setPhase('result');
      setTimeout(() => {
        if (store.getState().phase === 'result') {
          store.getState().setPhase('build');
          showTutorial();
          hud.render();
        }
      }, 1500);
    }
    hud.render();
  };

  hud.onStartWave = () => {
    if (store.getState().phase !== 'build') return;
    radialMenu.hide();
    store.getState().nextWave();

    const waveIdx = store.getState().currentWave;

    store.getState().setPhase('wave');
    hud.hideTutorial();
    hud.render();
    waveEngine.startWave(MAP_1_1_WAVES[waveIdx - 1]);
  };

  hud.onTowerSelected = (_towerId) => {
    radialMenu.hide();
  };

  hud.onRestart = () => {
    window.location.reload();
  };

  hud.onCycleSpeed = () => {
    store.getState().cycleSpeed();
    hud.render();
  };

  // ── Pointer → Place Tower or Open Radial Menu ──
  scene.onPointerDown = (_evt, pickResult) => {
    const state = store.getState();
    if (state.phase !== 'build') return;
    if (radialMenu.isVisible()) return;

    if (!pickResult.hit || !pickResult.pickedMesh?.metadata) return;
    const meta = pickResult.pickedMesh.metadata;

    // Clicked a tower → open radial menu
    if (meta.type === 'tower') {
      const tower = towerEngine.findTowerAt(meta.row, meta.col);
      if (!tower) return;

      selectedTower = tower;
      hud.clearSelection();
      hud.render();

      const screenPos = radialMenu.worldToScreen(tower.mesh.position, scene, engine);

      radialMenu.show(screenPos.x, screenPos.y, [
        { id: 'sell', label: `철거\n+${tower.sellValue}`, color: '#f66' },
        { id: 'upgrade', label: '강화', color: '#6af', disabled: true },
      ]);
      return;
    }

    // Clicked a tile → place tower
    if (meta.type === 'tile') {
      const towerId = hud.getSelectedTowerId();
      if (!towerId) return;

      const def = TOWER_DEFS[towerId];
      if (!def) return;
      if (!store.getState().spendIsm(def.cost)) return;

      towerEngine.placeTower(towerId, meta.row, meta.col);
      hud.render();
    }
  };

  // ── Tutorial ──
  function showTutorial() {
    const wave = store.getState().currentWave;
    const msg = TUTORIALS[wave];
    if (msg) hud.showTutorial(msg);
    else hud.hideTutorial();
  }

  showTutorial();

  // ── Store subscription for HUD updates ──
  store.subscribe(() => {
    const state = store.getState();
    hud.render();
    if (state.phase === 'gameover') {
      hud.showEndScreen(false);
    }
  });

  // ── Render Loop ──
  engine.runRenderLoop(() => {
    const state = store.getState();
    const deltaMs = engine.getDeltaTime() * state.speed;
    const phase = state.phase;
    const dtSec = deltaMs / 1000;

    const alpha = fixedStep.advance(deltaMs, () => {
      if (phase === 'wave') {
        waveEngine.fixedUpdate(fixedStep.fixedDt);
        towerEngine.fixedUpdate(fixedStep.fixedDt, waveEngine);
      }
    });

    if (phase === 'wave') {
      waveEngine.interpolate(alpha);
      towerEngine.interpolate(alpha);
    }

    // Update shader visuals every frame (tower FBM animation, enemy effects, projectile glow)
    towerEngine.updateVisuals(dtSec);
    waveEngine.updateVisuals(dtSec);

    // Starfield twinkling
    _starTime += dtSec;
    starfieldSPS.setParticles();

    scene.render();
  });

  window.addEventListener('resize', () => engine.resize());
}

main();
