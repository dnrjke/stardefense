import type { DisplayModeType } from '@/shared/ui/DisplayMode';

export interface LayoutProfile {
  topBarHeight: number;
  bottomHudHeight: number;
  radialBtnSize: number;
  radialRadius: number;
  radialFontSize: number;
  radialRingSize: number;
  glowKernelSize: number;
  glowIntensity: number;
}

const PROFILES: Record<DisplayModeType, LayoutProfile> = {
  desktop: {
    topBarHeight: 40,
    bottomHudHeight: 72,
    radialBtnSize: 40,
    radialRadius: 52,
    radialFontSize: 10,
    radialRingSize: 56,
    glowKernelSize: 32,
    glowIntensity: 0.5,
  },
  mobileLandscape: {
    topBarHeight: 36,
    bottomHudHeight: 58,
    radialBtnSize: 48,
    radialRadius: 62,
    radialFontSize: 11,
    radialRingSize: 64,
    glowKernelSize: 16,
    glowIntensity: 0.35,
  },
  mobilePortrait: {
    topBarHeight: 36,
    bottomHudHeight: 58,
    radialBtnSize: 48,
    radialRadius: 62,
    radialFontSize: 11,
    radialRingSize: 64,
    glowKernelSize: 16,
    glowIntensity: 0.35,
  },
};

export function getProfile(mode: DisplayModeType): LayoutProfile {
  return PROFILES[mode];
}
