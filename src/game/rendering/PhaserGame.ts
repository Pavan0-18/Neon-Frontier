import Phaser from 'phaser';
import { GameEngine } from '../engine/GameEngine';
import { GlobalPathSystem } from '../systems/PathSystem';
import { TOWER_DEFINITIONS, TowerType } from '../../data/towers';
import { ENEMY_DEFINITIONS } from '../../data/enemies';

export class DefenseScene extends Phaser.Scene {
  private engine!: GameEngine;

  // Visual layers
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private energyFlowGraphics!: Phaser.GameObjects.Graphics;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private healthBarGraphics!: Phaser.GameObjects.Graphics;
  private uiGraphics!: Phaser.GameObjects.Graphics;

  // Ultra-Fast Blitter WebGL Quad Batcher
  private entityBlitter!: Phaser.GameObjects.Blitter;
  private blitterBobs: Phaser.GameObjects.Bob[] = [];
  private readonly maxBobs: number = 18000;

  // Placement preview
  public selectedBuildType: TowerType | null = null;
  public selectedTowerId: number | null = null;
  public onTowerSelected?: (id: number | null) => void;
  public onTowerPlaced?: (type: TowerType, x: number, y: number) => void;
  public uiManager?: { tickTelemetry: (dt: number) => void };

  private mouseWorldX: number = 0;
  private mouseWorldY: number = 0;
  private isPointerInCanvas: boolean = false;

  // Optimization toggles
  public useViewportCulling: boolean = true;
  public useBatchRender: boolean = true;

  // Flow animation timer
  private flowOffset: number = 0;

  // Cached frame objects for blazing-fast frame switching
  private cachedFrames: Record<string, Phaser.Textures.Frame> = {};

  constructor() {
    super({ key: 'DefenseScene' });
  }

  public init(data: { engine: GameEngine }): void {
    this.engine = data.engine;
  }

  public create(): void {
    // 1. Generate Procedural Texture Atlas
    this.generateProceduralAtlas();

    // 2. Create Graphics Layers
    this.bgGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();
    this.energyFlowGraphics = this.add.graphics();
    this.worldGraphics = this.add.graphics();

    // 3. Create WebGL Blitter for batched rendering
    this.entityBlitter = this.add.blitter(0, 0, 'neon_atlas');
    const defaultFrame = this.textures.getFrame('neon_atlas', 'enemy_drone');
    for (let i = 0; i < this.maxBobs; i++) {
      const bob = this.entityBlitter.create(0, 0, defaultFrame, false);
      this.blitterBobs.push(bob);
    }

    this.healthBarGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();

    // 4. Draw static starfield and space nebula backdrop
    this.drawBackground();

    // 5. Draw static orbital path corridor
    this.drawPathCorridor();

    // 6. Setup Input Handlers
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.mouseWorldX = pointer.x;
      this.mouseWorldY = pointer.y;
      this.isPointerInCanvas = true;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) { // Left click
        this.handlePointerClick(pointer.x, pointer.y);
      } else if (pointer.button === 2) { // Right click
        this.cancelPlacement();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.cancelPlacement();
    });
  }

  private generateProceduralAtlas(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Transparent canvas
    ctx.clearRect(0, 0, 512, 512);

    const frameRects: Record<string, { x: number; y: number; w: number; h: number }> = {
      enemy_scout: { x: 0, y: 0, w: 24, h: 24 },
      enemy_drone: { x: 30, y: 0, w: 28, h: 28 },
      enemy_tank: { x: 64, y: 0, w: 40, h: 40 },
      enemy_shield: { x: 110, y: 0, w: 32, h: 32 },
      enemy_regenerator: { x: 148, y: 0, w: 32, h: 32 },
      enemy_swarm: { x: 186, y: 0, w: 16, h: 16 },
      boss_behemoth: { x: 210, y: 0, w: 60, h: 60 },
      boss_warp_lord: { x: 276, y: 0, w: 64, h: 64 },
      boss_mothership: { x: 346, y: 0, w: 72, h: 72 },
      enemy_phantom: { x: 424, y: 0, w: 26, h: 26 },

      proj_pulse: { x: 0, y: 90, w: 12, h: 12 },
      proj_tesla: { x: 20, y: 90, w: 12, h: 12 },
      proj_mortar: { x: 40, y: 90, w: 20, h: 20 },
      proj_cryo: { x: 66, y: 90, w: 14, h: 14 },
      proj_railgun: { x: 86, y: 90, w: 16, h: 16 },
      proj_flak: { x: 108, y: 90, w: 12, h: 12 },
      proj_vortex: { x: 126, y: 90, w: 18, h: 18 },
      particle_spark: { x: 150, y: 90, w: 8, h: 8 }
    };

    // Helper to draw a glowing circle
    const drawGlowCircle = (cx: number, cy: number, r: number, fill: string, stroke: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.restore();
    };

    // Helper to draw diamond
    const drawDiamond = (cx: number, cy: number, r: number, fill: string, stroke: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.restore();
    };

    // 1. Scout: sharp cyan dart
    drawDiamond(12, 12, 10, '#00f3ff', '#ffffff');

    // 2. Drone: cyan glowing node
    drawGlowCircle(44, 14, 11, '#38bdf8', '#00f3ff');

    // 3. Tank: heavy amber octagon
    drawGlowCircle(84, 20, 17, '#f59e0b', '#fbbf24');
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(77, 13, 14, 14);

    // 4. Shield Unit: aegis indigo node with shield ring
    drawGlowCircle(126, 16, 12, '#818cf8', '#a5b4fc');
    ctx.beginPath();
    ctx.arc(126, 16, 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#c7d2fe';
    ctx.stroke();

    // 5. Regenerator: emerald bio-orb
    drawGlowCircle(164, 16, 12, '#10b981', '#34d399');

    // 6. Swarm: tiny crimson stinger
    drawDiamond(194, 8, 6, '#f43f5e', '#ffffff');

    // 7. Boss Behemoth: massive crimson dreadnought
    drawGlowCircle(240, 30, 26, '#ff0055', '#ff4d88');
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(228, 18, 24, 24);

    // 8. Boss Warp Lord: purple ethereal star
    drawGlowCircle(308, 32, 28, '#b026ff', '#d8b4fe');
    drawDiamond(308, 32, 20, '#d8b4fe', '#ffffff');

    // 9. Boss Apex Mothership: colossal golden titan
    drawGlowCircle(382, 36, 32, '#ffaa00', '#fde047');
    drawDiamond(382, 36, 22, '#ffffff', '#ffaa00');

    // 10. Phantom Speeder: magenta cloaked spearhead
    drawDiamond(437, 13, 10, '#e879f9', '#ffffff');
    ctx.beginPath();
    ctx.arc(437, 13, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#f0abfc';
    ctx.stroke();

    // Projectiles
    // Pulse
    drawGlowCircle(6, 96, 4, '#00f3ff', '#ffffff');
    // Tesla
    drawGlowCircle(26, 96, 4, '#b026ff', '#ffffff');
    // Mortar
    drawGlowCircle(50, 100, 8, '#ffaa00', '#ffffff');
    // Cryo
    drawDiamond(73, 97, 5, '#00ffcc', '#ffffff');
    // Railgun
    drawDiamond(94, 98, 6, '#ff0055', '#ffffff');
    // Flak
    drawDiamond(114, 96, 4, '#34d399', '#ffffff');
    // Vortex
    drawGlowCircle(135, 99, 7, '#7c3aed', '#c084fc');
    // Particle
    drawGlowCircle(154, 94, 3, '#ffffff', '#00f3ff');

    // Register with Phaser texture manager
    this.textures.addCanvas('neon_atlas', canvas);

    const atlasTexture = this.textures.get('neon_atlas');
    for (const [key, r] of Object.entries(frameRects)) {
      atlasTexture.add(key, 0, r.x, r.y, r.w, r.h);
      this.cachedFrames[key] = atlasTexture.get(key);
    }
  }

  private drawBackground(): void {
    const g = this.bgGraphics;
    g.clear();

    // Deep cosmic space gradient
    g.fillGradientStyle(0x050814, 0x050814, 0x090f24, 0x090f24, 1);
    g.fillRect(0, 0, 1280, 720);

    // Nebula dust glows
    g.fillStyle(0x00f3ff, 0.03);
    g.fillCircle(300, 200, 320);
    g.fillStyle(0xb026ff, 0.035);
    g.fillCircle(850, 400, 380);
    g.fillStyle(0xff0055, 0.025);
    g.fillCircle(1100, 300, 260);

    // Subtle orbital defense grid lines
    g.lineStyle(1, 0x00f3ff, 0.04);
    for (let x = 0; x <= 1280; x += 40) {
      g.lineBetween(x, 0, x, 720);
    }
    for (let y = 0; y <= 720; y += 40) {
      g.lineBetween(0, y, 1280, y);
    }

    // Static distant star specs
    g.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 120; i++) {
      const sx = (i * 137.5) % 1280;
      const sy = (i * 243.7) % 720;
      const r = (i % 3 === 0) ? 1.5 : 1;
      g.fillCircle(sx, sy, r);
    }
  }

  private drawPathCorridor(): void {
    const g = this.pathGraphics;
    g.clear();

    const wps = GlobalPathSystem.waypoints;

    // Outer path corridor glow
    g.lineStyle(48, 0x00f3ff, 0.06);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // Corridor borders
    g.lineStyle(24, 0x0f172a, 0.9);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // Center neon power conduit
    g.lineStyle(3, 0x00f3ff, 0.6);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // Warp In Portal
    g.fillStyle(0x00f3ff, 0.2);
    g.fillCircle(wps[0].x, wps[0].y, 22);
    g.lineStyle(2, 0x00f3ff, 0.9);
    g.strokeCircle(wps[0].x, wps[0].y, 22);
    g.lineStyle(1, 0xffffff, 0.9);
    g.strokeCircle(wps[0].x, wps[0].y, 14);

    // Energy Core Base Structure
    const core = GlobalPathSystem.corePosition;
    g.fillStyle(0xffaa00, 0.15);
    g.fillCircle(core.x, core.y, 40);
    g.lineStyle(3, 0xffaa00, 0.9);
    g.strokeCircle(core.x, core.y, 32);
    g.lineStyle(2, 0x00f3ff, 0.8);
    g.strokeCircle(core.x, core.y, 20);
    g.fillStyle(0x00f3ff, 0.9);
    g.fillCircle(core.x, core.y, 10);
  }

  public update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // 1. Advance Game Simulation via Engine
    this.engine.update(dt);

    // 2. Render dynamic game state
    this.engine.perfMonitor.beginRender();
    this.renderFrame(dt);
    this.engine.perfMonitor.endRender();

    // 3. Update HUD telemetry
    if (this.uiManager) {
      this.uiManager.tickTelemetry(dt);
    }
  }

  private renderFrame(dt: number): void {
    // Animate energy pulses along the path
    this.flowOffset = (this.flowOffset + dt * 140) % GlobalPathSystem.totalLength;
    this.energyFlowGraphics.clear();
    this.energyFlowGraphics.fillStyle(0x00f3ff, 0.8);
    const tempP = { x: 0, y: 0 };
    for (let d = this.flowOffset; d < GlobalPathSystem.totalLength; d += 80) {
      GlobalPathSystem.getPositionAtDistance(d, tempP);
      this.energyFlowGraphics.fillCircle(tempP.x, tempP.y, 3);
    }

    const wg = this.worldGraphics;
    wg.clear();
    const hbg = this.healthBarGraphics;
    hbg.clear();

    const em = this.engine.entityMgr;
    const viewWidth = 1280;
    const viewHeight = 720;

    // --- RENDER TOWERS ---
    for (let i = 0; i < em.towers.length; i++) {
      const t = em.towers[i];
      const isSelected = (t.id === this.selectedTowerId);
      const def = TOWER_DEFINITIONS[t.type];

      // Base pedestal
      wg.fillStyle(0x0f172a, 0.95);
      wg.fillCircle(t.x, t.y, 18);
      wg.lineStyle(2, isSelected ? 0xffffff : def.color, isSelected ? 1 : 0.85);
      wg.strokeCircle(t.x, t.y, 18);

      // Inner turret core
      wg.fillStyle(def.color, 0.85);
      wg.fillCircle(t.x, t.y, 8 + t.level * 2);

      // Level indicator pips
      for (let lvl = 0; lvl < t.level; lvl++) {
        const angle = (lvl * (Math.PI * 2 / 3)) - Math.PI / 2;
        const px = t.x + Math.cos(angle) * 13;
        const py = t.y + Math.sin(angle) * 13;
        wg.fillStyle(0xffffff, 1);
        wg.fillCircle(px, py, 2.5);
      }

      // EMP Stun indicator
      if (t.stunTimer > 0) {
        wg.lineStyle(2, 0x00f3ff, 0.8);
        wg.strokeCircle(t.x, t.y, 22 + Math.sin(Date.now() * 0.01) * 3);
      }

      // If shooting railgun, draw instant hypersonic beam
      if (t.type === 'railgun' && t.targetEnemyIdx >= 0 && t.cooldownTimer > t.attackInterval - 0.08) {
        if (em.enemyActive[t.targetEnemyIdx] === 1) {
          wg.lineStyle(4, 0xff0055, 1);
          wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
          wg.lineStyle(1.5, 0xffffff, 1);
          wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
        }
      }

      // If shooting Photon Laser, draw continuous thermal beam
      if (t.type === 'laser' && t.targetEnemyIdx >= 0 && em.enemyActive[t.targetEnemyIdx] === 1) {
        const beamW = Math.min(6, 2.5 + t.laserLockDuration * 0.7);
        wg.lineStyle(beamW + 2, 0xff2200, 0.45);
        wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
        wg.lineStyle(beamW, 0xffaa00, 0.9);
        wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
        wg.lineStyle(beamW * 0.4, 0xffffff, 1);
        wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
      }
    }

    // --- RENDER HIGH-VOLUME ENTITIES (ENEMIES & PROJECTILES) ---
    const activeECount = em.activeEnemyCount;
    const activeEIndices = em.activeEnemyIndices;
    const activePCount = em.activeProjCount;
    const activePIndices = em.activeProjIndices;

    if (this.useBatchRender) {
      // High-performance Batched Quad Rendering with Blitter (Single WebGL Draw Call)
      this.entityBlitter.visible = true;
      let bobIdx = 0;

      // 1. Enemies
      for (let i = 0; i < activeECount; i++) {
        const slot = activeEIndices[i];
        if (em.enemyActive[slot] === 0) continue;

        const ex = em.enemyX[slot];
        const ey = em.enemyY[slot];

        // Viewport culling
        if (this.useViewportCulling) {
          if (ex < -35 || ex > viewWidth + 35 || ey < -35 || ey > viewHeight + 35) {
            continue;
          }
        }

        if (bobIdx < this.maxBobs) {
          const typeIdx = em.enemyType[slot];
          const typeKey = em.enemyTypeKeys[typeIdx];
          const frame = this.cachedFrames[`enemy_${typeKey}`] || this.cachedFrames.enemy_drone;
          const bob = this.blitterBobs[bobIdx++];
          bob.x = ex - frame.width / 2;
          bob.y = ey - frame.height / 2;
          bob.setFrame(frame);
          bob.visible = true;

          // Damaged enemies & bosses get lightweight health bars
          const hp = em.enemyHealth[slot];
          const maxHp = em.enemyMaxHealth[slot];
          if (hp < maxHp || em.enemyIsBoss[slot] === 1) {
            const barW = Math.max(16, frame.width);
            const barH = 3;
            const barX = ex - barW / 2;
            const barY = ey - frame.height / 2 - 6;
            const hpPct = Math.max(0, hp / maxHp);

            hbg.fillStyle(0x050811, 0.8);
            hbg.fillRect(barX, barY, barW, barH);
            hbg.fillStyle(hpPct > 0.4 ? 0x00ff88 : 0xff0055, 1);
            hbg.fillRect(barX, barY, barW * hpPct, barH);
          }
        }
      }

      // 2. Projectiles
      for (let i = 0; i < activePCount; i++) {
        const slot = activePIndices[i];
        if (em.projActive[slot] === 0) continue;

        const px = em.projX[slot];
        const py = em.projY[slot];

        if (this.useViewportCulling) {
          if (px < -20 || px > viewWidth + 20 || py < -20 || py > viewHeight + 20) {
            continue;
          }
        }

        if (bobIdx < this.maxBobs) {
          const pType = em.projType[slot];
          let pFrameKey = 'proj_pulse';
          if (pType === 1) pFrameKey = 'proj_tesla';
          else if (pType === 2) pFrameKey = 'proj_mortar';
          else if (pType === 3) pFrameKey = 'proj_cryo';
          else if (pType === 4) pFrameKey = 'proj_railgun';
          else if (pType === 5) pFrameKey = 'proj_flak';
          else if (pType === 6) pFrameKey = 'proj_vortex';

          const frame = this.cachedFrames[pFrameKey];
          const bob = this.blitterBobs[bobIdx++];
          bob.x = px - frame.width / 2;
          bob.y = py - frame.height / 2;
          bob.setFrame(frame);
          bob.visible = true;
        }
      }

      // 3. Particles
      for (let i = 0; i < em.particles.length; i++) {
        const p = em.particles[i];
        if (p.active && bobIdx < this.maxBobs) {
          const frame = this.cachedFrames.particle_spark;
          const bob = this.blitterBobs[bobIdx++];
          bob.x = p.x - frame.width / 2;
          bob.y = p.y - frame.height / 2;
          bob.setFrame(frame);
          bob.visible = true;
        }
      }

      // Hide remaining unused bobs
      for (let b = bobIdx; b < this.maxBobs; b++) {
        if (this.blitterBobs[b].visible) {
          this.blitterBobs[b].visible = false;
        } else {
          break; // subsequent bobs are already inactive
        }
      }
    } else {
      // Unoptimized Baseline: CPU Vector Geometry Triangulation via Graphics
      this.entityBlitter.visible = false;

      // Draw enemies as individual graphics circles
      for (let i = 0; i < activeECount; i++) {
        const slot = activeEIndices[i];
        if (em.enemyActive[slot] === 0) continue;

        const ex = em.enemyX[slot];
        const ey = em.enemyY[slot];
        const radius = em.enemyRadius[slot];
        const typeIdx = em.enemyType[slot];
        const typeKey = em.enemyTypeKeys[typeIdx];
        const def = ENEMY_DEFINITIONS[typeKey];

        wg.fillStyle(def.color, 0.9);
        wg.fillCircle(ex, ey, radius);
        wg.lineStyle(1.5, 0xffffff, 0.9);
        wg.strokeCircle(ex, ey, radius);
      }

      // Draw projectiles
      for (let i = 0; i < activePCount; i++) {
        const slot = activePIndices[i];
        if (em.projActive[slot] === 0) continue;
        const px = em.projX[slot];
        const py = em.projY[slot];
        wg.fillStyle(0x00f3ff, 1);
        wg.fillCircle(px, py, 3);
      }
    }

    // --- UI OVERLAYS (Range Rings & Ghost Preview) ---
    const uig = this.uiGraphics;
    uig.clear();

    // 1. If tower is selected, render range ring
    if (this.selectedTowerId !== null) {
      const t = em.towers.find(tow => tow.id === this.selectedTowerId);
      if (t) {
        uig.lineStyle(2, 0x00f3ff, 0.7);
        uig.strokeCircle(t.x, t.y, t.range);
        uig.fillStyle(0x00f3ff, 0.06);
        uig.fillCircle(t.x, t.y, t.range);
      }
    }

    // 2. Ghost preview during tower placement
    if (this.selectedBuildType !== null && this.isPointerInCanvas) {
      const def = TOWER_DEFINITIONS[this.selectedBuildType];
      const stats = def.levels[0];
      const isValid = this.isValidPlacement(this.mouseWorldX, this.mouseWorldY);

      const color = isValid ? 0x00f3ff : 0xff0055;

      // Range preview
      uig.lineStyle(1.5, color, 0.6);
      uig.strokeCircle(this.mouseWorldX, this.mouseWorldY, stats.range);
      uig.fillStyle(color, 0.08);
      uig.fillCircle(this.mouseWorldX, this.mouseWorldY, stats.range);

      // Ghost tower
      uig.fillStyle(color, 0.4);
      uig.fillCircle(this.mouseWorldX, this.mouseWorldY, 18);
      uig.lineStyle(2, color, 1);
      uig.strokeCircle(this.mouseWorldX, this.mouseWorldY, 18);
    }
  }

  private handlePointerClick(x: number, y: number): void {
    // 1. If placing a tower
    if (this.selectedBuildType !== null) {
      if (this.isValidPlacement(x, y)) {
        const def = TOWER_DEFINITIONS[this.selectedBuildType];
        if (this.engine.economySystem.spendCredits(def.baseCost)) {
          const t = this.engine.entityMgr.createTower(this.selectedBuildType, x, y);
          this.selectedTowerId = t.id;
          if (this.onTowerPlaced) {
            this.onTowerPlaced(this.selectedBuildType, x, y);
          }
          if (this.onTowerSelected) {
            this.onTowerSelected(t.id);
          }
          this.selectedBuildType = null;
        }
      }
      return;
    }

    // 2. Otherwise check if clicked on an existing tower
    const clickedTower = this.engine.entityMgr.towers.find(t => Math.hypot(t.x - x, t.y - y) <= 22);
    if (clickedTower) {
      this.selectedTowerId = clickedTower.id;
      if (this.onTowerSelected) {
        this.onTowerSelected(clickedTower.id);
      }
    } else {
      // Clicked on empty space: deselect
      this.selectedTowerId = null;
      if (this.onTowerSelected) {
        this.onTowerSelected(null);
      }
    }
  }

  public isValidPlacement(x: number, y: number): boolean {
    // Must be inside arena margins
    if (x < 60 || x > 1220 || y < 60 || y > 660) {
      return false;
    }

    // Must not collide with path
    if (GlobalPathSystem.isNearPath(x, y, 32)) {
      return false;
    }

    // Must not collide with another tower
    for (const t of this.engine.entityMgr.towers) {
      if (Math.hypot(t.x - x, t.y - y) < 40) {
        return false;
      }
    }

    return true;
  }

  public cancelPlacement(): void {
    this.selectedBuildType = null;
    this.selectedTowerId = null;
    if (this.onTowerSelected) {
      this.onTowerSelected(null);
    }
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

export function createPhaserGame(engine: GameEngine, containerId: string = 'game-container'): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // Uses WebGL with Canvas fallback
    parent: containerId,
    width: 1280,
    height: 720,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    },
    scene: [DefenseScene]
  };

  const game = new Phaser.Game(config);
  game.scene.start('DefenseScene', { engine });
  return game;
}
