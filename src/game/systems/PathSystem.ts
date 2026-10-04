export interface Point {
  x: number;
  y: number;
}

export interface PathSegment {
  p0: Point;
  p1: Point;
  length: number;
  startDistance: number;
  endDistance: number;
}

export const MAP_WAYPOINTS: Record<string, Point[]> = {
  first_contact: [
    { x: 60, y: 160 },
    { x: 450, y: 160 },
    { x: 450, y: 500 },
    { x: 840, y: 500 },
    { x: 840, y: 260 },
    { x: 1180, y: 260 }
  ],
  swarm_protocol: [
    { x: 60, y: 130 },
    { x: 360, y: 130 },
    { x: 360, y: 560 },
    { x: 680, y: 560 },
    { x: 680, y: 180 },
    { x: 980, y: 180 },
    { x: 980, y: 480 },
    { x: 1180, y: 480 }
  ],
  blackout: [
    { x: 60, y: 180 },
    { x: 300, y: 180 },
    { x: 480, y: 520 },
    { x: 780, y: 180 },
    { x: 980, y: 500 },
    { x: 1180, y: 340 }
  ],
  overdrive_matrix: [
    { x: 60, y: 360 },
    { x: 300, y: 360 },
    { x: 300, y: 140 },
    { x: 880, y: 140 },
    { x: 880, y: 580 },
    { x: 500, y: 580 },
    { x: 500, y: 360 },
    { x: 1180, y: 360 }
  ],
  overdrive: [
    { x: 60, y: 360 },
    { x: 300, y: 360 },
    { x: 300, y: 140 },
    { x: 880, y: 140 },
    { x: 880, y: 580 },
    { x: 500, y: 580 },
    { x: 500, y: 360 },
    { x: 1180, y: 360 }
  ],
  fragile_core: [
    { x: 60, y: 140 },
    { x: 260, y: 140 },
    { x: 260, y: 560 },
    { x: 520, y: 560 },
    { x: 520, y: 160 },
    { x: 780, y: 160 },
    { x: 780, y: 560 },
    { x: 1000, y: 560 },
    { x: 1000, y: 320 },
    { x: 1180, y: 320 }
  ],
  hardcore: [
    { x: 60, y: 140 },
    { x: 260, y: 140 },
    { x: 260, y: 560 },
    { x: 520, y: 560 },
    { x: 520, y: 160 },
    { x: 780, y: 160 },
    { x: 780, y: 560 },
    { x: 1000, y: 560 },
    { x: 1000, y: 320 },
    { x: 1180, y: 320 }
  ],
  singularity_crisis: [
    { x: 60, y: 220 },
    { x: 420, y: 220 },
    { x: 420, y: 130 },
    { x: 940, y: 130 },
    { x: 940, y: 580 },
    { x: 300, y: 580 },
    { x: 300, y: 380 },
    { x: 1180, y: 380 }
  ],
  boss_rush: [
    { x: 60, y: 220 },
    { x: 420, y: 220 },
    { x: 420, y: 130 },
    { x: 940, y: 130 },
    { x: 940, y: 580 },
    { x: 300, y: 580 },
    { x: 300, y: 380 },
    { x: 1180, y: 380 }
  ],
  last_orbit: [
    { x: 60, y: 140 },
    { x: 340, y: 140 },
    { x: 340, y: 360 },
    { x: 160, y: 360 },
    { x: 160, y: 580 },
    { x: 620, y: 580 },
    { x: 620, y: 220 },
    { x: 880, y: 220 },
    { x: 880, y: 480 },
    { x: 1140, y: 480 },
    { x: 1140, y: 360 }
  ]
};

export class PathSystem {
  public waypoints: Point[] = [];
  public segments: PathSegment[] = [];
  public totalLength: number = 0;
  public corePosition: Point = { x: 1180, y: 360 };
  public spawnPosition: Point = { x: 60, y: 160 };

  constructor(initialMapId: string = 'first_contact') {
    this.loadMap(initialMapId);
  }

  public loadMap(mapId: string): void {
    const points = MAP_WAYPOINTS[mapId] || MAP_WAYPOINTS.first_contact;
    this.setWaypoints(points);
  }

  public setWaypoints(points: Point[]): void {
    this.waypoints = points.map(p => ({ ...p }));
    this.spawnPosition = { ...this.waypoints[0] };
    this.corePosition = { ...this.waypoints[this.waypoints.length - 1] };
    this.segments = [];

    let runningDistance = 0;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const p0 = this.waypoints[i];
      const p1 = this.waypoints[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const length = Math.hypot(dx, dy);

      this.segments.push({
        p0,
        p1,
        length,
        startDistance: runningDistance,
        endDistance: runningDistance + length
      });

      runningDistance += length;
    }

    this.totalLength = runningDistance;
  }

  /**
   * Fast position lookup along precomputed linear segments.
   */
  public getPositionAtDistance(dist: number, out: Point): void {
    if (dist <= 0) {
      out.x = this.waypoints[0]?.x ?? 0;
      out.y = this.waypoints[0]?.y ?? 0;
      return;
    }

    if (dist >= this.totalLength) {
      out.x = this.corePosition.x;
      out.y = this.corePosition.y;
      return;
    }

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (dist <= seg.endDistance) {
        const segDist = dist - seg.startDistance;
        const t = seg.length > 0 ? segDist / seg.length : 0;
        out.x = seg.p0.x + (seg.p1.x - seg.p0.x) * t;
        out.y = seg.p0.y + (seg.p1.y - seg.p0.y) * t;
        return;
      }
    }

    out.x = this.corePosition.x;
    out.y = this.corePosition.y;
  }

  /**
   * Distance check from a point to the path (to prevent towers placed directly on the road)
   */
  public isNearPath(px: number, py: number, clearance: number = 36): boolean {
    const clearanceSq = clearance * clearance;
    for (const seg of this.segments) {
      const distSq = this.distSqToSegment(px, py, seg.p0.x, seg.p0.y, seg.p1.x, seg.p1.y);
      if (distSq < clearanceSq) {
        return true;
      }
    }
    return false;
  }

  private distSqToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      const ex = px - x1;
      const ey = py - y1;
      return ex * ex + ey * ey;
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const ex = px - projX;
    const ey = py - projY;
    return ex * ex + ey * ey;
  }
}

export const GlobalPathSystem = new PathSystem('first_contact');
