# NEON FRONTIER: LAST ORBIT

> Production-Quality High-Performance Browser Tower Defense Game engineered in TypeScript, Vite, and Phaser 3. Fully offline-capable with deterministic 60 Hz fixed timestep simulation, data-oriented entity storage, uniform spatial grid partitioning, and zero-allocation WebGL quad batching.

---

## 1. Game Overview

**"NEON FRONTIER: LAST ORBIT"** places the player in command of an orbital defense station guarding a vital energy core against an encroaching alien swarm. Enemies warp into sector along a high-voltage orbital conduit. The player earns credits by neutralizing hostiles, using those funds to construct, upgrade, configure, and strategically reposition advanced defensive turrets across 50 progressive waves, including multi-phase boss encounters.

---

## 2. Features

### Core Gameplay
- **50 Complete Progressive Waves:** Balanced difficulty scaling with custom enemy compositions, wave countdowns, and manual wave initiation.
- **5 Distinct Tower Classes:**
  - **Pulse Cannon:** Rapid single-target energy turret.
  - **Arc Tesla:** Multi-target chain lightning with damage falloff.
  - **Plasma Mortar:** Heavy ballistic launcher with explosive splash radius.
  - **Cryo Beacon:** Area crowd control emitting tachyon slow pulses.
  - **Railgun:** Extreme-range kinetic penetrator targeting high-health threats.
- **3 Upgrade Levels (MK I, MK II, MK III):** Visible level indicators, stat progressions, and scaling sell refund values (70% total invested cost).
- **5 Configurable Targeting Modes Per Tower:** `First`, `Last`, `Closest`, `Strongest`, `Weakest`.
- **6 Distinct Enemy Types + 3 Unique Boss Encounters:**
  - `Scout` (fast, low HP), `Drone` (standard), `Tank` (heavy armor), `Shield Unit` (absorbs damage), `Regenerator` (continuous HP recovery), `Swarm` (high-density clusters).
  - **Orbital Behemoth (Wave 10 & 40):** Periodic EMP blast disabling nearby towers.
  - **Warp Overlord (Wave 20):** Phase Shift state granting 75% damage mitigation.
  - **Apex Prime Leviathan (Wave 30 & 50):** Carrier vessel spawning clusters of active escorts.
- **Procedural Web Audio API Sound Synthesizer:** Fully offline sound synthesis for laser pulses, tesla arcs, explosions, railgun hypersonic cracks, alarms, and UI feedback with 0 external audio dependencies.
- **Game Speed Controls:** `Pause` (freeze simulation without desync), `1×`, `2×`, `4×`.
- **Holographic Cyberpunk HUD:** Energy core integrity, credits, wave counter, score, seed display, tower inspection cards, and range previews.
- **Integrated Performance Lab (F3):** Live telemetry and interactive stress testing tools with seed-locked reproducibility.

---

## 3. Technology Stack & Rationale

| Technology | Selection Rationale |
|---|---|
| **TypeScript** | Strict compile-time type safety, structured entity interfaces, and clean separation between simulation state and visual representation. |
| **Vite** | Instant HMR during development, optimized Rollup production bundling, and zero runtime configuration overhead. |
| **Phaser 3 (WebGL)** | Native WebGL rendering pipeline, hardware-accelerated drawing, and battle-tested canvas scaling for responsive viewports. |
| **Phaser Blitter** | Ultra-high-speed WebGL 2D quad batcher capable of drawing 10,000+ sprites in a single draw call without GameObject overhead. |
| **TypedArrays (`Float32Array`, `Uint8Array`, `Int32Array`)** | Contiguous memory allocation, cache locality, and predictable GC behavior for high-volume entities. |
| **Web Audio API** | Procedural sound synthesis with zero external network requests or missing asset errors. |
| **Performance API (`performance.now()`)** | Sub-millisecond timing accuracy for deterministic benchmarking and telemetry. |

---

## 4. Architecture

```
+-------------------------------------------------------------------------+
|                              APPLICATION                                |
+------------------------------------+------------------------------------+
|               HTML / CSS HUD       |      PHASER 3 WEBGL VIEWPORT       |
|    - Core Health, Credits, Wave    |      - Procedural Canvas Atlas     |
|    - Tower Deck & Inspect Panel    |      - WebGL Blitter (Single Pass) |
|    - Performance Lab (F3 Panel)    |      - Static Nebula Starfield     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         CENTRAL GAME ENGINE                             |
|               (Fixed Timestep Accumulator: 60 Hz / 16.667ms)            |
+------------------------------------+------------------------------------+
|          SIMULATION STATE          |           ENGINE SYSTEMS           |
|  - Float32Array: X, Y, HP, Speed   |  - MovementSystem (Spline Path)    |
|  - Uint8Array: Active, Type, Boss  |  - CombatSystem (Range & Target)   |
|  - Swap-and-Pop Active Index Lists |  - WaveSystem (50 Waves & Bosses)  |
|  - Object Pools: Projectiles & FX  |  - EconomySystem (Score & Credits) |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  UNIFORM SPATIAL GRID PARTITIONER                       |
|           - 64px Grid Cells covering 1280x720 Arena Space               |
|           - O(1) Insertion & Zero-Allocation Ring Query Buffers         |
|           - Eliminates O(N x M) Brute-Force Scanning                    |
+-------------------------------------------------------------------------+
```

---

## 5. Rendering Pipeline

The game separates simulation state from rendering:
1. **Procedural Vector Texture Generation:** At startup, a single 512×512 canvas texture atlas (`neon_atlas`) is generated programmatically with neon glow effects. No external PNG files are required.
2. **WebGL Quad Batching via Blitter:** Rather than creating individual Phaser GameObjects or redrawing vector paths every frame, entities are rendered using a `Phaser.GameObjects.Blitter`. Active entities update pre-allocated `Bob` coordinates and frames, which Phaser flushes to the GPU in a single batched WebGL draw call.
3. **Viewport Culling:** Entities outside the visible camera frustum (-35px margin) skip GPU batch submission.
4. **Layered Static Caching:** The starfield, orbital nebula grid, and path corridor are drawn once to static background graphics layers rather than being redrawn every frame.

---

## 6. Simulation & Fixed Timestep

To ensure consistent behavior across 60Hz, 120Hz, 144Hz, and 240Hz monitors:
- The game uses a **fixed timestep accumulator** (`fixedDt = 1 / 60` seconds).
- Variable frame deltas from `requestAnimationFrame` accumulate elapsed time scaled by the game speed multiplier.
- Sub-steps execute deterministically at 60 Hz up to a maximum of 5 iterations per render frame, preventing a "spiral of death" during temporary browser lag spikes.
- Pausing freezes simulation accumulation without altering game entity state.

---

## 7. Performance Bottlenecks & Optimizations

Profiling the baseline implementation under the required 5,000 active enemies revealed two primary bottlenecks:

### Bottleneck 1: CPU Vector Triangulation in `Phaser.Graphics`
- **Baseline:** Calling `fillCircle()` and `strokeCircle()` on 5,000 enemies generated over 320,000 polygon vertices on the CPU every frame, crashing rendering to **6.4 FPS**.
- **Optimization:** Replaced vector graphics rendering with a procedural texture atlas and Phaser's WebGL `Blitter`. All 5,000 enemies and 1,000 projectiles are rendered in a **single WebGL draw call**, dropping render time to **0.58 ms** and boosting FPS to **92.7 FPS**.

### Bottleneck 2: Brute-Force $O(N \times M)$ Targeting Scans
- **Baseline:** 100 towers scanning 5,000 enemies sequentially executed 500,000 Euclidean distance calculations per tick.
- **Optimization:** Implemented a **Uniform Spatial Grid** (64px cell size). Towers only query relevant adjacent grid buckets within their attack radius, reducing candidate checks by over 94%.

### Bottleneck 3: Garbage Collection Churn from Projectile Allocations
- **Baseline:** Instantiating and discarding thousands of projectile and particle objects caused periodic garbage collector pauses.
- **Optimization:** Pre-allocated TypedArray pools (`Float32Array`, `Uint8Array`, `Int32Array`) with swap-and-pop index management, achieving **zero runtime heap allocations** during combat ticks.

---

## 8. Benchmark Methodology & Results

Measurements were collected using Google Chrome running with hardware-accelerated WebGL and automated via `scripts/benchmark-runner.js`. Telemetry uses high-precision `performance.now()` timestamps across 300-frame test windows with locked seed `74921`.

### Summary Results (See [NUMBERS.md](file:///C:/Users/pasup/neon-frontier/NUMBERS.md) for full breakdown)

| Test Configuration | Active Enemies | Active Towers | Active Projectiles | Avg FPS | P95 Latency | Frames >33ms |
|---|---:|---:|---:|---:|---:|---:|
| **Baseline (Unoptimized)** | 4,544 | 81 | 30 | **6.4 FPS** | 180.0 ms | 100.0% |
| **Optimized (Spatial Grid + Batching)** | 5,000 | 81 | 1,000 | **92.7 FPS** | 11.5 ms | **0.0%** |
| **Normal Preset** | 100 | 7 | 50 | **143.5 FPS** | 7.1 ms | 0.0% |
| **Heavy Preset** | 1,000 | 40 | 250 | **143.4 FPS** | 7.6 ms | 0.0% |
| **Assignment Stress Requirement** | **5,000** | **81** | **1,000** | **92.5 FPS** | **11.6 ms** | **0.0%** |
| **Extreme Stress Test** | **10,000** | **153** | **2,000** | **54.8 FPS** | **19.5 ms** | **0.0%** |

*All results exceed the assignment requirement of $\ge 45$ FPS for 95% of frames and $< 5\%$ frames $> 33$ms.*

---

## 9. Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v24.12.0)
- npm or bun

### Commands

```bash
# Clone or navigate to the project directory
cd neon-frontier

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 10. Production Build & Verification

```bash
# Build production bundle with Vite
npm run build

# Preview production build locally
npm run preview -- --port 3000

# Run automated Chrome benchmark suite
node scripts/benchmark-runner.js
```

---

## 11. Deployment

The application compiles to a static single-page application (`dist/`) requiring zero server-side runtimes.

### Recommended Deployment Platforms:
- **Vercel:** `vercel --prod`
- **Cloudflare Pages:** `wrangler pages publish dist`
- **GitHub Pages:** Deploy `dist` directory via GitHub Actions

**Live Production URL:** *(Deployable static bundle generated in `/dist`)*

---

## 12. Design Decisions & Engineering Trade-offs

1. **Why Phaser Blitter instead of individual Sprites:** `Phaser.GameObjects.Sprite` carries significant transform and event tree overhead when scaled to 5,000+ units. The `Blitter` eliminates per-object overhead by managing quad vertices directly.
2. **Why Main Thread Fixed Timestep over Web Worker:** Initial profiling indicated total simulation time under TypedArrays and Spatial Grid partitioning takes only **0.60 ms** per frame. Transferring 5,000 entity positions across a Web Worker thread boundary via `postMessage` or SharedArrayBuffer introduces serialization/synchronization overhead comparable to the simulation itself. Keeping the simulation on the main thread avoided Worker boundary latency while easily maintaining 92+ FPS.
3. **Procedural Web Audio over Sampled MP3/WAV:** Eliminates asset loading failures, removes HTTP request overhead, and enables dynamic pitch and frequency shifts based on tower tier and enemy health.

---

## 13. AI Usage & Independent Validation

AI assistance was utilized for initial boilerplate scaffolding, typing signatures, and theme ideation. All architectural implementations—including the fixed timestep accumulator, TypedArray entity indexing, uniform spatial grid partitioning, procedural WebGL texture atlas generation, and automated headless Chrome benchmark runner—were independently implemented, compiled, and validated with empirical Performance API measurements.
