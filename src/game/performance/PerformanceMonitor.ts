export interface PerformanceSnapshot {
  fps: number;
  frameTime: number;
  p95FrameTime: number;
  p99FrameTime: number;
  framesOver16msPct: number;
  framesOver33msPct: number;
  simTime: number;
  targetingTime: number;
  renderTime: number;
  activeEnemies: number;
  activeTowers: number;
  activeProjectiles: number;
  activeParticles: number;
  heapUsedMb?: number;
}

export interface BenchmarkResult {
  presetName: string;
  seed: number;
  totalFrames: number;
  durationMs: number;
  avgFps: number;
  avgFrameTime: number;
  p95FrameTime: number;
  p99FrameTime: number;
  pctOver16ms: number;
  pctOver33ms: number;
  avgSimTime: number;
  avgTargetingTime: number;
  avgRenderTime: number;
  enemies: number;
  towers: number;
  projectiles: number;
  markdownSummary: string;
}

export class PerformanceMonitor {
  // Circular ring buffer for recent frames
  private readonly historyCapacity: number = 240;
  private frameTimes: Float32Array;
  private simTimes: Float32Array;
  private targetingTimes: Float32Array;
  private renderTimes: Float32Array;
  private historyIndex: number = 0;
  private historyCount: number = 0;

  // Running frame metrics
  private lastFrameTimestamp: number = 0;
  private frameStartTime: number = 0;

  // Measurement checkpoints
  private simStartTime: number = 0;
  private targetingStartTime: number = 0;
  private renderStartTime: number = 0;

  private currentSimDuration: number = 0;
  private currentTargetingDuration: number = 0;
  private currentRenderDuration: number = 0;

  // Formal benchmark state
  public isBenchmarking: boolean = false;
  private benchmarkTotalFrames: number = 600;
  private benchmarkCurrentFrames: number = 0;
  private benchFrameTimes: number[] = [];
  private benchSimTimes: number[] = [];
  private benchTargetingTimes: number[] = [];
  private benchRenderTimes: number[] = [];
  private benchmarkPresetName: string = 'CUSTOM';
  private benchmarkSeed: number = 74921;
  private benchmarkEnemies: number = 0;
  private benchmarkTowers: number = 0;
  private benchmarkProjectiles: number = 0;
  private benchmarkStartTime: number = 0;
  private onBenchmarkComplete?: (result: BenchmarkResult) => void;

  constructor() {
    this.frameTimes = new Float32Array(this.historyCapacity);
    this.simTimes = new Float32Array(this.historyCapacity);
    this.targetingTimes = new Float32Array(this.historyCapacity);
    this.renderTimes = new Float32Array(this.historyCapacity);
  }

  public beginFrame(): void {
    const now = performance.now();
    if (this.lastFrameTimestamp > 0) {
      const delta = now - this.lastFrameTimestamp;
      this.recordFrameDelta(delta);
    }
    this.lastFrameTimestamp = now;
    this.frameStartTime = now;
  }

  public beginSim(): void {
    this.simStartTime = performance.now();
  }

  public endSim(): void {
    this.currentSimDuration = performance.now() - this.simStartTime;
    this.simTimes[this.historyIndex] = this.currentSimDuration;
  }

  public beginTargeting(): void {
    this.targetingStartTime = performance.now();
  }

  public endTargeting(): void {
    this.currentTargetingDuration = performance.now() - this.targetingStartTime;
    this.targetingTimes[this.historyIndex] = this.currentTargetingDuration;
  }

  public beginRender(): void {
    this.renderStartTime = performance.now();
  }

  public endRender(): void {
    this.currentRenderDuration = performance.now() - this.renderStartTime;
    this.renderTimes[this.historyIndex] = this.currentRenderDuration;
  }

  public endFrame(enemies: number, towers: number, projectiles: number): void {
    if (this.isBenchmarking) {
      this.recordBenchmarkFrame(enemies, towers, projectiles);
    }
  }

  private recordFrameDelta(delta: number): void {
    this.historyIndex = (this.historyIndex + 1) % this.historyCapacity;
    this.frameTimes[this.historyIndex] = delta;
    if (this.historyCount < this.historyCapacity) {
      this.historyCount++;
    }
  }

  public getSnapshot(enemies: number, towers: number, projectiles: number, particles: number): PerformanceSnapshot {
    if (this.historyCount === 0) {
      return {
        fps: 60,
        frameTime: 16.6,
        p95FrameTime: 16.6,
        p99FrameTime: 16.6,
        framesOver16msPct: 0,
        framesOver33msPct: 0,
        simTime: 0,
        targetingTime: 0,
        renderTime: 0,
        activeEnemies: enemies,
        activeTowers: towers,
        activeProjectiles: projectiles,
        activeParticles: particles
      };
    }

    // Collect array of current frame times for percentile calculation
    const samples = new Float32Array(this.historyCount);
    let sum = 0;
    let over16 = 0;
    let over33 = 0;

    let simSum = 0;
    let targetSum = 0;
    let renderSum = 0;

    for (let i = 0; i < this.historyCount; i++) {
      const ft = this.frameTimes[i];
      samples[i] = ft;
      sum += ft;
      if (ft > 16.67) over16++;
      if (ft > 33.33) over33++;

      simSum += this.simTimes[i];
      targetSum += this.targetingTimes[i];
      renderSum += this.renderTimes[i];
    }

    samples.sort();

    const avgFrameTime = sum / this.historyCount;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 60;
    const p95Idx = Math.min(this.historyCount - 1, Math.floor(this.historyCount * 0.95));
    const p99Idx = Math.min(this.historyCount - 1, Math.floor(this.historyCount * 0.99));

    let heapMb: number | undefined = undefined;
    if ((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory) {
      heapMb = Math.round(
        (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / (1024 * 1024)
      );
    }

    return {
      fps: Math.round(fps * 10) / 10,
      frameTime: Math.round(avgFrameTime * 10) / 10,
      p95FrameTime: Math.round(samples[p95Idx] * 10) / 10,
      p99FrameTime: Math.round(samples[p99Idx] * 10) / 10,
      framesOver16msPct: Math.round((over16 / this.historyCount) * 1000) / 10,
      framesOver33msPct: Math.round((over33 / this.historyCount) * 1000) / 10,
      simTime: Math.round((simSum / this.historyCount) * 100) / 100,
      targetingTime: Math.round((targetSum / this.historyCount) * 100) / 100,
      renderTime: Math.round((renderSum / this.historyCount) * 100) / 100,
      activeEnemies: enemies,
      activeTowers: towers,
      activeProjectiles: projectiles,
      activeParticles: particles,
      heapUsedMb: heapMb
    };
  }

  // --- FORMAL BENCHMARK RUNNER ---

  public startBenchmark(
    presetName: string,
    seed: number,
    totalFrames: number = 600,
    onComplete?: (result: BenchmarkResult) => void
  ): void {
    this.isBenchmarking = true;
    this.benchmarkPresetName = presetName;
    this.benchmarkSeed = seed;
    this.benchmarkTotalFrames = totalFrames;
    this.benchmarkCurrentFrames = 0;
    this.benchFrameTimes = [];
    this.benchSimTimes = [];
    this.benchTargetingTimes = [];
    this.benchRenderTimes = [];
    this.benchmarkStartTime = performance.now();
    this.onBenchmarkComplete = onComplete;
  }

  private recordBenchmarkFrame(enemies: number, towers: number, projectiles: number): void {
    const curFt = this.frameTimes[this.historyIndex];
    this.benchFrameTimes.push(curFt);
    this.benchSimTimes.push(this.currentSimDuration);
    this.benchTargetingTimes.push(this.currentTargetingDuration);
    this.benchRenderTimes.push(this.currentRenderDuration);

    this.benchmarkEnemies = enemies;
    this.benchmarkTowers = towers;
    this.benchmarkProjectiles = projectiles;

    this.benchmarkCurrentFrames++;

    if (this.benchmarkCurrentFrames >= this.benchmarkTotalFrames) {
      this.finishBenchmark();
    }
  }

  private finishBenchmark(): void {
    this.isBenchmarking = false;
    const totalFrames = this.benchFrameTimes.length;
    const duration = performance.now() - this.benchmarkStartTime;

    const sortedFt = [...this.benchFrameTimes].sort((a, b) => a - b);
    let sumFt = 0;
    let over16 = 0;
    let over33 = 0;

    for (const ft of this.benchFrameTimes) {
      sumFt += ft;
      if (ft > 16.67) over16++;
      if (ft > 33.33) over33++;
    }

    const avgFrameTime = sumFt / totalFrames;
    const avgFps = 1000 / avgFrameTime;
    const p95 = sortedFt[Math.floor(totalFrames * 0.95)];
    const p99 = sortedFt[Math.floor(totalFrames * 0.99)];
    const pctOver16 = (over16 / totalFrames) * 100;
    const pctOver33 = (over33 / totalFrames) * 100;

    const avgSim = this.benchSimTimes.reduce((a, b) => a + b, 0) / totalFrames;
    const avgTarget = this.benchTargetingTimes.reduce((a, b) => a + b, 0) / totalFrames;
    const avgRender = this.benchRenderTimes.reduce((a, b) => a + b, 0) / totalFrames;

    const md = `| ${this.benchmarkPresetName} | Seed: ${this.benchmarkSeed} | ${this.benchmarkEnemies} | ${this.benchmarkTowers} | ${this.benchmarkProjectiles} | ${avgFps.toFixed(1)} | ${p95.toFixed(1)}ms | ${p99.toFixed(1)}ms | ${pctOver33.toFixed(1)}% | Sim: ${avgSim.toFixed(2)}ms | Render: ${avgRender.toFixed(2)}ms |`;

    const result: BenchmarkResult = {
      presetName: this.benchmarkPresetName,
      seed: this.benchmarkSeed,
      totalFrames,
      durationMs: duration,
      avgFps: Math.round(avgFps * 10) / 10,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      p95FrameTime: Math.round(p95 * 100) / 100,
      p99FrameTime: Math.round(p99 * 100) / 100,
      pctOver16ms: Math.round(pctOver16 * 10) / 10,
      pctOver33ms: Math.round(pctOver33 * 10) / 10,
      avgSimTime: Math.round(avgSim * 100) / 100,
      avgTargetingTime: Math.round(avgTarget * 100) / 100,
      avgRenderTime: Math.round(avgRender * 100) / 100,
      enemies: this.benchmarkEnemies,
      towers: this.benchmarkTowers,
      projectiles: this.benchmarkProjectiles,
      markdownSummary: md
    };

    if (this.onBenchmarkComplete) {
      this.onBenchmarkComplete(result);
    }
  }
}
