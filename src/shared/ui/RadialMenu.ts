import { displayMode } from '@/shared/ui/DisplayMode';
import { getProfile } from '@/shared/ui/LayoutProfile';

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

    const p = getProfile(displayMode.mode);
    const btnSize = p.radialBtnSize;
    const radius = p.radialRadius;
    const fontSize = p.radialFontSize;
    const ringSize = p.radialRingSize;

    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    // 실제 버튼 배치 각도 기준 축별 필요 여백만큼만 클램프
    // (예: 버튼 2개는 상하로만 펼쳐지므로 가로는 링 폭만 확보하면 됨)
    const ringHalf = ringSize / 2;
    const count = items.length;
    const startAngle = -Math.PI / 2;
    let extLeft = ringHalf, extRight = ringHalf, extUp = ringHalf, extDown = ringHalf;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (2 * Math.PI * i) / count;
      const ox = Math.cos(angle) * radius;
      const oy = Math.sin(angle) * radius;
      extLeft = Math.max(extLeft, -ox + btnSize / 2);
      extRight = Math.max(extRight, ox + btnSize / 2);
      extUp = Math.max(extUp, -oy + btnSize / 2);
      extDown = Math.max(extDown, oy + btnSize / 2);
    }
    const cx = Math.max(extLeft + 4, Math.min(vw - extRight - 4, screenX));
    const cy = Math.max(extUp + 4, Math.min(vh - extDown - 4, screenY));

    const backdrop = document.createElement('div');
    const topBarH = p.topBarHeight;
    backdrop.style.cssText = `position:absolute;top:${topBarH}px;left:0;width:100%;height:calc(100% - ${topBarH}px);pointer-events:auto;`;
    backdrop.onclick = (e) => {
      e.stopPropagation();
      if (Date.now() - this.showTime < 250) return;
      this.hide();
      this.onClose?.();
    };
    this.container.appendChild(backdrop);

    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;left:${cx - ringHalf}px;top:${cy - ringHalf}px;width:${ringSize}px;height:${ringSize}px;border:2px solid rgba(100,120,200,0.5);border-radius:50%;pointer-events:none;`;
    this.container.appendChild(ring);

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

  dispose() {
    this.container.remove();
  }
}
