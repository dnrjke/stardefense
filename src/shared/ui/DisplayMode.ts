export type DisplayModeType = 'desktop' | 'mobileLandscape' | 'mobilePortrait';

interface DisplayState {
  mode: DisplayModeType;
  canvasRotation: 0 | 90;
  vw: number;
  vh: number;
  /** 터치 입력 기기 여부. 태블릿은 mode='desktop'이지만 isTouch=true로 구분됨 */
  isTouch: boolean;
}

type Listener = (state: DisplayState) => void;

class DisplayModeImpl {
  private state: DisplayState;
  private listeners = new Set<Listener>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.state = this.detect();
    const debouncedUpdate = () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.update(), 150);
    };
    window.addEventListener('resize', debouncedUpdate);
    window.visualViewport?.addEventListener('resize', debouncedUpdate);
  }

  private detect(): DisplayState {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const short = Math.min(vw, vh);

    let mode: DisplayModeType;
    if (!hasTouch || short > 600) {
      mode = 'desktop';
    } else if (vw > vh) {
      mode = 'mobileLandscape';
    } else {
      mode = 'mobilePortrait';
    }

    return {
      mode,
      canvasRotation: mode === 'mobilePortrait' ? 90 : 0,
      vw,
      vh,
      isTouch: hasTouch,
    };
  }

  private update() {
    const next = this.detect();
    if (next.mode !== this.state.mode || next.vw !== this.state.vw || next.vh !== this.state.vh) {
      this.state = next;
      applyLayoutVars(next.mode);
      for (const fn of this.listeners) fn(this.state);
    }
  }

  init() { applyLayoutVars(this.state.mode); }

  get(): DisplayState { return this.state; }

  get mode(): DisplayModeType { return this.state.mode; }
  get isMobile(): boolean { return this.state.mode !== 'desktop'; }
  get isPortrait(): boolean { return this.state.mode === 'mobilePortrait'; }
  get rotation(): 0 | 90 { return this.state.canvasRotation; }
  /** 터치 입력 기기 (모바일 + 태블릿). 터치 UX 분기(홀드 열람 등)에 사용 */
  get isTouch(): boolean { return this.state.isTouch; }
  /** 태블릿 = 데스크톱 레이아웃 + 터치 입력 */
  get isTablet(): boolean { return this.state.isTouch && this.state.mode === 'desktop'; }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const displayMode = new DisplayModeImpl();

if (import.meta.env.DEV) {
  (window as any).__displayMode = displayMode;
}

// ── CSS Custom Properties ──

function si(side: string, fb = '0px'): string {
  return `env(safe-area-inset-${side}, ${fb})`;
}

const CSS_VARS: Record<DisplayModeType, Record<string, string>> = {
  desktop: {
    '--sd-top-h':           '40px',
    '--sd-top-fs':          '14px',
    '--sd-top-gap':         '8px',
    '--sd-top-pad':         '0 16px',
    '--sd-top-pad-l':       `calc(16px + ${si('left')})`,
    '--sd-top-pad-r':       `calc(16px + ${si('right')})`,
    '--sd-back-pad':        '4px 10px',
    '--sd-back-fs':         '12px',
    '--sd-back-minh':       'auto',
    '--sd-bot-gap':         '8px',
    '--sd-bot-pad':         '8px 16px',
    '--sd-bot-pad-l':       `calc(16px + ${si('left')})`,
    '--sd-bot-pad-r':       `calc(16px + ${si('right')})`,
    '--sd-bot-pad-b':       `calc(8px + ${si('bottom')})`,
    '--sd-bot-btn-pad':     '6px 12px',
    '--sd-bot-btn-fs':      '12px',
    '--sd-start-r':         `calc(16px + ${si('right')})`,
    '--sd-start-b':         `calc(76px + ${si('bottom')})`,
    '--sd-start-pad':       '10px 20px',
    '--sd-start-fs':        '14px',
    '--sd-spell-w':         '120px',
    '--sd-spell-fs':        '11px',
    '--sd-spell-desc-fs':   '9px',
    '--sd-spell-gauge-w':   '100px',
    '--sd-spell-gauge-h':   '10px',
    '--sd-spell-gauge-mb':  '4px',
    '--sd-spell-gap':       '6px',
    '--sd-spell-r':         '12px',
    '--sd-spell-btn-pad':   '6px 8px',
    '--sd-spell-btn-minh':  'auto',
    '--sd-spell-name-mob':  '0',   // 0 = show full name+cost
    '--sd-info-w':          '196px',
    '--sd-info-fs':         '11px',
    '--sd-info-maxh':       'calc(100dvh - 50px - 72px - 16px)',
    '--sd-tut-top':         '50px',
    '--sd-tut-pad':         '12px 24px',
    '--sd-tut-fs':          '14px',
    '--sd-tut-maxw':        '400px',
    '--sd-wave-fs':         '24px',
    '--sd-syn-top':         '44px',
    '--sd-syn-pad':         '8px 14px',
    '--sd-syn-fs':          '11px',
    '--sd-syn-maxw':        '320px',
    '--sd-mut-top':         '200px',
    '--sd-mut-maxw':        '120px',
    '--sd-mut-r':           '12px',
    '--sd-crisis-top':      '40px',
    '--sd-crisis-pad':      '6px 16px',
    '--sd-crisis-fs':       '13px',
    '--sd-speed-pad':       '4px 12px',
    '--sd-speed-fs':        '13px',
    '--sd-speed-minh':      'auto',
    '--sd-wavepreview-fs':  '11px',
    '--sd-wavepreview-maxw':'300px',
    '--sd-topbar-center-ml':'8px',
  },
  mobileLandscape: {
    '--sd-top-h':           '36px',
    '--sd-top-fs':          '12px',
    '--sd-top-gap':         '4px',
    '--sd-top-pad':         '0 8px',
    '--sd-top-pad-l':       `calc(8px + ${si('left')})`,
    '--sd-top-pad-r':       `calc(8px + ${si('right')})`,
    '--sd-back-pad':        '6px 12px',
    '--sd-back-fs':         '11px',
    '--sd-back-minh':       '32px',
    '--sd-bot-gap':         '4px',
    '--sd-bot-pad':         '6px 6px',
    '--sd-bot-pad-l':       `calc(6px + ${si('left')})`,
    '--sd-bot-pad-r':       `calc(6px + ${si('right')})`,
    '--sd-bot-pad-b':       `calc(6px + ${si('bottom')})`,
    '--sd-bot-btn-pad':     '8px 8px',
    '--sd-bot-btn-fs':      '11px',
    '--sd-start-r':         `calc(8px + ${si('right')})`,
    '--sd-start-b':         `calc(64px + ${si('bottom')})`,
    '--sd-start-pad':       '10px 16px',
    '--sd-start-fs':        '13px',
    '--sd-spell-w':         '90px',
    '--sd-spell-fs':        '9px',
    '--sd-spell-desc-fs':   '7px',
    '--sd-spell-gauge-w':   '72px',
    '--sd-spell-gauge-h':   '8px',
    '--sd-spell-gauge-mb':  '2px',
    '--sd-spell-gap':       '4px',
    '--sd-spell-r':         `calc(8px + ${si('right')})`,
    '--sd-spell-btn-pad':   '6px 4px',
    '--sd-spell-btn-minh':  '36px',
    '--sd-spell-name-mob':  '1',   // 1 = show short name only
    '--sd-info-w':          '148px',
    '--sd-info-fs':         '10px',
    '--sd-info-maxh':       'calc(100dvh - 50px - 58px - 16px)',
    '--sd-tut-top':         '40px',
    '--sd-tut-pad':         '8px 16px',
    '--sd-tut-fs':          '12px',
    '--sd-tut-maxw':        '90vw',
    '--sd-wave-fs':         '18px',
    '--sd-syn-top':         '38px',
    '--sd-syn-pad':         '6px 10px',
    '--sd-syn-fs':          '10px',
    '--sd-syn-maxw':        '80vw',
    '--sd-mut-top':         '140px',
    '--sd-mut-maxw':        '80px',
    '--sd-mut-r':           `calc(8px + ${si('right')})`,
    '--sd-crisis-top':      '36px',
    '--sd-crisis-pad':      '4px 12px',
    '--sd-crisis-fs':       '11px',
    '--sd-speed-pad':       '6px 14px',
    '--sd-speed-fs':        '12px',
    '--sd-speed-minh':      '32px',
    '--sd-wavepreview-fs':  '10px',
    '--sd-wavepreview-maxw':'30vw',
    '--sd-topbar-center-ml':'4px',
  },
  mobilePortrait: {
    '--sd-top-h':           '36px',
    '--sd-top-fs':          '12px',
    '--sd-top-gap':         '4px',
    '--sd-top-pad':         '0 8px',
    '--sd-top-pad-l':       `calc(8px + ${si('left')})`,
    '--sd-top-pad-r':       `calc(8px + ${si('right')})`,
    '--sd-back-pad':        '6px 12px',
    '--sd-back-fs':         '11px',
    '--sd-back-minh':       '32px',
    '--sd-bot-gap':         '4px',
    '--sd-bot-pad':         '6px 6px',
    '--sd-bot-pad-l':       `calc(6px + ${si('left')})`,
    '--sd-bot-pad-r':       `calc(6px + ${si('right')})`,
    '--sd-bot-pad-b':       `calc(6px + ${si('bottom')})`,
    '--sd-bot-btn-pad':     '6px 6px',
    '--sd-bot-btn-fs':      '10px',
    '--sd-start-r':         `calc(8px + ${si('right')})`,
    '--sd-start-b':         `calc(64px + ${si('bottom')})`,
    '--sd-start-pad':       '10px 16px',
    '--sd-start-fs':        '13px',
    '--sd-spell-w':         '80px',
    '--sd-spell-fs':        '9px',
    '--sd-spell-desc-fs':   '7px',
    '--sd-spell-gauge-w':   '72px',
    '--sd-spell-gauge-h':   '8px',
    '--sd-spell-gauge-mb':  '2px',
    '--sd-spell-gap':       '4px',
    '--sd-spell-r':         `calc(8px + ${si('right')})`,
    '--sd-spell-btn-pad':   '6px 4px',
    '--sd-spell-btn-minh':  '36px',
    '--sd-spell-name-mob':  '1',
    '--sd-info-w':          '130px',
    '--sd-info-fs':         '10px',
    '--sd-info-maxh':       'calc(100dvh - 50px - 58px - 16px)',
    '--sd-tut-top':         '40px',
    '--sd-tut-pad':         '8px 16px',
    '--sd-tut-fs':          '12px',
    '--sd-tut-maxw':        '90vw',
    '--sd-wave-fs':         '18px',
    '--sd-syn-top':         '38px',
    '--sd-syn-pad':         '6px 10px',
    '--sd-syn-fs':          '10px',
    '--sd-syn-maxw':        '80vw',
    '--sd-mut-top':         '140px',
    '--sd-mut-maxw':        '80px',
    '--sd-mut-r':           `calc(8px + ${si('right')})`,
    '--sd-crisis-top':      '36px',
    '--sd-crisis-pad':      '4px 12px',
    '--sd-crisis-fs':       '11px',
    '--sd-speed-pad':       '6px 14px',
    '--sd-speed-fs':        '12px',
    '--sd-speed-minh':      '32px',
    '--sd-wavepreview-fs':  '10px',
    '--sd-wavepreview-maxw':'30vw',
    '--sd-topbar-center-ml':'4px',
  },
};

function applyLayoutVars(mode: DisplayModeType) {
  const root = document.documentElement.style;
  const vars = CSS_VARS[mode];
  for (const [key, val] of Object.entries(vars)) {
    root.setProperty(key, val);
  }
}
