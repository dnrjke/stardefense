import type { CampaignStore, MapInfo } from '@/app/store/CampaignStore';

const ACT_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'ACT 1 — 태양 근방',
    subtitle: '가장 가까운 별들이 꺼지기 시작한다',
  },
  2: {
    title: 'ACT 2 — 겨울 대삼각',
    subtitle: '오리온 팔의 밝은 별들이 차례로 위협받는다',
  },
  3: {
    title: 'ACT 3 — 심연의 경계',
    subtitle: '은하 중심부로 다가갈수록 어둠은 깊어진다',
  },
  4: {
    title: 'ACT 4 — 열적 죽음 (Heat Death)',
    subtitle: '엔트로피가 우주의 종말을 선언한다',
  },
};

export class MapSelectScreen {
  private container: HTMLDivElement;
  private store: CampaignStore;
  private unsubscribe: (() => void) | null = null;

  onMapStart: ((mapId: string) => void) | null = null;

  constructor(campaignStore: CampaignStore) {
    this.store = campaignStore;

    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:50;font-family:monospace;color:#fff;display:none;';
    document.body.appendChild(this.container);
  }

  show() {
    this.container.style.display = 'block';
    this.render();
    this.unsubscribe = this.store.subscribe(() => this.render());
  }

  hide() {
    this.container.style.display = 'none';
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  dispose() {
    this.hide();
    this.container.remove();
  }

  private render() {
    const state = this.store.getState();
    const selected = state.currentMapId;

    this.container.innerHTML = '';

    // Background overlay with animated stars
    const bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center, #0a0a1a 0%, #020208 70%, #000 100%);overflow:hidden;';
    this.container.appendChild(bg);

    // CSS star particles
    this.addStarParticles(bg);

    // Main content wrapper
    const content = document.createElement('div');
    content.style.cssText = 'position:relative;z-index:1;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:40px 0;';
    this.container.appendChild(content);

    // Render each act section
    for (const actNum of [1, 2, 3, 4]) {
      const act = ACT_TITLES[actNum];
      if (!act) continue;
      const actMaps = state.getActMaps(actNum);
      if (actMaps.length === 0) continue;

      const actSection = document.createElement('div');
      actSection.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin-bottom:36px;';

      // Act title
      const titleBlock = document.createElement('div');
      titleBlock.style.cssText = 'text-align:center;margin-bottom:28px;';

      const title = document.createElement('div');
      title.textContent = act.title;
      title.style.cssText = 'font-size:24px;font-weight:bold;letter-spacing:6px;color:#c8d8ff;text-shadow:0 0 20px rgba(100,140,255,0.4);margin-bottom:8px;';
      titleBlock.appendChild(title);

      const subtitle = document.createElement('div');
      subtitle.textContent = `"${act.subtitle}"`;
      subtitle.style.cssText = 'font-size:13px;color:#6678aa;font-style:italic;letter-spacing:2px;';
      titleBlock.appendChild(subtitle);

      actSection.appendChild(titleBlock);

      // Map path container
      const pathContainer = document.createElement('div');
      pathContainer.style.cssText = 'display:flex;align-items:center;gap:0;position:relative;';

      for (let i = 0; i < actMaps.length; i++) {
        const map = actMaps[i];
        const node = this.createMapNode(map, selected === map.id);
        pathContainer.appendChild(node);

        if (i < actMaps.length - 1) {
          const connector = document.createElement('div');
          const nextUnlocked = actMaps[i + 1].unlocked;
          connector.style.cssText = `width:60px;height:2px;background:${nextUnlocked ? 'linear-gradient(to right, #4466aa, #4466aa)' : 'linear-gradient(to right, #223, #1a1a2a)'};margin:0 -1px;flex-shrink:0;position:relative;top:-14px;`;
          if (nextUnlocked) {
            connector.style.boxShadow = '0 0 8px rgba(68,102,170,0.4)';
          }
          pathContainer.appendChild(connector);
        }
      }

      actSection.appendChild(pathContainer);
      content.appendChild(actSection);
    }

    // Description panel
    const descPanel = document.createElement('div');
    descPanel.style.cssText = 'width:420px;min-height:60px;background:rgba(10,10,30,0.8);border:1px solid #334;border-radius:8px;padding:16px 24px;text-align:center;margin-bottom:32px;';

    if (selected && state.maps[selected]) {
      const m = state.maps[selected];
      const descText = document.createElement('div');
      descText.textContent = m.description;
      descText.style.cssText = 'font-size:13px;color:#8899bb;line-height:1.6;';
      descPanel.appendChild(descText);
    } else {
      const hint = document.createElement('div');
      hint.textContent = '맵을 선택하세요';
      hint.style.cssText = 'font-size:13px;color:#445;';
      descPanel.appendChild(hint);
    }

    content.appendChild(descPanel);

    // Start button
    if (selected && state.maps[selected]?.unlocked) {
      const startBtn = document.createElement('button');
      startBtn.textContent = 'START';
      startBtn.style.cssText = 'background:rgba(40,60,120,0.6);color:#aaccff;border:2px solid #4466aa;padding:14px 48px;cursor:pointer;font-family:monospace;font-size:18px;font-weight:bold;border-radius:6px;letter-spacing:4px;transition:all 0.2s;';
      startBtn.onmouseenter = () => {
        startBtn.style.background = 'rgba(60,90,180,0.7)';
        startBtn.style.boxShadow = '0 0 24px rgba(68,102,170,0.5)';
        startBtn.style.color = '#ddeeff';
      };
      startBtn.onmouseleave = () => {
        startBtn.style.background = 'rgba(40,60,120,0.6)';
        startBtn.style.boxShadow = 'none';
        startBtn.style.color = '#aaccff';
      };
      startBtn.onclick = () => {
        if (selected) this.onMapStart?.(selected);
      };
      content.appendChild(startBtn);
    }
  }

  private createMapNode(map: MapInfo, isSelected: boolean): HTMLDivElement {
    const node = document.createElement('div');
    node.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative;';

    // Map circle
    const circle = document.createElement('div');
    let borderColor = '#334';
    let bgColor = 'rgba(10,10,30,0.8)';
    let glowShadow = 'none';

    if (map.isBoss && map.unlocked) {
      borderColor = '#cc5533';
      glowShadow = '0 0 16px rgba(204,85,51,0.4)';
    } else if (map.isBoss && !map.unlocked) {
      borderColor = '#553322';
    }

    if (isSelected && map.unlocked) {
      borderColor = map.isBoss ? '#ff7744' : '#6688cc';
      bgColor = map.isBoss ? 'rgba(60,20,10,0.8)' : 'rgba(20,30,60,0.8)';
      glowShadow = map.isBoss ? '0 0 20px rgba(255,119,68,0.5)' : '0 0 20px rgba(102,136,204,0.5)';
    }

    if (map.completed) {
      borderColor = '#44aa66';
      glowShadow = '0 0 12px rgba(68,170,102,0.3)';
    }

    if (!map.unlocked) {
      bgColor = 'rgba(8,8,16,0.9)';
    }

    circle.style.cssText = `width:72px;height:72px;border-radius:50%;border:2px solid ${borderColor};background:${bgColor};display:flex;align-items:center;justify-content:center;flex-direction:column;transition:all 0.2s;box-shadow:${glowShadow};margin-bottom:10px;`;

    if (map.unlocked) {
      circle.onmouseenter = () => {
        if (!isSelected) {
          circle.style.borderColor = map.isBoss ? '#cc6644' : '#5577bb';
          circle.style.boxShadow = map.isBoss ? '0 0 16px rgba(204,102,68,0.3)' : '0 0 16px rgba(85,119,187,0.3)';
        }
      };
      circle.onmouseleave = () => {
        if (!isSelected) {
          circle.style.borderColor = map.completed ? '#44aa66' : (map.isBoss ? '#cc5533' : '#334');
          circle.style.boxShadow = map.completed ? '0 0 12px rgba(68,170,102,0.3)' : 'none';
        }
      };
    }

    // Icon content inside circle
    if (!map.unlocked) {
      const lock = document.createElement('div');
      lock.style.cssText = 'font-size:22px;color:#334;';
      lock.innerHTML = '&#x1F512;';
      circle.appendChild(lock);
    } else if (map.completed) {
      const check = document.createElement('div');
      check.style.cssText = 'font-size:20px;color:#44aa66;';
      check.innerHTML = '&#x2713;';
      circle.appendChild(check);

      const mapLabel = document.createElement('div');
      mapLabel.textContent = map.id.replace(/^map_(\d+)_/, '$1-').toUpperCase();
      mapLabel.style.cssText = 'font-size:10px;color:#6a8;margin-top:2px;';
      circle.appendChild(mapLabel);
    } else {
      const mapLabel = document.createElement('div');
      mapLabel.textContent = map.id.replace(/^map_(\d+)_/, '$1-').toUpperCase();
      mapLabel.style.cssText = `font-size:13px;color:${map.isBoss ? '#cc7755' : '#8899bb'};font-weight:bold;`;
      circle.appendChild(mapLabel);
    }

    node.appendChild(circle);

    // Map name
    const name = document.createElement('div');
    name.textContent = map.nameKo;
    name.style.cssText = `font-size:12px;color:${map.unlocked ? (map.isBoss ? '#cc8866' : '#8899bb') : '#334'};text-align:center;max-width:80px;line-height:1.3;`;
    node.appendChild(name);

    // Click handler
    if (map.unlocked) {
      node.onclick = () => {
        this.store.getState().selectMap(map.id);
      };
    }

    return node;
  }

  private addStarParticles(container: HTMLDivElement) {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes mssTwinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `;
    container.appendChild(style);

    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div');
      const size = 1 + Math.random() * 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 4;
      const duration = 2 + Math.random() * 3;
      const opacity = 0.3 + Math.random() * 0.7;

      star.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:#fff;border-radius:50%;opacity:${opacity};animation:mssTwinkle ${duration}s ${delay}s infinite ease-in-out;`;
      container.appendChild(star);
    }
  }
}
