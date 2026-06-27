import * as BABYLON from '@babylonjs/core';

// ── Flash overlay shader ──
BABYLON.Effect.ShadersStore['spellFlareFlashVertexShader'] = `
  attribute vec3 position;
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;
BABYLON.Effect.ShadersStore['spellFlareFlashFragmentShader'] = `
  precision highp float;
  uniform float uAlpha;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, uAlpha);
  }
`;

// ── Shockwave ring shader ──
BABYLON.Effect.ShadersStore['spellFlareRingVertexShader'] = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 worldViewProjection;
  varying vec2 vUV;
  void main() {
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;
BABYLON.Effect.ShadersStore['spellFlareRingFragmentShader'] = `
  precision highp float;
  uniform float uProgress;
  uniform float uAlpha;
  varying vec2 vUV;
  void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUV - center) * 2.0;
    float ringPos = uProgress;
    float ringWidth = 0.08 + 0.04 * uProgress;
    float ring = 1.0 - smoothstep(0.0, ringWidth, abs(dist - ringPos));
    vec3 core = vec3(1.0, 1.0, 0.9);
    vec3 glow = vec3(1.0, 0.4, 0.1);
    float coreBlend = smoothstep(ringWidth * 0.6, 0.0, abs(dist - ringPos));
    vec3 col = mix(glow, core, coreBlend);
    float alpha = ring * uAlpha * (1.0 - uProgress * 0.8);
    gl_FragColor = vec4(col * 1.5, alpha);
  }
`;

// ── Gravity wave ripple shader ──
BABYLON.Effect.ShadersStore['spellGravityRippleVertexShader'] = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 worldViewProjection;
  varying vec2 vUV;
  void main() {
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;
BABYLON.Effect.ShadersStore['spellGravityRippleFragmentShader'] = `
  precision highp float;
  uniform float uProgress;
  varying vec2 vUV;
  void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUV - center) * 2.0;
    float ringPos = uProgress;
    float ringWidth = 0.04 + 0.02 * uProgress;
    float ring = 1.0 - smoothstep(0.0, ringWidth, abs(dist - ringPos));
    float innerGlow = 1.0 - smoothstep(0.0, ringWidth * 2.0, abs(dist - ringPos));
    vec3 core = vec3(0.25, 0.375, 1.0);
    vec3 edge = vec3(0.25, 1.0, 1.0);
    vec3 col = mix(edge, core, ring);
    float alpha = (ring * 0.9 + innerGlow * 0.3) * (1.0 - uProgress * 0.9);
    gl_FragColor = vec4(col * 1.6, alpha);
  }
`;

// ── Gravity wave distortion overlay shader ──
BABYLON.Effect.ShadersStore['spellGravityDistortVertexShader'] = `
  attribute vec3 position;
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;
BABYLON.Effect.ShadersStore['spellGravityDistortFragmentShader'] = `
  precision highp float;
  uniform float uTime;
  uniform float uAlpha;
  uniform vec2 uResolution;
  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    float waves = sin(dist * 40.0 - uTime * 8.0) * 0.5 + 0.5;
    waves *= smoothstep(0.6, 0.1, dist);
    float lines = pow(waves, 4.0);
    vec3 col = mix(vec3(0.15, 0.08, 0.35), vec3(0.3, 0.15, 0.6), lines);
    float a = lines * 0.5 * uAlpha;
    gl_FragColor = vec4(col, a);
  }
`;

interface EnemyPos {
  x: number;
  y: number;
  z: number;
}

export function playSupernovaFlare(scene: BABYLON.Scene, enemyPositions: EnemyPos[]): void {
  playFlash(scene);
  playShockwave(scene);
  playEnemyBursts(scene, enemyPositions);
  playScreenShake(scene);
}

function playFlash(scene: BABYLON.Scene): void {
  const mesh = BABYLON.MeshBuilder.CreatePlane('spellFlareFlash', { size: 2 }, scene);
  mesh.isPickable = false;
  mesh.renderingGroupId = 3;
  mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const mat = new BABYLON.ShaderMaterial('spellFlareFlashMat', scene, {
    vertex: 'spellFlareFlash',
    fragment: 'spellFlareFlash',
  }, {
    attributes: ['position'],
    uniforms: ['uAlpha', 'uColor'],
  });
  mat.backFaceCulling = false;
  mat.alphaMode = BABYLON.Constants.ALPHA_ADD;
  mat.setFloat('uAlpha', 1.0);
  mat.setVector3('uColor', new BABYLON.Vector3(1, 0.95, 0.85));
  mesh.material = mat;

  let elapsed = 0;
  const duration = 0.3;
  const obs = scene.onBeforeRenderObservable.add(() => {
    elapsed += scene.getEngine().getDeltaTime() / 1000;
    const t = Math.min(elapsed / duration, 1);
    const alpha = Math.pow(1 - t, 3);
    mat.setFloat('uAlpha', alpha);
    const orangeBlend = t * 0.6;
    mat.setVector3('uColor', new BABYLON.Vector3(1, 0.95 - orangeBlend * 0.5, 0.85 - orangeBlend * 0.7));
    if (t >= 1) {
      scene.onBeforeRenderObservable.remove(obs);
      mesh.dispose();
      mat.dispose();
    }
  });
}

function playShockwave(scene: BABYLON.Scene): void {
  const disc = BABYLON.MeshBuilder.CreateDisc('spellFlareRing', {
    radius: 15,
    tessellation: 64,
  }, scene);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 0.5;
  disc.isPickable = false;

  const mat = new BABYLON.ShaderMaterial('spellFlareRingMat', scene, {
    vertex: 'spellFlareRing',
    fragment: 'spellFlareRing',
  }, {
    attributes: ['position', 'uv'],
    uniforms: ['worldViewProjection', 'uProgress', 'uAlpha'],
  });
  mat.backFaceCulling = false;
  mat.alphaMode = BABYLON.Constants.ALPHA_ADD;
  mat.setFloat('uProgress', 0);
  mat.setFloat('uAlpha', 1);
  disc.material = mat;

  let elapsed = 0;
  const duration = 0.8;
  const obs = scene.onBeforeRenderObservable.add(() => {
    elapsed += scene.getEngine().getDeltaTime() / 1000;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 2);
    mat.setFloat('uProgress', eased);
    mat.setFloat('uAlpha', 1 - t * t);
    if (t >= 1) {
      scene.onBeforeRenderObservable.remove(obs);
      disc.dispose();
      mat.dispose();
    }
  });
}

function playEnemyBursts(scene: BABYLON.Scene, positions: EnemyPos[]): void {
  for (const pos of positions) {
    const ps = new BABYLON.ParticleSystem('spellFlareBurst', 20, scene);
    ps.createPointEmitter(
      new BABYLON.Vector3(-0.5, 0.5, -0.5),
      new BABYLON.Vector3(0.5, 1.0, 0.5),
    );
    ps.emitter = new BABYLON.Vector3(pos.x, pos.y + 0.3, pos.z);
    ps.minSize = 0.05;
    ps.maxSize = 0.15;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.4;
    ps.emitRate = 200;
    ps.manualEmitCount = 18;
    ps.color1 = new BABYLON.Color4(1, 0.9, 0.3, 1);
    ps.color2 = new BABYLON.Color4(1, 0.5, 0.1, 1);
    ps.colorDead = new BABYLON.Color4(1, 0.2, 0, 0);
    ps.minEmitPower = 2;
    ps.maxEmitPower = 5;
    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    ps.updateSpeed = 0.02;
    ps.gravity = new BABYLON.Vector3(0, -2, 0);
    ps.targetStopDuration = 0.05;
    ps.disposeOnStop = true;
    ps.start();
  }
}

function playScreenShake(scene: BABYLON.Scene): void {
  const cam = scene.activeCamera as BABYLON.ArcRotateCamera | null;
  if (!cam) return;
  const originalTarget = cam.target.clone();
  const intensity = 0.15;
  let frames = 0;
  const totalFrames = 4;
  const obs = scene.onBeforeRenderObservable.add(() => {
    if (frames < totalFrames) {
      cam.target = originalTarget.add(new BABYLON.Vector3(
        (Math.random() - 0.5) * 2 * intensity,
        0,
        (Math.random() - 0.5) * 2 * intensity,
      ));
      frames++;
    } else {
      cam.target = originalTarget;
      scene.onBeforeRenderObservable.remove(obs);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Gravity Wave
// ═══════════════════════════════════════════════════════════════════════════

export function playGravityWave(scene: BABYLON.Scene, enemyPositions: EnemyPos[]): void {
  playGravityRipples(scene);
  playGravityDistortion(scene);
  playEnemySlowPulse(scene, enemyPositions);
}

function playGravityRipples(scene: BABYLON.Scene): void {
  const RING_COUNT = 3;
  const STAGGER = 0.15;
  const DURATION = 1.0;
  const RADIUS = 12;

  for (let i = 0; i < RING_COUNT; i++) {
    const disc = BABYLON.MeshBuilder.CreateDisc(`spellGravRing${i}`, {
      radius: RADIUS,
      tessellation: 64,
    }, scene);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = 0.3;
    disc.isPickable = false;

    const mat = new BABYLON.ShaderMaterial(`spellGravRingMat${i}`, scene, {
      vertex: 'spellGravityRipple',
      fragment: 'spellGravityRipple',
    }, {
      attributes: ['position', 'uv'],
      uniforms: ['worldViewProjection', 'uProgress'],
    });
    mat.backFaceCulling = false;
    mat.alphaMode = BABYLON.Constants.ALPHA_ADD;
    mat.setFloat('uProgress', 0);
    disc.material = mat;

    const delay = i * STAGGER;
    let elapsed = 0;
    const obs = scene.onBeforeRenderObservable.add(() => {
      elapsed += scene.getEngine().getDeltaTime() / 1000;
      const localT = elapsed - delay;
      if (localT < 0) {
        mat.setFloat('uProgress', 0);
        return;
      }
      const t = Math.min(localT / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      mat.setFloat('uProgress', eased);
      if (t >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        disc.dispose();
        mat.dispose();
      }
    });
  }
}

function playGravityDistortion(scene: BABYLON.Scene): void {
  const mesh = BABYLON.MeshBuilder.CreatePlane('spellGravDistort', { size: 2 }, scene);
  mesh.isPickable = false;
  mesh.renderingGroupId = 3;
  mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const engine = scene.getEngine();
  const mat = new BABYLON.ShaderMaterial('spellGravDistortMat', scene, {
    vertex: 'spellGravityDistort',
    fragment: 'spellGravityDistort',
  }, {
    attributes: ['position'],
    uniforms: ['uTime', 'uAlpha', 'uResolution'],
  });
  mat.backFaceCulling = false;
  mat.alphaMode = BABYLON.Constants.ALPHA_ADD;
  mat.setFloat('uTime', 0);
  mat.setFloat('uAlpha', 0);
  mat.setVector2('uResolution', new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
  mesh.material = mat;

  let elapsed = 0;
  const duration = 0.5;
  const obs = scene.onBeforeRenderObservable.add(() => {
    elapsed += engine.getDeltaTime() / 1000;
    const t = Math.min(elapsed / duration, 1);
    mat.setFloat('uTime', elapsed);
    const alpha = t < 0.3 ? t / 0.3 : (1 - t) / 0.7;
    mat.setFloat('uAlpha', Math.max(alpha, 0));
    if (t >= 1) {
      scene.onBeforeRenderObservable.remove(obs);
      mesh.dispose();
      mat.dispose();
    }
  });
}

function playEnemySlowPulse(scene: BABYLON.Scene, positions: EnemyPos[]): void {
  const DURATION = 0.4;
  const MAX_RADIUS = 0.5;

  for (const pos of positions) {
    const ring = BABYLON.MeshBuilder.CreateDisc('spellGravPulse', {
      radius: MAX_RADIUS,
      tessellation: 32,
    }, scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos.x, 0.35, pos.z);
    ring.isPickable = false;
    ring.scaling.setAll(0.1);

    const mat = new BABYLON.StandardMaterial('spellGravPulseMat', scene);
    mat.emissiveColor = new BABYLON.Color3(0.4, 0.2, 0.9);
    mat.disableLighting = true;
    mat.alpha = 0.8;
    mat.backFaceCulling = false;
    ring.material = mat;

    let elapsed = 0;
    const obs = scene.onBeforeRenderObservable.add(() => {
      elapsed += scene.getEngine().getDeltaTime() / 1000;
      const t = Math.min(elapsed / DURATION, 1);
      const scale = 0.1 + t * 0.9;
      ring.scaling.setAll(scale);
      mat.alpha = 0.8 * (1 - t * t);
      if (t >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        ring.dispose();
        mat.dispose();
      }
    });
  }
}
