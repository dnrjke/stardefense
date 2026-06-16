import * as BABYLON from '@babylonjs/core';

export interface RadialMenuItem {
  id: string;
  label: string;
  color: string;
  disabled?: boolean;
}

export class RadialMenu {
  private container: HTMLDivElement;
  private visible = false;
  private items: RadialMenuItem[] = [];
  onSelect: ((itemId: string) => void) | null = null;
  onClose: (() => void) | null = null;

  private readonly radius = 52;
  private readonly btnSize = 40;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    document.body.appendChild(this.container);
  }

  show(screenX: number, screenY: number, items: RadialMenuItem[]) {
    this.items = items;
    this.visible = true;
    this.container.style.pointerEvents = 'auto';
    this.container.innerHTML = '';

    // Backdrop (click to close)
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    backdrop.onclick = (e) => {
      e.stopPropagation();
      this.hide();
      this.onClose?.();
    };
    this.container.appendChild(backdrop);

    // Center ring indicator
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;left:${screenX - 28}px;top:${screenY - 28}px;width:56px;height:56px;border:2px solid rgba(100,120,200,0.5);border-radius:50%;pointer-events:none;`;
    this.container.appendChild(ring);

    // Buttons arranged in circle
    const count = items.length;
    const startAngle = -Math.PI / 2; // top

    for (let i = 0; i < count; i++) {
      const item = items[i];
      const angle = startAngle + (2 * Math.PI * i) / count;
      const bx = screenX + Math.cos(angle) * this.radius - this.btnSize / 2;
      const by = screenY + Math.sin(angle) * this.radius - this.btnSize / 2;

      const btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = `
        position:absolute;
        left:${bx}px;top:${by}px;
        width:${this.btnSize}px;height:${this.btnSize}px;
        border-radius:50%;
        border:2px solid ${item.color};
        background:rgba(10,10,30,0.85);
        color:${item.disabled ? '#555' : '#ddf'};
        font-family:monospace;font-size:10px;
        cursor:${item.disabled ? 'not-allowed' : 'pointer'};
        display:flex;align-items:center;justify-content:center;
        pointer-events:auto;
        transition:transform 0.1s, background 0.1s;
        animation:radialPop 0.15s ease-out;
      `.replace(/\s+/g, ' ');

      if (!item.disabled) {
        btn.onmouseenter = () => { btn.style.background = `${item.color}33`; btn.style.transform = 'scale(1.15)'; };
        btn.onmouseleave = () => { btn.style.background = 'rgba(10,10,30,0.85)'; btn.style.transform = 'scale(1)'; };
        btn.onclick = (e) => {
          e.stopPropagation();
          this.hide();
          this.onSelect?.(item.id);
        };
      }

      this.container.appendChild(btn);
    }
  }

  hide() {
    this.visible = false;
    this.container.style.pointerEvents = 'none';
    this.container.innerHTML = '';
  }

  isVisible(): boolean { return this.visible; }

  worldToScreen(worldPos: BABYLON.Vector3, scene: BABYLON.Scene, engine: BABYLON.Engine): { x: number; y: number } {
    const projected = BABYLON.Vector3.Project(
      worldPos,
      BABYLON.Matrix.Identity(),
      scene.getTransformMatrix(),
      scene.activeCamera!.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
    );
    return { x: projected.x, y: projected.y };
  }

  dispose() {
    this.container.remove();
  }
}
