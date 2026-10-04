import Phaser from 'phaser';
import { GameEngine } from '../engine/GameEngine';
import { GlobalPathSystem } from '../systems/PathSystem';
import { TOWER_DEFINITIONS, TowerType } from '../../data/towers';
import { ENEMY_DEFINITIONS } from '../../data/enemies';
import { DEFENSE_NODES, DefenseNodeDef } from '../../data/nodes';

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

  // Placement preview and Node Interaction
  public selectedBuildType: TowerType | null = null;
  public selectedTowerId: number | null = null;
  public hoveredNode: DefenseNodeDef | null = null;
  public onNodeClicked?: (node: DefenseNodeDef, screenPos: { x: number; y: number }) => void;
  public onTowerSelected?: (id: number | null, screenPos?: { x: number; y: number }) => void;
  public onTowerPlaced?: (type: TowerType, x: number, y: number) => void;
  public uiManager?: { tickTelemetry: (dt: number) => void };

  private mouseWorldX: number = 0;
  private mouseWorldY: number = 0;
  private isPointerInCanvas: boolean = false;
  public isBaseInDanger: boolean = false;

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

      // Detect hovering over defense nodes
      let foundNode: DefenseNodeDef | null = null;
      for (let i = 0; i < DEFENSE_NODES.length; i++) {
        const n = DEFENSE_NODES[i];
        if (Math.hypot(n.x - pointer.x, n.y - pointer.y) <= 22) {
          foundNode = n;
          break;
        }
      }
      this.hoveredNode = foundNode;
      if (this.game.canvas) {
        this.game.canvas.style.cursor = foundNode ? 'pointer' : 'default';
      }
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

    // 1. Soft atmospheric ion haze (ambient cyan path aura)
    g.lineStyle(32, 0x00f3ff, 0.04);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // 2. Dual subtle magnetic containment rails
    g.lineStyle(16, 0x060c1e, 0.7);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // 3. High-energy optical conduit center line
    g.lineStyle(2.5, 0x00f3ff, 0.75);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // Inner optical laser filament
    g.lineStyle(1, 0xffffff, 0.9);
    g.beginPath();
    g.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      g.lineTo(wps[i].x, wps[i].y);
    }
    g.strokePath();

    // 4. Warp-In Portal (Hyperspace Gate)
    const portal = wps[0];
    g.fillStyle(0x00f3ff, 0.15);
    g.fillCircle(portal.x, portal.y, 22);
    g.lineStyle(2, 0x00f3ff, 0.9);
    g.strokeCircle(portal.x, portal.y, 22);
    g.lineStyle(1, 0xffffff, 0.9);
    g.strokeCircle(portal.x, portal.y, 14);
    g.fillStyle(0x00f3ff, 0.9);
    g.fillCircle(portal.x, portal.y, 6);

    // 5. Energy Core Base Structure (Colony Heart)
    const core = GlobalPathSystem.corePosition;
    g.fillStyle(0xffaa00, 0.12);
    g.fillCircle(core.x, core.y, 42);
    g.lineStyle(2.5, 0xffaa00, 0.9);
    g.strokeCircle(core.x, core.y, 32);
    g.lineStyle(1.5, 0x00f3ff, 0.85);
    g.strokeCircle(core.x, core.y, 20);
    g.fillStyle(0x00f3ff, 0.95);
    g.fillCircle(core.x, core.y, 10);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(core.x, core.y, 4);
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
    // 1. Animate high-energy pulses along the orbital conduit
    this.flowOffset = (this.flowOffset + dt * 160) % GlobalPathSystem.totalLength;
    this.energyFlowGraphics.clear();
    const tempP = { x: 0, y: 0 };
    for (let d = this.flowOffset; d < GlobalPathSystem.totalLength; d += 65) {
      GlobalPathSystem.getPositionAtDistance(d, tempP);
      this.energyFlowGraphics.fillStyle(0x00f3ff, 0.85);
      this.energyFlowGraphics.fillCircle(tempP.x, tempP.y, 3);
      this.energyFlowGraphics.fillStyle(0xffffff, 0.95);
      this.energyFlowGraphics.fillCircle(tempP.x, tempP.y, 1.5);
    }

    const wg = this.worldGraphics;
    wg.clear();
    const hbg = this.healthBarGraphics;
    hbg.clear();

    const em = this.engine.entityMgr;
    const viewWidth = 1280;
    const viewHeight = 720;

    // Base Threat Detection & Danger Glow
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
    this.isBaseInDanger = (minEnemyDist < 220);

    if (this.isBaseInDanger) {
      const pulseR = 34 + Math.sin(Date.now() * 0.008) * 8;
      wg.lineStyle(2.5, 0xff0055, 0.85);
      wg.strokeCircle(core.x, core.y, pulseR);
      wg.fillStyle(0xff0055, 0.15);
      wg.fillCircle(core.x, core.y, pulseR);
    }

    // --- RENDER EMPTY DEFENSE NODES ---
    const now = Date.now();
    for (let i = 0; i < DEFENSE_NODES.length; i++) {
      const node = DEFENSE_NODES[i];
      // Check if node has a tower on it
      const hasTower = em.towers.some(t => t.nodeId === node.id || Math.hypot(t.x - node.x, t.y - node.y) < 18);
      if (hasTower) continue;

      const isHovered = (this.hoveredNode?.id === node.id);
      const pulse = Math.sin(now * 0.0035 + i * 0.4);
      const baseAlpha = isHovered ? 0.95 : (0.45 + pulse * 0.15);
      const r = isHovered ? 17 : 14;

      // Color coding per node bonus type
      let nodeColor = 0x00f3ff; // standard
      if (node.type === 'power') nodeColor = 0xf59e0b; // amber
      else if (node.type === 'range') nodeColor = 0x38bdf8; // sky cyan
      else if (node.type === 'amplifier') nodeColor = 0xb026ff; // purple

      // Ground bracket anchor
      wg.fillStyle(0x0a1026, 0.6);
      wg.fillCircle(node.x, node.y, r);
      wg.lineStyle(1.5, nodeColor, baseAlpha);

      if (node.type === 'standard') {
        wg.strokeCircle(node.x, node.y, r);
        wg.fillStyle(nodeColor, baseAlpha * 0.8);
        wg.fillCircle(node.x, node.y, 3);
        // Cardinal ticks
        wg.lineBetween(node.x - r - 3, node.y, node.x - r + 3, node.y);
        wg.lineBetween(node.x + r - 3, node.y, node.x + r + 3, node.y);
        wg.lineBetween(node.x, node.y - r - 3, node.x, node.y - r + 3);
        wg.lineBetween(node.x, node.y + r - 3, node.x, node.y + r + 3);
      } else if (node.type === 'power') {
        // Glowing equilateral triangle anchor
        const triR = r + 1;
        const a0 = -Math.PI / 2;
        const a1 = a0 + (Math.PI * 2 / 3);
        const a2 = a1 + (Math.PI * 2 / 3);
        wg.beginPath();
        wg.moveTo(node.x + Math.cos(a0) * triR, node.y + Math.sin(a0) * triR);
        wg.lineTo(node.x + Math.cos(a1) * triR, node.y + Math.sin(a1) * triR);
        wg.lineTo(node.x + Math.cos(a2) * triR, node.y + Math.sin(a2) * triR);
        wg.closePath();
        wg.strokePath();
        wg.fillStyle(nodeColor, baseAlpha * 0.85);
        wg.fillCircle(node.x, node.y, 3.5);
      } else if (node.type === 'range') {
        // Tactical diamond anchor
        const dR = r + 1;
        wg.beginPath();
        wg.moveTo(node.x, node.y - dR);
        wg.lineTo(node.x + dR, node.y);
        wg.lineTo(node.x, node.y + dR);
        wg.lineTo(node.x - dR, node.y);
        wg.closePath();
        wg.strokePath();
        wg.strokeCircle(node.x, node.y, 4);
      } else if (node.type === 'amplifier') {
        // Octagonal harmonic amplifier
        wg.strokeCircle(node.x, node.y, r);
        const inR = r - 4;
        wg.beginPath();
        wg.moveTo(node.x, node.y - inR);
        wg.lineTo(node.x + inR, node.y);
        wg.lineTo(node.x, node.y + inR);
        wg.lineTo(node.x - inR, node.y);
        wg.closePath();
        wg.strokePath();
      }

      if (isHovered) {
        wg.lineStyle(1, 0xffffff, 0.8);
        wg.strokeCircle(node.x, node.y, r + 5 + Math.sin(now * 0.01) * 2);
      }
    }

    // --- RENDER TOWERS (ORBITAL DEFENSE STRUCTURES) ---
    const isOvercharged = em.overchargeTimer > 0;
    for (let i = 0; i < em.towers.length; i++) {
      const t = em.towers[i];
      const isSelected = (t.id === this.selectedTowerId);
      const def = TOWER_DEFINITIONS[t.type];
      t.rotationAngle = (t.rotationAngle || 0) + dt * 1.6;
      const rot = t.rotationAngle;

      // Underglow indicating tactical node bonus
      if (t.nodeType === 'power') {
        wg.fillStyle(0xf59e0b, 0.16);
        wg.fillCircle(t.x, t.y, 22);
      } else if (t.nodeType === 'range') {
        wg.fillStyle(0x38bdf8, 0.16);
        wg.fillCircle(t.x, t.y, 22);
      } else if (t.nodeType === 'amplifier') {
        wg.fillStyle(0xb026ff, 0.18);
        wg.fillCircle(t.x, t.y, 22);
      }

      // Orbital Platform Base
      wg.fillStyle(0x080f20, 0.95);
      wg.fillCircle(t.x, t.y, 18);
      wg.lineStyle(1.5, isSelected ? 0xffffff : def.color, isSelected ? 1 : 0.8);
      wg.strokeCircle(t.x, t.y, 18);

      // Overcharge electrical aura
      if (isOvercharged) {
        wg.lineStyle(2, 0xffd700, 0.85);
        wg.strokeCircle(t.x, t.y, 22 + Math.sin(now * 0.015 + i) * 3);
        wg.fillStyle(0xffd700, 0.1);
        wg.fillCircle(t.x, t.y, 22);
      }

      // Render Distinct Orbital Structure based on Tower Type
      switch (t.type) {
        case 'pulse': {
          // Rotating energy ring with 3 perimeter magnetic emitters and glowing core
          wg.lineStyle(1.5, def.color, 0.85);
          wg.strokeCircle(t.x, t.y, 12);
          for (let k = 0; k < 3; k++) {
            const ea = rot + (k * Math.PI * 2 / 3);
            wg.fillStyle(0xffffff, 0.95);
            wg.fillCircle(t.x + Math.cos(ea) * 12, t.y + Math.sin(ea) * 12, 2.5);
          }
          const coreR = 5 + Math.sin(now * 0.006) * 1.5;
          wg.fillStyle(def.color, 1);
          wg.fillCircle(t.x, t.y, coreR);
          wg.fillStyle(0xffffff, 0.9);
          wg.fillCircle(t.x, t.y, coreR * 0.5);
          break;
        }

        case 'tesla': {
          // Central lightning reactor with 3 orbiting satellite induction nodes
          wg.fillStyle(def.color, 0.9);
          wg.fillCircle(t.x, t.y, 7);
          wg.fillStyle(0xffffff, 1);
          wg.fillCircle(t.x, t.y, 3);
          for (let k = 0; k < 3; k++) {
            const sa = rot * 1.5 + (k * Math.PI * 2 / 3);
            const sx = t.x + Math.cos(sa) * 13;
            const sy = t.y + Math.sin(sa) * 13;
            wg.fillStyle(0xd8b4fe, 1);
            wg.fillCircle(sx, sy, 3);
            // Crackling micro-arc to core
            wg.lineStyle(1, 0xd8b4fe, 0.7);
            wg.lineBetween(t.x, t.y, sx, sy);
          }
          break;
        }

        case 'mortar': {
          // Rotating diamond heavy reactor with pulsing fusion core
          const mR = 12;
          wg.lineStyle(2, def.color, 0.9);
          wg.beginPath();
          wg.moveTo(t.x + Math.cos(rot) * mR, t.y + Math.sin(rot) * mR);
          wg.lineTo(t.x + Math.cos(rot + Math.PI / 2) * mR, t.y + Math.sin(rot + Math.PI / 2) * mR);
          wg.lineTo(t.x + Math.cos(rot + Math.PI) * mR, t.y + Math.sin(rot + Math.PI) * mR);
          wg.lineTo(t.x + Math.cos(rot + Math.PI * 1.5) * mR, t.y + Math.sin(rot + Math.PI * 1.5) * mR);
          wg.closePath();
          wg.strokePath();
          wg.fillStyle(0xffaa00, 1);
          wg.fillCircle(t.x, t.y, 6);
          wg.fillStyle(0xffffff, 1);
          wg.fillCircle(t.x, t.y, 3);
          break;
        }

        case 'cryo': {
          // Hexagonal crystal prism with 4 counter-orbiting frost shards
          wg.fillStyle(def.color, 0.8);
          wg.beginPath();
          for (let k = 0; k < 6; k++) {
            const ha = (k * Math.PI / 3);
            const hx = t.x + Math.cos(ha) * 8;
            const hy = t.y + Math.sin(ha) * 8;
            if (k === 0) wg.moveTo(hx, hy);
            else wg.lineTo(hx, hy);
          }
          wg.closePath();
          wg.fillPath();
          // Counter-rotating frost crystals
          for (let k = 0; k < 4; k++) {
            const fa = -rot * 1.2 + (k * Math.PI / 2);
            const fx = t.x + Math.cos(fa) * 13;
            const fy = t.y + Math.sin(fa) * 13;
            wg.fillStyle(0xffffff, 0.9);
            wg.fillRect(fx - 1.5, fy - 1.5, 3, 3);
          }
          break;
        }

        case 'railgun': {
          // Dual linear accelerator rails pointing in targeting direction
          let targetAngle = rot * 0.2;
          if (t.targetEnemyIdx >= 0 && em.enemyActive[t.targetEnemyIdx] === 1) {
            targetAngle = Math.atan2(em.enemyY[t.targetEnemyIdx] - t.y, em.enemyX[t.targetEnemyIdx] - t.x);
          }
          const cosA = Math.cos(targetAngle);
          const sinA = Math.sin(targetAngle);
          const normX = -sinA * 4;
          const normY = cosA * 4;

          // Twin rails
          wg.lineStyle(2, def.color, 1);
          wg.lineBetween(t.x + normX - cosA * 5, t.y + normY - sinA * 5, t.x + normX + cosA * 15, t.y + normY + sinA * 15);
          wg.lineBetween(t.x - normX - cosA * 5, t.y - normY - sinA * 5, t.x - normX + cosA * 15, t.y - normY + sinA * 15);
          // Capacitor breach
          wg.fillStyle(0xffffff, 0.95);
          wg.fillCircle(t.x - cosA * 2, t.y - sinA * 2, 4);
          break;
        }

        case 'laser': {
          // Directional crystalline focal lens with concentric aperture
          wg.lineStyle(1.5, def.color, 0.9);
          wg.strokeCircle(t.x, t.y, 11);
          wg.lineStyle(1, 0xffffff, 0.8);
          wg.strokeCircle(t.x, t.y, 6);
          wg.fillStyle(def.color, 0.95);
          wg.fillCircle(t.x, t.y, 4);
          break;
        }

        case 'flak': {
          // Rotary quad-burst barrel hub
          wg.fillStyle(0x1e293b, 1);
          wg.fillCircle(t.x, t.y, 9);
          for (let k = 0; k < 4; k++) {
            const ba = rot * 2 + (k * Math.PI / 2);
            const bx = t.x + Math.cos(ba) * 12;
            const by = t.y + Math.sin(ba) * 12;
            wg.lineStyle(2.5, def.color, 0.9);
            wg.lineBetween(t.x + Math.cos(ba) * 4, t.y + Math.sin(ba) * 4, bx, by);
          }
          wg.fillStyle(0xffffff, 1);
          wg.fillCircle(t.x, t.y, 3);
          break;
        }

        case 'vortex': {
          // Micro-black hole: dark void center with swirling accretion discs
          wg.fillStyle(0x000000, 1);
          wg.fillCircle(t.x, t.y, 7);
          wg.lineStyle(1.5, def.color, 0.9);
          wg.strokeCircle(t.x, t.y, 7);
          for (let k = 0; k < 3; k++) {
            const va = rot * 2.2 + (k * Math.PI * 2 / 3);
            const vx = t.x + Math.cos(va) * 12;
            const vy = t.y + Math.sin(va) * 12;
            wg.fillStyle(0xc084fc, 0.9);
            wg.fillCircle(vx, vy, 2.5);
          }
          break;
        }
      }

      // Level indicator satellites
      for (let lvl = 0; lvl < t.level; lvl++) {
        const angle = (lvl * (Math.PI * 2 / 3)) - Math.PI / 2;
        const px = t.x + Math.cos(angle) * 14;
        const py = t.y + Math.sin(angle) * 14;
        wg.fillStyle(0xffffff, 1);
        wg.fillCircle(px, py, 2);
      }

      // EMP Stun indicator
      if (t.stunTimer > 0) {
        wg.lineStyle(2, 0x00f3ff, 0.8);
        wg.strokeCircle(t.x, t.y, 22 + Math.sin(now * 0.01) * 3);
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

          // Enemy Status Effect Indicators (Shield bubble & Frost slow)
          if (em.enemyShield[slot] > 0) {
            hbg.lineStyle(1.5, 0x00f3ff, 0.85);
            hbg.strokeCircle(ex, ey, (frame.width * 0.5) + 3);
          }
          if (em.enemySlowTimer[slot] > 0) {
            hbg.fillStyle(0x00ffcc, 0.9);
            hbg.fillCircle(ex, ey - frame.height * 0.5 - 5, 3);
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

    // 1. If tower is selected, render dynamic animated range ring & targeting vector
    if (this.selectedTowerId !== null) {
      const t = em.towers.find(tow => tow.id === this.selectedTowerId);
      if (t) {
        const pulse = Math.sin(Date.now() * 0.005) * 3;
        const animatedRange = t.range + pulse;

        // Animated glowing neon range ring
        uig.lineStyle(2, 0x00f3ff, 0.85);
        uig.strokeCircle(t.x, t.y, animatedRange);
        uig.lineStyle(1, 0x00f3ff, 0.25);
        uig.strokeCircle(t.x, t.y, t.range - 6);
        uig.fillStyle(0x00f3ff, 0.06);
        uig.fillCircle(t.x, t.y, animatedRange);

        // Active locked target vector line & reticle
        if (t.targetEnemyIdx >= 0 && em.enemyActive[t.targetEnemyIdx] === 1) {
          const tarX = em.enemyX[t.targetEnemyIdx];
          const tarY = em.enemyY[t.targetEnemyIdx];

          uig.lineStyle(1.5, 0x00ff88, 0.7);
          uig.lineBetween(t.x, t.y, tarX, tarY);

          // Pulsing target lock bracket
          const reticleR = 14 + Math.sin(Date.now() * 0.012) * 3;
          uig.lineStyle(1.5, 0x00ff88, 0.9);
          uig.strokeCircle(tarX, tarY, reticleR);
          uig.fillStyle(0x00ff88, 0.15);
          uig.fillCircle(tarX, tarY, reticleR);
        }

        // Highlight all other valid hostiles within range with subtle dots
        for (let j = 0; j < activeECount; j++) {
          const eslot = activeEIndices[j];
          if (em.enemyActive[eslot] === 1 && eslot !== t.targetEnemyIdx) {
            const ex = em.enemyX[eslot];
            const ey = em.enemyY[eslot];
            if (Math.hypot(ex - t.x, ey - t.y) <= t.range) {
              uig.fillStyle(0x00f3ff, 0.5);
              uig.fillCircle(ex, ey, 4);
            }
          }
        }
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

  public getScreenCoords(worldX: number, worldY: number): { x: number; y: number } {
    const canvas = this.game.canvas;
    if (!canvas) return { x: worldX, y: worldY };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / 1280;
    const scaleY = rect.height / 720;
    return {
      x: rect.left + worldX * scaleX,
      y: rect.top + worldY * scaleY
    };
  }

  public buildTowerOnNode(node: DefenseNodeDef, towerType: TowerType): boolean {
    const def = TOWER_DEFINITIONS[towerType];
    if (this.engine.economySystem.spendCredits(def.baseCost)) {
      const t = this.engine.entityMgr.createTower(towerType, node.x, node.y, node.id, node.type);
      this.selectedTowerId = t.id;
      if (this.onTowerPlaced) {
        this.onTowerPlaced(towerType, node.x, node.y);
      }
      const screenPos = this.getScreenCoords(node.x, node.y);
      if (this.onTowerSelected) {
        this.onTowerSelected(t.id, screenPos);
      }
      return true;
    }
    return false;
  }

  private handlePointerClick(x: number, y: number): void {
    // 1. Check if clicked near an orbital defense node
    let closestNode: DefenseNodeDef | null = null;
    let minDist = 26;
    for (let i = 0; i < DEFENSE_NODES.length; i++) {
      const n = DEFENSE_NODES[i];
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < minDist) {
        minDist = d;
        closestNode = n;
      }
    }

    if (closestNode) {
      const screenPos = this.getScreenCoords(closestNode.x, closestNode.y);
      const existingTower = this.engine.entityMgr.towers.find(
        t => t.nodeId === closestNode!.id || Math.hypot(t.x - closestNode!.x, t.y - closestNode!.y) < 22
      );

      if (existingTower) {
        this.selectedTowerId = existingTower.id;
        if (this.onTowerSelected) {
          this.onTowerSelected(existingTower.id, screenPos);
        }
      } else {
        // If a build type was already queued
        if (this.selectedBuildType !== null) {
          this.buildTowerOnNode(closestNode, this.selectedBuildType);
          this.selectedBuildType = null;
          return;
        }

        // Open radial build menu at node
        this.selectedTowerId = null;
        if (this.onNodeClicked) {
          this.onNodeClicked(closestNode, screenPos);
        }
      }
      return;
    }

    // 2. Check if clicked on a tower placed outside standard nodes (e.g. from benchmarks)
    const clickedTower = this.engine.entityMgr.towers.find(t => Math.hypot(t.x - x, t.y - y) <= 22);
    if (clickedTower) {
      this.selectedTowerId = clickedTower.id;
      const screenPos = this.getScreenCoords(clickedTower.x, clickedTower.y);
      if (this.onTowerSelected) {
        this.onTowerSelected(clickedTower.id, screenPos);
      }
      return;
    }

    // 3. Fallback free-placement if selectedBuildType is set
    if (this.selectedBuildType !== null) {
      if (this.isValidPlacement(x, y)) {
        const def = TOWER_DEFINITIONS[this.selectedBuildType];
        if (this.engine.economySystem.spendCredits(def.baseCost)) {
          const t = this.engine.entityMgr.createTower(this.selectedBuildType, x, y);
          this.selectedTowerId = t.id;
          if (this.onTowerPlaced) {
            this.onTowerPlaced(this.selectedBuildType, x, y);
          }
          const screenPos = this.getScreenCoords(x, y);
          if (this.onTowerSelected) {
            this.onTowerSelected(t.id, screenPos);
          }
          this.selectedBuildType = null;
        }
      }
      return;
    }

    // 4. Clicked on empty space: deselect and close all context menus
    this.selectedTowerId = null;
    if (this.onTowerSelected) {
      this.onTowerSelected(null);
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

  public triggerCoreBreachVFX(): void {
    this.cameras.main.shake(250, 0.007);
    this.cameras.main.flash(180, 255, 0, 85, true);
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
