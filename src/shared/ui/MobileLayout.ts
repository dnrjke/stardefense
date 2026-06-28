/** Mobile landscape gameplay — touch, short viewport, wider than tall (matches HUD/RadialMenu) */
export function isMobileLandscapeGameplay(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  return hasTouch && vh <= 600 && vw > vh;
}

/** Top HUD height — keep in sync with HUD.ts / RadialMenu backdrop */
export function getTopBarHeight(): number {
  return isMobileLandscapeGameplay() ? 36 : 40;
}

/** Approximate bottom palette + safe-area footprint (CSS px) */
export function estimateBottomHudHeight(): number {
  return isMobileLandscapeGameplay() ? 58 : 72;
}

/**
 * Camera target Z offset for mobile landscape (world units).
 * Negative Z pans toward map bottom (-Z rows) so the lower edge clears the
 * bottom HUD. Returns 0 on desktop / portrait / tall viewports.
 */
export function computeMobileCameraTargetOffset(cameraDistance: number): number {
  if (!isMobileLandscapeGameplay()) return 0;

  const vh = window.visualViewport?.height ?? window.innerHeight;
  const bottomHud = estimateBottomHudHeight();
  const topHud = getTopBarHeight();

  const occlusion = (bottomHud * 1.6 + topHud * 0.4) / Math.max(vh, 1);
  let offset = cameraDistance * occlusion * 0.104;

  if (vh <= 340) offset += cameraDistance * 0.012;
  else if (vh <= 375) offset += cameraDistance * 0.009;
  else if (vh <= 414) offset += cameraDistance * 0.005;

  return -Math.min(offset, cameraDistance * 0.048);
}
