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

export class PathSystem {
  public readonly waypoints: Point[];
  public readonly segments: PathSegment[] = [];
  public readonly totalLength: number;
  public readonly corePosition: Point;
  public readonly spawnPosition: Point;

  constructor() {
    this.waypoints = [
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
    ];

    this.spawnPosition = { ...this.waypoints[0] };
    this.corePosition = { ...this.waypoints[this.waypoints.length - 1] };

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
      out.x = this.waypoints[0].x;
      out.y = this.waypoints[0].y;
      return;
    }

    if (dist >= this.totalLength) {
      out.x = this.corePosition.x;
      out.y = this.corePosition.y;
      return;
    }

    // Binary search or direct scan over few segments
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (dist <= seg.endDistance) {
        const segDist = dist - seg.startDistance;
        const t = segDist / seg.length;
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
    for (const seg of this.segments) {
      const dist = this.distToSegment(px, py, seg.p0.x, seg.p0.y, seg.p1.x, seg.p1.y);
      if (dist < clearance) {
        return true;
      }
    }
    return false;
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }
}

export const GlobalPathSystem = new PathSystem();
