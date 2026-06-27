import type { MutationDef } from '@/shared/data/MutationData';

const CATEGORY_COLORS: Record<string, string> = {
  enemy_buff: '#f44',
  tower_nerf: '#f84',
  economy: '#ff4',
  nebula_nerf: '#fa4',
  reward: '#4f4',
  mixed: '#a4f',
};

function isMobileLandscape(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  return hasTouch && vh <= 600 && vw > vh;
}

export class MutationSelectUI {
  private container: HTMLDivElement;
  onSelect: ((mutationId: string) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(0,0,10,0.9);font-family:monospace;color:#fff;';
    document.body.appendChild(this.container);
  }

  show(mutations: MutationDef[]) {
    this.container.style.display = 'flex';
    this.container.innerHTML = '';
    const mob = isMobileLandscape();

    const panel = document.createElement('div');
    panel.style.cssText = 'text-align:center;';

    const title = document.createElement('div');
    title.textContent = '☆ 돌연변이 선택 ☆';
    title.style.cssText = `font-size:${mob ? 17 : 22}px;color:#f8d;margin-bottom:${mob ? 16 : 24}px;text-shadow:0 0 15px rgba(255,100,200,0.5);`;
    panel.appendChild(title);

    const row = document.createElement('div');
    row.style.cssText = `display:flex;gap:${mob ? 10 : 16}px;justify-content:center;flex-wrap:${mob ? 'wrap' : 'nowrap'};`;

    for (const mut of mutations) {
      const borderColor = CATEGORY_COLORS[mut.category] || '#88f';

      const card = document.createElement('div');
      card.style.cssText = `background:rgba(10,10,40,0.95);border:2px solid ${borderColor};border-radius:12px;padding:${mob ? '14px 12px' : '20px 16px'};width:${mob ? 150 : 180}px;display:flex;flex-direction:column;align-items:center;gap:8px;`;

      const name = document.createElement('div');
      name.textContent = mut.nameKo;
      name.style.cssText = `font-size:${mob ? 14 : 16}px;font-weight:bold;color:${borderColor};`;
      card.appendChild(name);

      const desc = document.createElement('div');
      desc.textContent = mut.description;
      desc.style.cssText = `font-size:${mob ? 11 : 12}px;color:#aab;line-height:1.4;min-height:40px;`;
      card.appendChild(desc);

      const btn = document.createElement('button');
      btn.textContent = '선택';
      btn.style.cssText = `background:${borderColor}33;color:${borderColor};border:1px solid ${borderColor};padding:${mob ? '10px 28px' : '8px 24px'};cursor:pointer;font-family:monospace;font-size:14px;border-radius:6px;margin-top:8px;min-height:${mob ? '44px' : 'auto'};`;
      btn.onmouseenter = () => { btn.style.background = `${borderColor}66`; };
      btn.onmouseleave = () => { btn.style.background = `${borderColor}33`; };
      btn.onclick = () => {
        this.hide();
        this.onSelect?.(mut.id);
      };
      card.appendChild(btn);

      row.appendChild(card);
    }
    panel.appendChild(row);
    this.container.appendChild(panel);
  }

  hide() {
    this.container.style.display = 'none';
  }

  dispose() {
    this.container.remove();
  }
}
