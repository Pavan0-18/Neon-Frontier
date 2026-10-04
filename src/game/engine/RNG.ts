/**
 * Seeded PRNG using Mulberry32 for deterministic gameplay and reproducible benchmarks.
 */
export class SeededRNG {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number = 74921) {
    this.initialSeed = seed >>> 0;
    this.state = this.initialSeed;
  }

  public getSeed(): number {
    return this.initialSeed;
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.state = seed >>> 0;
    } else {
      this.state = this.initialSeed;
    }
  }

  /**
   * Returns a pseudo-random float in [0, 1)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns random integer in [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns random float in [min, max)
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Choose random element from array
   */
  public choice<T>(array: T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }
}

export const GlobalRNG = new SeededRNG(74921);
