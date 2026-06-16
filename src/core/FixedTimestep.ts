const TICK_RATE = 60;
const TICK_S = 1 / TICK_RATE;
const TICK_MS = TICK_S * 1000;
const MAX_CATCHUP = 5;

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

  get tick() { return this.tickCount; }
  get fixedDt() { return TICK_S; }
}
