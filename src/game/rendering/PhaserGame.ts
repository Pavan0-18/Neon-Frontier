import Phaser from 'phaser';
import { GameEngine } from '../engine/GameEngine';
import { GlobalPathSystem } from '../systems/PathSystem';
import { TOWER_DEFINITIONS, TowerType } from '../../data/towers';
import type { TowerEntity } from '../entities/EntityManager';

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

  // Free Placement & Tower Selection
  public selectedBuildType: TowerType | null = null;
  public selectedTowerId: number | null = null;
  public onTowerSelected?: (id: number | null, screenPos?: { x: number; y: number }) => void;
  public onTowerPlaced?: (type: TowerType, x: number, y: number) => void;
  public uiManager?: { tickTelemetry: (dt: number) => void; onPlacementStateChange?: () => void };

  private mouseWorldX: number = 0;
  private mouseWorldY: number = 0;
  private isPointerInCanvas: boolean = false;
  public isBaseInDanger: boolean = false;

  // Optimization toggles
  public useViewportCulling: boolean = true;
  public useBatchRender: boolean = true;

  // Flow animation timer
  private flowOffset: number = 0;

  // Cached frame objects for frame switching
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

    // 4. Draw static starfield backdrop
    this.drawBackground();

    // 5. Draw static orbital path corridor
    this.drawPathCorridor();

    // Wire map change event
    this.engine.onMapChanged = () => {
      this.drawPathCorridor();
    };

    // 6. Setup Input Handlers
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.mouseWorldX = pointer.worldX;
      this.mouseWorldY = pointer.worldY;
      this.isPointerInCanvas = true;

      const hoveredTower = this.engine.entityMgr.towers.find(
        t => Math.hypot(t.x - pointer.worldX, t.y - pointer.worldY) <= 30
      );

      if (this.game.canvas) {
        if (this.selectedBuildType !== null) {
          this.game.canvas.style.cursor = 'crosshair';
        } else if (hoveredTower) {
          this.game.canvas.style.cursor = 'pointer';
        } else {
          this.game.canvas.style.cursor = 'default';
        }
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) {
        // Left click: Process click with world coordinates
        this.handlePointerClick(pointer.worldX, pointer.worldY);
      } else if (pointer.button === 2) {
        // Right click cancels placement / closes selection
        if (this.selectedBuildType !== null) {
          this.cancelPlacement();
        } else if (this.selectedTowerId !== null) {
          this.deselectTower();
        }
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.selectedBuildType !== null) {
        this.cancelPlacement();
      } else if (this.selectedTowerId !== null) {
        this.deselectTower();
      }
    });
  }

  private generateProceduralAtlas(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    const frameRects: Record<string, { x: number; y: number; w: number; h: number }> = {
      enemy_scout: { x: 0, y: 0, w: 24, h: 24 },
      enemy_drone: { x: 30, y: 0, w: 28, h: 28 },
      enemy_tank: { x: 64, y: 0, w: 40, h: 40 },
      enemy_shield: { x: 110, y: 0, w: 34, h: 34 },
      enemy_regenerator: { x: 150, y: 0, w: 32, h: 32 },
      enemy_swarm: { x: 188, y: 0, w: 20, h: 20 },
      boss_behemoth: { x: 214, y: 0, w: 60, h: 60 },
      boss_warp_lord: { x: 280, y: 0, w: 64, h: 64 },
      boss_mothership: { x: 350, y: 0, w: 72, h: 72 },
      enemy_phantom: { x: 428, y: 0, w: 28, h: 28 },

      proj_pulse: { x: 0, y: 90, w: 12, h: 12 },
      proj_tesla: { x: 20, y: 90, w: 12, h: 12 },
      proj_mortar: { x: 40, y: 90, w: 20, h: 20 },
      proj_cryo: { x: 66, y: 90, w: 14, h: 14 },
      proj_railgun: { x: 86, y: 90, w: 16, h: 16 },
      proj_flak: { x: 108, y: 90, w: 12, h: 12 },
      proj_vortex: { x: 126, y: 90, w: 18, h: 18 },
      particle_spark: { x: 150, y: 90, w: 8, h: 8 }
    };

    const drawGlowCircle = (cx: number, cy: number, r: number, fill: string, stroke: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.restore();
    };

    // 1. Scout: Sleek sharp aerodynamic dart ◆
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(22, 14);
    ctx.lineTo(16, 22);
    ctx.lineTo(12, 18);
    ctx.lineTo(8, 22);
    ctx.lineTo(2, 14);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 10, 2, 4);
    ctx.restore();

    // 2. Drone: Twin-thruster agile orb
    ctx.save();
    drawGlowCircle(44, 14, 9, '#0369a1', '#38bdf8');
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(32, 10, 4, 8);
    ctx.fillRect(52, 10, 4, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(43, 13, 2, 2);
    ctx.restore();

    // 3. Tank: Heavy armored hexagonal juggernaut ◈ with thick armor plates ╱━━━╲
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(84, 4);
    ctx.lineTo(100, 12);
    ctx.lineTo(100, 28);
    ctx.lineTo(84, 36);
    ctx.lineTo(68, 28);
    ctx.lineTo(68, 12);
    ctx.closePath();
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(78, 14, 12, 12);
    ctx.strokeStyle = '#fde68a';
    ctx.strokeRect(78, 14, 12, 12);
    ctx.restore();

    // 4. Shield Unit: Hexagonal Aegis cruiser with energy barrier
    ctx.save();
    drawGlowCircle(127, 17, 10, '#4338ca', '#818cf8');
    ctx.beginPath();
    ctx.arc(127, 17, 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 5. Regenerator: Bio-mechanical cruiser with pulsing emerald core
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(166, 4);
    ctx.lineTo(178, 16);
    ctx.lineTo(166, 28);
    ctx.lineTo(154, 16);
    ctx.closePath();
    ctx.fillStyle = '#047857';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(166, 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Swarm: Tri-cluster formation of 3 micro-stingers · · ·
    ctx.save();
    const drawMicroDart = (mx: number, my: number) => {
      ctx.beginPath();
      ctx.moveTo(mx, my - 4);
      ctx.lineTo(mx + 3, my + 3);
      ctx.lineTo(mx, my + 1);
      ctx.lineTo(mx - 3, my + 3);
      ctx.closePath();
      ctx.fillStyle = '#e11d48';
      ctx.fill();
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    drawMicroDart(198, 6);
    drawMicroDart(193, 14);
    drawMicroDart(203, 14);
    ctx.restore();

    // 7. Boss Behemoth: Massive crimson dreadnought
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(244, 4);
    ctx.lineTo(268, 16);
    ctx.lineTo(268, 44);
    ctx.lineTo(244, 56);
    ctx.lineTo(220, 44);
    ctx.lineTo(220, 16);
    ctx.closePath();
    ctx.fillStyle = '#881337';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(232, 22, 10, 16);
    ctx.fillRect(246, 22, 10, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(232, 22, 24, 16);
    ctx.restore();

    // 8. Boss Warp Lord: Void starship with dimensional core
    ctx.save();
    drawGlowCircle(312, 32, 26, '#581c87', '#a855f7');
    ctx.beginPath();
    ctx.moveTo(312, 12);
    ctx.lineTo(332, 32);
    ctx.lineTo(312, 52);
    ctx.lineTo(292, 32);
    ctx.closePath();
    ctx.fillStyle = '#7e22ce';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d8b4fe';
    ctx.stroke();
    ctx.restore();

    // 9. Boss Apex Mothership: Colossal golden carrier
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(386, 6);
    ctx.lineTo(416, 20);
    ctx.lineTo(416, 52);
    ctx.lineTo(386, 66);
    ctx.lineTo(356, 52);
    ctx.lineTo(356, 20);
    ctx.closePath();
    ctx.fillStyle = '#78350f';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(374, 26, 24, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(374, 26, 24, 20);
    ctx.restore();

    // 10. Phantom Speeder: Sharp stealth wedge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(442, 4);
    ctx.lineTo(454, 22);
    ctx.lineTo(442, 17);
    ctx.lineTo(430, 22);
    ctx.closePath();
    ctx.fillStyle = '#701a75';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#d946ef';
    ctx.stroke();
    ctx.restore();

    // Projectiles
    drawGlowCircle(6, 96, 4, '#0284c7', '#38bdf8');
    drawGlowCircle(26, 96, 4, '#9333ea', '#c084fc');
    drawGlowCircle(50, 100, 7, '#d97706', '#f59e0b');
    drawGlowCircle(73, 97, 5, '#0d9488', '#2dd4bf');
    drawGlowCircle(94, 98, 5, '#e11d48', '#fb7185');
    drawGlowCircle(114, 96, 4, '#059669', '#34d399');
    drawGlowCircle(135, 99, 7, '#6b21a8', '#a855f7');
    drawGlowCircle(154, 94, 3, '#ffffff', '#38bdf8');

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

    // Subtle tactical grid
    g.lineStyle(1, 0x1e293b, 0.25);
    for (let x = 0; x <= 1280; x += 40) {
      g.lineBetween(x, 0, x, 720);
    }
    for (let y = 0; y <= 720; y += 40) {
      g.lineBetween(0, y, 1280, y);
    }

    // Static distant star specs
    g.fillStyle(0xffffff, 0.4);
    for (let i = 0; i < 90; i++) {
      const sx = (i * 137.5) % 1280;
      const sy = (i * 243.7) % 720;
      const r = i % 4 === 0 ? 1.5 : 1;
      g.fillCircle(sx, sy, r);
    }
  }

  public drawPathCorridor(): void {
    const g = this.pathGraphics;
    g.clear();

    const wps = GlobalPathSystem.waypoints;
    if (!wps || wps.length < 2) return;

    // 1. Base Energy Canal Trench
    g.lineStyle(28, 0x070e1c, 0.9);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // 2. Twin Outer Magnetic Containment Rails
    g.lineStyle(1.5, 0x1e293b, 0.9);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // 3. Central Guided Optical Conduit
    g.lineStyle(2, 0x0284c7, 0.6);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // 4. Enemy Incursion Spawn Beacon △ (at Entrance)
    const portal = wps[0];
    const nextP = wps[1];
    const spawnAngle = Math.atan2(nextP.y - portal.y, nextP.x - portal.x);

    g.fillStyle(0x0f172a, 0.9);
    g.fillCircle(portal.x, portal.y, 20);
    g.lineStyle(2, 0xe11d48, 0.85);
    g.strokeCircle(portal.x, portal.y, 20);

    const triR = 12;
    const p1x = portal.x + Math.cos(spawnAngle) * triR;
    const p1y = portal.y + Math.sin(spawnAngle) * triR;
    const p2x = portal.x + Math.cos(spawnAngle + 2.4) * triR;
    const p2y = portal.y + Math.sin(spawnAngle + 2.4) * triR;
    const p3x = portal.x + Math.cos(spawnAngle - 2.4) * triR;
    const p3y = portal.y + Math.sin(spawnAngle - 2.4) * triR;

    g.fillStyle(0xe11d48, 0.9);
    g.beginPath();
    g.moveTo(p1x, p1y);
    g.lineTo(p2x, p2y);
    g.lineTo(p3x, p3y);
    g.closePath();
    g.fillPath();

    // 5. Energy Core Base Structure ◉ (at Destination)
    const core = GlobalPathSystem.corePosition;
    g.fillStyle(0x0f172a, 0.95);
    g.fillCircle(core.x, core.y, 28);
    g.lineStyle(2, 0x0284c7, 0.85);
    g.strokeCircle(core.x, core.y, 28);
    g.lineStyle(1.5, 0x38bdf8, 0.9);
    g.strokeCircle(core.x, core.y, 16);
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(core.x, core.y, 8);
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
    const now = Date.now();
    const wps = GlobalPathSystem.waypoints;
    if (!wps || wps.length < 2) return;

    // 1. Animated Directional Chevrons Along Energy Conduit (→ → →)
    this.flowOffset = (this.flowOffset + dt * 140) % GlobalPathSystem.totalLength;
    this.energyFlowGraphics.clear();
    const tempP = { x: 0, y: 0 };
    const tempNext = { x: 0, y: 0 };

    for (let d = this.flowOffset; d < GlobalPathSystem.totalLength; d += 55) {
      GlobalPathSystem.getPositionAtDistance(d, tempP);
      GlobalPathSystem.getPositionAtDistance(Math.min(GlobalPathSystem.totalLength, d + 8), tempNext);
      const angle = Math.atan2(tempNext.y - tempP.y, tempNext.x - tempP.x);

      const cLen = 5;
      const c1x = tempP.x - Math.cos(angle - 0.7) * cLen;
      const c1y = tempP.y - Math.sin(angle - 0.7) * cLen;
      const c2x = tempP.x - Math.cos(angle + 0.7) * cLen;
      const c2y = tempP.y - Math.sin(angle + 0.7) * cLen;

      this.energyFlowGraphics.lineStyle(1.5, 0x38bdf8, 0.65);
      this.energyFlowGraphics.beginPath();
      this.energyFlowGraphics.moveTo(c1x, c1y);
      this.energyFlowGraphics.lineTo(tempP.x, tempP.y);
      this.energyFlowGraphics.lineTo(c2x, c2y);
      this.energyFlowGraphics.strokePath();
    }

    const wg = this.worldGraphics;
    wg.clear();
    const hbg = this.healthBarGraphics;
    hbg.clear();

    const em = this.engine.entityMgr;
    const viewWidth = 1280;
    const viewHeight = 720;

    // Base Threat Detection
    const core = GlobalPathSystem.corePosition;
    let minEnemyDist = 9999;
    const activeECount = em.activeEnemyCount;
    const activeEIndices = em.activeEnemyIndices;
    for (let i = 0; i < activeECount; i++) {
      const slot = activeEIndices[i];
      if (em.enemyActive[slot] === 1) {
        const d = Math.hypot(em.enemyX[slot] - core.x, em.enemyY[slot] - core.y);
        if (d < minEnemyDist) minEnemyDist = d;
      }
    }
    this.isBaseInDanger = minEnemyDist < 200;

    // --- RENDER LIVING ENERGY CORE BASE ◉ ---
    const coreHealthPct = this.engine.economySystem.coreHealth / this.engine.economySystem.maxCoreHealth;
    const isCriticalCore = coreHealthPct <= 0.25;
    const coreRot = now * 0.002;

    if (this.isBaseInDanger || isCriticalCore) {
      const dangerColor = isCriticalCore ? 0xe11d48 : 0xf59e0b;
      const pulseR = 32 + Math.sin(now * 0.01) * 6;
      wg.lineStyle(2, dangerColor, 0.9);
      wg.strokeCircle(core.x, core.y, pulseR);
    }

    const shieldColor = isCriticalCore ? 0xe11d48 : coreHealthPct > 0.5 ? 0x0284c7 : 0xf59e0b;
    wg.lineStyle(1.5, shieldColor, 0.8);
    wg.strokeCircle(core.x, core.y, 24);
    for (let k = 0; k < 4; k++) {
      const sa = coreRot + (k * Math.PI) / 2;
      wg.fillStyle(0xffffff, 0.9);
      wg.fillCircle(core.x + Math.cos(sa) * 24, core.y + Math.sin(sa) * 24, 2);
    }

    const crystalR = 8 + Math.sin(now * 0.005) * 2;
    wg.fillStyle(shieldColor, 0.95);
    wg.fillCircle(core.x, core.y, crystalR);
    wg.fillStyle(0xffffff, 1);
    wg.fillCircle(core.x, core.y, crystalR * 0.5);

    // --- RENDER TOWERS WITH PHYSICAL MK EVOLUTION ---
    const isOvercharged = em.overchargeTimer > 0;
    for (let i = 0; i < em.towers.length; i++) {
      const t = em.towers[i];
      const isSelected = t.id === this.selectedTowerId;
      const def = TOWER_DEFINITIONS[t.type];
      t.rotationAngle = (t.rotationAngle || 0) + dt * 1.5;
      const rot = t.rotationAngle;
      const lvl = t.level;

      // Mechanical base platform
      const baseR = 15 + (lvl - 1) * 3;
      wg.fillStyle(0x0f172a, 0.95);
      wg.fillCircle(t.x, t.y, baseR);
      wg.lineStyle(lvl >= 3 ? 2 : 1.5, isSelected ? 0xffffff : def.color, isSelected ? 1 : 0.8);
      wg.strokeCircle(t.x, t.y, baseR);

      // Mk 2 / Mk 3 Reinforcement Pylons
      if (lvl >= 2) {
        for (let k = 0; k < (lvl === 2 ? 3 : 4); k++) {
          const pa = -rot * 0.8 + (k * Math.PI * 2) / (lvl === 2 ? 3 : 4);
          const px = t.x + Math.cos(pa) * (baseR + 2);
          const py = t.y + Math.sin(pa) * (baseR + 2);
          wg.fillStyle(def.color, 0.85);
          wg.fillCircle(px, py, lvl === 3 ? 3 : 2);
        }
      }

      if (isOvercharged) {
        wg.lineStyle(1.5, 0xf59e0b, 0.8);
        wg.strokeCircle(t.x, t.y, baseR + 4);
      }

      switch (t.type) {
        case 'pulse': {
          const emitterCount = lvl === 1 ? 3 : lvl === 2 ? 4 : 6;
          const ringR = 9 + (lvl - 1) * 2.5;
          wg.lineStyle(1.5, def.color, 0.85);
          wg.strokeCircle(t.x, t.y, ringR);
          for (let k = 0; k < emitterCount; k++) {
            const ea = rot + (k * Math.PI * 2) / emitterCount;
            wg.fillStyle(0xffffff, 0.9);
            wg.fillCircle(t.x + Math.cos(ea) * ringR, t.y + Math.sin(ea) * ringR, 2);
          }
          wg.fillStyle(def.color, 1);
          wg.fillCircle(t.x, t.y, 4 + lvl);
          break;
        }

        case 'tesla': {
          const nodeCount = lvl === 1 ? 3 : lvl === 2 ? 4 : 5;
          const orbR = 10 + (lvl - 1) * 2.5;
          wg.fillStyle(def.color, 0.9);
          wg.fillCircle(t.x, t.y, 5 + lvl);
          for (let k = 0; k < nodeCount; k++) {
            const sa = rot * 1.5 + (k * Math.PI * 2) / nodeCount;
            const sx = t.x + Math.cos(sa) * orbR;
            const sy = t.y + Math.sin(sa) * orbR;
            wg.fillStyle(0xd8b4fe, 1);
            wg.fillCircle(sx, sy, 2.5);
            wg.lineStyle(1, 0xd8b4fe, 0.6);
            wg.lineBetween(t.x, t.y, sx, sy);
          }
          break;
        }

        case 'mortar': {
          const mR = 10 + (lvl - 1) * 2.5;
          wg.lineStyle(2, def.color, 0.9);
          wg.beginPath();
          const sides = lvl === 3 ? 6 : 4;
          for (let k = 0; k < sides; k++) {
            const ma = rot + (k * Math.PI * 2) / sides;
            const mx = t.x + Math.cos(ma) * mR;
            const my = t.y + Math.sin(ma) * mR;
            if (k === 0) wg.moveTo(mx, my);
            else wg.lineTo(mx, my);
          }
          wg.closePath();
          wg.strokePath();
          wg.fillStyle(0xf59e0b, 1);
          wg.fillCircle(t.x, t.y, 4 + lvl);
          break;
        }

        case 'cryo': {
          const shardCount = lvl === 1 ? 4 : lvl === 2 ? 6 : 8;
          wg.fillStyle(def.color, 0.8);
          wg.beginPath();
          for (let k = 0; k < 6; k++) {
            const ha = (k * Math.PI) / 3;
            const hx = t.x + Math.cos(ha) * (6 + lvl * 1.5);
            const hy = t.y + Math.sin(ha) * (6 + lvl * 1.5);
            if (k === 0) wg.moveTo(hx, hy);
            else wg.lineTo(hx, hy);
          }
          wg.closePath();
          wg.fillPath();

          for (let k = 0; k < shardCount; k++) {
            const fa = -rot * 1.2 + (k * Math.PI * 2) / shardCount;
            const fx = t.x + Math.cos(fa) * (11 + (lvl - 1) * 2.5);
            const fy = t.y + Math.sin(fa) * (11 + (lvl - 1) * 2.5);
            wg.fillStyle(0xffffff, 0.9);
            wg.fillRect(fx - 1.5, fy - 1.5, 3, 3);
          }
          break;
        }

        case 'railgun': {
          let targetAngle = rot * 0.2;
          if (t.targetEnemyIdx >= 0 && em.enemyActive[t.targetEnemyIdx] === 1) {
            targetAngle = Math.atan2(em.enemyY[t.targetEnemyIdx] - t.y, em.enemyX[t.targetEnemyIdx] - t.x);
          }
          const cosA = Math.cos(targetAngle);
          const sinA = Math.sin(targetAngle);
          const normX = -sinA * (3 + lvl);
          const normY = cosA * (3 + lvl);
          const railLen = 13 + (lvl - 1) * 4;

          wg.lineStyle(lvl >= 3 ? 2.5 : 2, def.color, 1);
          wg.lineBetween(
            t.x + normX - cosA * 4,
            t.y + normY - sinA * 4,
            t.x + normX + cosA * railLen,
            t.y + normY + sinA * railLen
          );
          wg.lineBetween(
            t.x - normX - cosA * 4,
            t.y - normY - sinA * 4,
            t.x - normX + cosA * railLen,
            t.y - normY + sinA * railLen
          );

          wg.fillStyle(0xffffff, 0.95);
          wg.fillCircle(t.x - cosA * 2, t.y - sinA * 2, 2.5 + lvl);
          break;
        }

        case 'laser': {
          const lensR = 9 + (lvl - 1) * 2.5;
          wg.lineStyle(1.5, def.color, 0.9);
          wg.strokeCircle(t.x, t.y, lensR);
          wg.fillStyle(def.color, 0.95);
          wg.fillCircle(t.x, t.y, 3 + lvl);
          break;
        }

        case 'flak': {
          const barrelCount = lvl === 1 ? 4 : lvl === 2 ? 6 : 8;
          wg.fillStyle(0x1e293b, 1);
          wg.fillCircle(t.x, t.y, 7 + lvl);
          for (let k = 0; k < barrelCount; k++) {
            const ba = rot * 2 + (k * Math.PI * 2) / barrelCount;
            const bx = t.x + Math.cos(ba) * (10 + lvl * 2);
            const by = t.y + Math.sin(ba) * (10 + lvl * 2);
            wg.lineStyle(1.5, def.color, 0.9);
            wg.lineBetween(t.x + Math.cos(ba) * 2, t.y + Math.sin(ba) * 2, bx, by);
          }
          break;
        }

        case 'vortex': {
          const voidR = 5 + lvl * 1.5;
          wg.fillStyle(0x000000, 1);
          wg.fillCircle(t.x, t.y, voidR);
          wg.lineStyle(1.5, def.color, 0.95);
          wg.strokeCircle(t.x, t.y, voidR);

          const discCount = lvl === 1 ? 3 : lvl === 2 ? 4 : 5;
          for (let k = 0; k < discCount; k++) {
            const va = rot * 2 + (k * Math.PI * 2) / discCount;
            const vx = t.x + Math.cos(va) * (10 + (lvl - 1) * 3);
            const vy = t.y + Math.sin(va) * (10 + (lvl - 1) * 3);
            wg.fillStyle(0xc084fc, 0.95);
            wg.fillCircle(vx, vy, 2);
          }
          break;
        }
      }

      // Level indicator pips
      for (let l = 0; l < t.level; l++) {
        const angle = l * ((Math.PI * 2) / 3) - Math.PI / 2;
        const px = t.x + Math.cos(angle) * (baseR - 3);
        const py = t.y + Math.sin(angle) * (baseR - 3);
        wg.fillStyle(0xffffff, 1);
        wg.fillCircle(px, py, 1.8);
      }

      // Railgun Fire Beam
      if (t.type === 'railgun' && t.targetEnemyIdx >= 0 && t.cooldownTimer > t.attackInterval - 0.08) {
        if (em.enemyActive[t.targetEnemyIdx] === 1) {
          wg.lineStyle(3, 0xe11d48, 1);
          wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
        }
      }

      // Laser Fire Beam
      if (t.type === 'laser' && t.targetEnemyIdx >= 0 && em.enemyActive[t.targetEnemyIdx] === 1) {
        const beamW = Math.min(5, 2 + t.laserLockDuration * 0.6);
        wg.lineStyle(beamW, 0xf59e0b, 0.9);
        wg.lineBetween(t.x, t.y, em.enemyX[t.targetEnemyIdx], em.enemyY[t.targetEnemyIdx]);
      }
    }

    // --- RENDER HIGH-VOLUME ENTITIES (ENEMIES & PROJECTILES) ---
    const activePCount = em.activeProjCount;
    const activePIndices = em.activeProjIndices;

    if (this.useBatchRender) {
      this.entityBlitter.visible = true;
      let bobIdx = 0;

      // 1. Enemies
      for (let i = 0; i < activeECount; i++) {
        const slot = activeEIndices[i];
        if (em.enemyActive[slot] === 0) continue;

        const ex = em.enemyX[slot];
        const ey = em.enemyY[slot];

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

          // Health bars
          const hp = em.enemyHealth[slot];
          const maxHp = em.enemyMaxHealth[slot];
          if (hp < maxHp || em.enemyIsBoss[slot] === 1) {
            const barW = Math.max(16, frame.width);
            const barH = 3;
            const barX = ex - barW / 2;
            const barY = ey - frame.height / 2 - 5;
            const hpPct = Math.max(0, hp / maxHp);

            hbg.fillStyle(0x020617, 0.85);
            hbg.fillRect(barX, barY, barW, barH);
            hbg.fillStyle(hpPct > 0.4 ? 0x22c55e : 0xe11d48, 1);
            hbg.fillRect(barX, barY, barW * hpPct, barH);
          }

          // Shield bubble
          if (em.enemyShield[slot] > 0) {
            hbg.lineStyle(1.5, 0x38bdf8, 0.8);
            hbg.strokeCircle(ex, ey, frame.width * 0.5 + 2);
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
          const typeIdx = em.projType[slot];
          const typeKey = em.projTypeKeys[typeIdx];
          const frame = this.cachedFrames[`proj_${typeKey}`] || this.cachedFrames.proj_pulse;
          const bob = this.blitterBobs[bobIdx++];
          bob.x = px - frame.width / 2;
          bob.y = py - frame.height / 2;
          bob.setFrame(frame);
          bob.visible = true;
        }
      }

      for (let i = bobIdx; i < this.blitterBobs.length; i++) {
        if (this.blitterBobs[i].visible) {
          this.blitterBobs[i].visible = false;
        } else {
          break;
        }
      }
    }

    // --- RENDER UI PREVIEWS & SELECTION CIRCLES ---
    this.uiGraphics.clear();

    // 1. Selected Tower Range Circle
    if (this.selectedTowerId !== null) {
      const selectedT = em.towers.find(t => t.id === this.selectedTowerId);
      if (selectedT) {
        this.uiGraphics.lineStyle(1.5, 0x38bdf8, 0.6);
        this.uiGraphics.strokeCircle(selectedT.x, selectedT.y, selectedT.currentStats.range);
        this.uiGraphics.fillStyle(0x38bdf8, 0.05);
        this.uiGraphics.fillCircle(selectedT.x, selectedT.y, selectedT.currentStats.range);

        // Highlight ring around selected tower
        this.uiGraphics.lineStyle(2, 0xffffff, 0.85);
        this.uiGraphics.strokeCircle(selectedT.x, selectedT.y, 18);
      }
    }

    // 2. Free-Placement Holographic Ghost at Cursor
    if (this.selectedBuildType !== null && this.isPointerInCanvas) {
      const def = TOWER_DEFINITIONS[this.selectedBuildType];
      const mx = this.mouseWorldX;
      const my = this.mouseWorldY;
      const isValid = this.isValidPlacement(mx, my);
      const color = isValid ? 0x38bdf8 : 0xef4444;

      // Range indicator circle
      this.uiGraphics.lineStyle(1.5, color, isValid ? 0.7 : 0.9);
      this.uiGraphics.strokeCircle(mx, my, def.levels[0].range);
      this.uiGraphics.fillStyle(color, isValid ? 0.06 : 0.12);
      this.uiGraphics.fillCircle(mx, my, def.levels[0].range);

      // Ghost footprint
      this.uiGraphics.lineStyle(2, color, 0.9);
      this.uiGraphics.strokeCircle(mx, my, 16);
      this.uiGraphics.fillStyle(0x0f172a, 0.7);
      this.uiGraphics.fillCircle(mx, my, 16);

      // Center crosshair
      this.uiGraphics.lineBetween(mx - 6, my, mx + 6, my);
      this.uiGraphics.lineBetween(mx, my - 6, mx, my + 6);
    }
  }

  public getScreenCoords(gameX: number, gameY: number): { x: number; y: number } {
    const canvas = this.game.canvas;
    if (!canvas) return { x: gameX, y: gameY };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / 1280;
    const scaleY = rect.height / 720;
    return {
      x: rect.left + gameX * scaleX,
      y: rect.top + gameY * scaleY
    };
  }

  public isValidPlacement(x: number, y: number): boolean {
    if (x < 50 || x > 1230 || y < 60 || y > 660) {
      return false;
    }
    if (GlobalPathSystem.isNearPath(x, y, 32)) {
      return false;
    }
    for (const t of this.engine.entityMgr.towers) {
      if (Math.hypot(t.x - x, t.y - y) < 38) {
        return false;
      }
    }
    return true;
  }

  public buildTowerAt(type: TowerType, x: number, y: number): boolean {
    if (!this.isValidPlacement(x, y)) return false;
    const def = TOWER_DEFINITIONS[type];
    if (!this.engine.economySystem.spendCredits(def.baseCost)) {
      return false;
    }

    const t = this.engine.entityMgr.createTower(type, x, y);
    this.selectedTowerId = t.id;

    if (this.onTowerPlaced) {
      this.onTowerPlaced(type, x, y);
    }
    const screenPos = this.getScreenCoords(x, y);
    if (this.onTowerSelected) {
      this.onTowerSelected(t.id, screenPos);
    }
    return true;
  }

  private handlePointerClick(x: number, y: number): void {
    // 1. FIRST PRIORITY: Click on ANY existing tower
    // Check with generous 32px tolerance and find the closest tower to click point
    let clickedTower: TowerEntity | null = null;
    let closestDist = 32;
    for (const t of this.engine.entityMgr.towers) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < closestDist) {
        closestDist = d;
        clickedTower = t;
      }
    }

    if (clickedTower) {
      // If player was in placement mode, exit placement mode so they can interact with the tower
      if (this.selectedBuildType !== null) {
        this.selectedBuildType = null;
        if (this.uiManager?.onPlacementStateChange) {
          this.uiManager.onPlacementStateChange();
        }
      }
      this.selectedTowerId = clickedTower.id;
      const screenPos = this.getScreenCoords(clickedTower.x, clickedTower.y);
      if (this.onTowerSelected) {
        this.onTowerSelected(clickedTower.id, screenPos);
      }
      return;
    }

    // 2. SECOND PRIORITY: If in free-placement mode, build on valid empty terrain
    if (this.selectedBuildType !== null) {
      if (this.isValidPlacement(x, y)) {
        const type = this.selectedBuildType;
        // Exit placement mode so player immediately has inspection focus on the new tower
        this.selectedBuildType = null;
        if (this.uiManager?.onPlacementStateChange) {
          this.uiManager.onPlacementStateChange();
        }
        this.buildTowerAt(type, x, y);
      }
      return;
    }

    // 3. Clicked on empty terrain: deselect active tower
    this.deselectTower();
  }

  public cancelPlacement(): void {
    this.selectedBuildType = null;
    if (this.uiManager?.onPlacementStateChange) {
      this.uiManager.onPlacementStateChange();
    }
  }

  public deselectTower(): void {
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

  public triggerCoreBreachVFX(): void {
    this.cameras.main.shake(250, 0.007);
    this.cameras.main.flash(180, 225, 29, 72, true);
  }
}

export function createPhaserGame(engine: GameEngine, parentElementId: string = 'game-container'): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    parent: parentElementId,
    width: 1280,
    height: 720,
    backgroundColor: '#050814',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      powerPreference: 'high-performance',
      antialias: true,
      roundPixels: false
    },
    scene: [DefenseScene]
  };

  const game = new Phaser.Game(config);
  game.scene.start('DefenseScene', { engine });
  return game;
}
