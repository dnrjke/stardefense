const TICK_RATE = 60;
const TICK_S = 1 / TICK_RATE;
const TICK_MS = TICK_S * 1000;
// 배속 상한 x4 기준: 60fps에서 4틱/프레임, 저사양 24fps에서도 ~10틱이면 충분
// (초과분은 잘라내어 프레임 드랍 시 스파이럴 방지)
const MAX_CATCHUP = 12;

export class FixedTimestep {
  private accumulator = 0;
  private tickCount = 0;

  advance(deltaMs: number, onTick: () => void): number {
    this.accumulator += deltaMs;

    let steps = 0;
    while (this.accumulator >= TICK_MS && steps < MAX_CATCHUP) {
      onTick();
      this.accumulator -= TICK_MS;
      this.tickCount++;
      steps++;
    }

    if (this.accumulator > TICK_MS * MAX_CATCHUP) {
      this.accumulator = 0;
    }

    return this.accumulator / TICK_MS;
  }

  resetAccumulator() {
    this.accumulator = 0;
  }

  get tick() { return this.tickCount; }
  get fixedDt() { return TICK_S; }
}
