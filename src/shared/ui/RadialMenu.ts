import * as BABYLON from '@babylonjs/core';
import { getTopBarHeight } from '@/shared/ui/HUD';

export interface RadialMenuItem {
  id: string;
  label: string;
  color: string;
  disabled?: boolean;
}

/** Detect mobile landscape for touch-friendly sizing */
function isMobileLandscape(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  return hasTouch && vh <= 600 && vw > vh;
}

export class RadialMenu {
  private container: HTMLDivElement;
  private visible = false;
  private items: RadialMenuItem[] = [];
  onSelect: ((itemId: string) => void) | null = null;
  onClose: (() => void) | null = null;

  private readonly radius = 52;
  private readonly btnSize = 40;
  private showTime = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:20;pointer-events:none;';
    document.body.appendChild(this.container);
  }

  show(screenX: number, screenY: number, items: RadialMenuItem[]) {
    this.items = items;
    this.visible = true;
    this.showTime = Date.now();
    this.container.innerHTML = '';

    const mob = isMobileLandscape();
    const btnSize = mob ? 48 : this.btnSize;
    const radius = mob ? 62 : this.radius;
    const fontSize = mob ? 11 : 10;
    const ringSize = mob ? 64 : 56;

    // Clamp position so menu does not overflow viewport on mobile
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const margin = radius + btnSize / 2 + 4;
    const cx = Math.max(margin, Math.min(vw - margin, screenX));
    const cy = Math.max(margin, Math.min(vh - margin, screenY));

    // Backdrop (click/tap to close)
    const backdrop = document.createElement('div');
    const topBarH = getTopBarHeight();
    backdrop.style.cssText = `position:absolute;top:${topBarH}px;left:0;width:100%;height:calc(100% - ${topBarH}px);pointer-events:auto;`;
    backdrop.onclick = (e) => {
      e.stopPropagation();
      if (Date.now() - this.showTime < 250) return;
      this.hide();
      this.onClose?.();
    };
    this.container.appendChild(backdrop);

    // Center ring indicator
    const ring = document.createElement('div');
    const ringHalf = ringSize / 2;
    ring.style.cssText = `position:absolute;left:${cx - ringHalf}px;top:${cy - ringHalf}px;width:${ringSize}px;height:${ringSize}px;border:2px solid rgba(100,120,200,0.5);border-radius:50%;pointer-events:none;`;
    this.container.appendChild(ring);

    // Buttons arranged in circle
    const count = items.length;
    const startAngle = -Math.PI / 2; // top

    for (let i = 0; i < count; i++) {
      const item = items[i];
      const angle = startAngle + (2 * Math.PI * i) / count;
      const bx = cx + Math.cos(angle) * radius - btnSize / 2;
      const by = cy + Math.sin(angle) * radius - btnSize / 2;

      const btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = `
        position:absolute;
        left:${bx}px;top:${by}px;
        width:${btnSize}px;height:${btnSize}px;
        border-radius:50%;
        border:2px solid ${item.color};
        background:rgba(10,10,30,0.85);
        color:${item.disabled ? '#555' : '#ddf'};
        font-family:monospace;font-size:${fontSize}px;
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
    const dpr = engine.getHardwareScalingLevel();
    const rect = engine.getRenderingCanvas()!.getBoundingClientRect();
    return { x: projected.x * dpr + rect.left, y: projected.y * dpr + rect.top };
  }

  dispose() {
    this.container.remove();
  }
}
