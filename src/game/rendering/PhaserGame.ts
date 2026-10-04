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
  private uiGraphics!: Phaser.GameObjects.Graphics;

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

  constructor() {
    super({ key: 'DefenseScene' });
  }

  public init(data: { engine: GameEngine }): void {
    this.engine = data.engine;
  }

  public create(): void {
    // 1. Create Graphics Layers
    this.bgGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();
    this.energyFlowGraphics = this.add.graphics();
    this.worldGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();

    // 2. Draw static starfield and space nebula backdrop
    this.drawBackground();

    // 3. Draw static orbital path corridor
    this.drawPathCorridor();

    // 4. Setup Input Handlers
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
    // Deterministic star placement
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
    }

    // --- RENDER ENEMIES ---
    const activeECount = em.activeEnemyCount;
    const activeEIndices = em.activeEnemyIndices;

    for (let i = 0; i < activeECount; i++) {
      const slot = activeEIndices[i];
      if (em.enemyActive[slot] === 0) continue;

      const ex = em.enemyX[slot];
      const ey = em.enemyY[slot];

      // Viewport culling optimization
      if (this.useViewportCulling) {
        if (ex < -30 || ex > viewWidth + 30 || ey < -30 || ey > viewHeight + 30) {
          continue;
        }
      }

      const radius = em.enemyRadius[slot];
      const typeIdx = em.enemyType[slot];
      const typeKey = em.enemyTypeKeys[typeIdx];
      const def = ENEMY_DEFINITIONS[typeKey];

      // Boss aura pulse
      if (em.enemyIsBoss[slot] === 1) {
        const pulse = Math.sin(Date.now() * 0.006) * 4;
        wg.fillStyle(def.color, 0.2);
        wg.fillCircle(ex, ey, radius + 10 + pulse);
        wg.lineStyle(2, def.color, 0.8);
        wg.strokeCircle(ex, ey, radius + 6 + pulse);
      }

      // Enemy Body
      wg.fillStyle(def.color, 0.9);
      wg.fillCircle(ex, ey, radius);
      wg.lineStyle(1.5, 0xffffff, 0.9);
      wg.strokeCircle(ex, ey, radius);

      // Shield halo
      if (em.enemyShield[slot] > 0) {
        wg.lineStyle(2, 0x818cf8, 0.9);
        wg.strokeCircle(ex, ey, radius + 4);
      }

      // Health Bar
      const hp = em.enemyHealth[slot];
      const maxHp = em.enemyMaxHealth[slot];
      if (hp < maxHp || em.enemyIsBoss[slot] === 1) {
        const barW = Math.max(16, radius * 2);
        const barH = 3;
        const barX = ex - barW / 2;
        const barY = ey - radius - 7;
        const hpPct = Math.max(0, hp / maxHp);

        wg.fillStyle(0x050811, 0.8);
        wg.fillRect(barX, barY, barW, barH);
        wg.fillStyle(hpPct > 0.4 ? 0x00ff88 : 0xff0055, 1);
        wg.fillRect(barX, barY, barW * hpPct, barH);
      }
    }

    // --- RENDER PROJECTILES ---
    const activePCount = em.activeProjCount;
    const activePIndices = em.activeProjIndices;

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

      const pType = em.projType[slot];
      let pColor = 0x00f3ff;
      let pSize = 3;

      if (pType === 1) { pColor = 0xb026ff; pSize = 3; }
      else if (pType === 2) { pColor = 0xffaa00; pSize = 6; }
      else if (pType === 3) { pColor = 0x00ffcc; pSize = 3.5; }
      else if (pType === 4) { pColor = 0xff0055; pSize = 4; }

      // Projectile core
      wg.fillStyle(pColor, 1);
      wg.fillCircle(px, py, pSize);

      // Trailing tail
      const vx = em.projVx[slot];
      const vy = em.projVy[slot];
      const vDist = Math.hypot(vx, vy) || 1;
      const tailLen = Math.min(12, pSize * 3);
      wg.lineStyle(pSize * 0.8, pColor, 0.4);
      wg.lineBetween(px, py, px - (vx / vDist) * tailLen, py - (vy / vDist) * tailLen);
    }

    // --- RENDER PARTICLES ---
    for (let i = 0; i < em.particles.length; i++) {
      const p = em.particles[i];
      if (p.active) {
        const alpha = 1 - (p.life / p.maxLife);
        wg.fillStyle(p.color, alpha);
        wg.fillCircle(p.x, p.y, p.size * alpha);
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
