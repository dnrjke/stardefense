import type { CampaignStore, MapInfo } from '@/app/store/CampaignStore';

/** Detect mobile landscape for responsive layout */
function isMobileLandscape(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return hasTouch && window.innerHeight <= 500 && window.innerWidth > window.innerHeight;
}

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
  5: {
    title: '도전 — 열사의 장',
    subtitle: '무한히 강해지는 적을 최대한 오래 버텨라',
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
    const mob = isMobileLandscape();
    const content = document.createElement('div');
    content.style.cssText = `position:relative;z-index:1;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:${mob ? '16px 0' : '40px 0'};`;
    this.container.appendChild(content);

    // Render each act section
    for (const actNum of [1, 2, 3, 4, 5]) {
      const act = ACT_TITLES[actNum];
      if (!act) continue;
      const actMaps = state.getActMaps(actNum);
      if (actMaps.length === 0) continue;

      const actSection = document.createElement('div');
      actSection.style.cssText = `display:flex;flex-direction:column;align-items:center;margin-bottom:${mob ? 16 : 36}px;`;

      // Act title
      const titleBlock = document.createElement('div');
      titleBlock.style.cssText = `text-align:center;margin-bottom:${mob ? 12 : 28}px;`;

      const isChallenge = actNum === 5;
      const title = document.createElement('div');
      title.textContent = act.title;
      title.style.cssText = `font-size:${mob ? 16 : 24}px;font-weight:bold;letter-spacing:${mob ? 3 : 6}px;color:${isChallenge ? '#f8d' : '#c8d8ff'};text-shadow:0 0 20px ${isChallenge ? 'rgba(255,100,200,0.4)' : 'rgba(100,140,255,0.4)'};margin-bottom:${mob ? 4 : 8}px;`;
      titleBlock.appendChild(title);

      const subtitle = document.createElement('div');
      subtitle.textContent = `"${act.subtitle}"`;
      subtitle.style.cssText = `font-size:${mob ? 11 : 13}px;color:${isChallenge ? '#a678aa' : '#6678aa'};font-style:italic;letter-spacing:${mob ? 1 : 2}px;`;
      titleBlock.appendChild(subtitle);

      actSection.appendChild(titleBlock);

      // Map path container — horizontally scrollable on mobile
      const pathContainer = document.createElement('div');
      pathContainer.style.cssText = `display:flex;align-items:center;gap:0;position:relative;${mob ? 'overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:90vw;padding:4px 8px;' : ''}`;

      const connectorW = mob ? 30 : 60;
      for (let i = 0; i < actMaps.length; i++) {
        const map = actMaps[i];
        const node = this.createMapNode(map, selected === map.id, mob);
        pathContainer.appendChild(node);

        if (i < actMaps.length - 1) {
          const connector = document.createElement('div');
          const nextUnlocked = actMaps[i + 1].unlocked;
          connector.style.cssText = `width:${connectorW}px;height:2px;background:${nextUnlocked ? 'linear-gradient(to right, #4466aa, #4466aa)' : 'linear-gradient(to right, #223, #1a1a2a)'};margin:0 -1px;flex-shrink:0;position:relative;top:-14px;`;
          if (nextUnlocked) {
            connector.style.boxShadow = '0 0 8px rgba(68,102,170,0.4)';
          }
          pathContainer.appendChild(connector);
        }
      }

      actSection.appendChild(pathContainer);

      // Inline description + start button below the selected stage's act
      const selectedInAct = actMaps.find(m => m.id === selected);
      if (selectedInAct) {
        const inlinePanel = document.createElement('div');
        inlinePanel.style.cssText = `width:${mob ? '85vw' : '420px'};background:rgba(10,10,30,0.8);border:1px solid #334;border-radius:8px;padding:${mob ? '10px 14px' : '14px 20px'};text-align:center;margin-top:${mob ? 8 : 14}px;`;

        const descText = document.createElement('div');
        descText.textContent = selectedInAct.description;
        descText.style.cssText = `font-size:${mob ? 11 : 13}px;color:#8899bb;line-height:1.6;margin-bottom:${mob ? 8 : 12}px;`;
        inlinePanel.appendChild(descText);

        if (selectedInAct.unlocked) {
          const startBtn = document.createElement('button');
          startBtn.textContent = 'START';
          startBtn.style.cssText = `background:rgba(40,60,120,0.6);color:#aaccff;border:2px solid #4466aa;padding:${mob ? '10px 28px' : '12px 40px'};cursor:pointer;font-family:monospace;font-size:${mob ? 14 : 16}px;font-weight:bold;border-radius:6px;letter-spacing:${mob ? 2 : 4}px;transition:all 0.2s;min-height:${mob ? '44px' : 'auto'};`;
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
          startBtn.onclick = () => this.onMapStart?.(selectedInAct.id);
          inlinePanel.appendChild(startBtn);
        }

        actSection.appendChild(inlinePanel);
      }

      content.appendChild(actSection);
    }
  }

  private createMapNode(map: MapInfo, isSelected: boolean, mob = false): HTMLDivElement {
    const node = document.createElement('div');
    node.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative;flex-shrink:0;';

    // Map circle — smaller on mobile
    const circleSize = mob ? 52 : 72;
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

    circle.style.cssText = `width:${circleSize}px;height:${circleSize}px;border-radius:50%;border:2px solid ${borderColor};background:${bgColor};display:flex;align-items:center;justify-content:center;flex-direction:column;transition:all 0.2s;box-shadow:${glowShadow};margin-bottom:${mob ? 6 : 10}px;`;

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
      lock.style.cssText = `font-size:${mob ? 16 : 22}px;color:#334;`;
      lock.innerHTML = '&#x1F512;';
      circle.appendChild(lock);
    } else if (map.completed) {
      const check = document.createElement('div');
      check.style.cssText = `font-size:${mob ? 16 : 20}px;color:#44aa66;`;
      check.innerHTML = '&#x2713;';
      circle.appendChild(check);

      const mapLabel = document.createElement('div');
      mapLabel.textContent = map.id.replace(/^map_(\d+)_/, '$1-').toUpperCase();
      mapLabel.style.cssText = `font-size:${mob ? 8 : 10}px;color:#6a8;margin-top:2px;`;
      circle.appendChild(mapLabel);
    } else {
      const mapLabel = document.createElement('div');
      mapLabel.textContent = map.id.replace(/^map_(\d+)_/, '$1-').toUpperCase();
      mapLabel.style.cssText = `font-size:${mob ? 10 : 13}px;color:${map.isBoss ? '#cc7755' : '#8899bb'};font-weight:bold;`;
      circle.appendChild(mapLabel);
    }

    node.appendChild(circle);

    // Map name
    const name = document.createElement('div');
    name.textContent = map.nameKo;
    name.style.cssText = `font-size:${mob ? 10 : 12}px;color:${map.unlocked ? (map.isBoss ? '#cc8866' : '#8899bb') : '#334'};text-align:center;max-width:${mob ? 60 : 80}px;line-height:1.3;`;
    node.appendChild(name);

    // Click handler — toggle selection on re-click
    if (map.unlocked) {
      node.onclick = () => {
        const current = this.store.getState().currentMapId;
        this.store.getState().selectMap(current === map.id ? null : map.id);
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
