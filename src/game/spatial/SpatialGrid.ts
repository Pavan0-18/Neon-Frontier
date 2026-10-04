/**
 * High-performance Uniform 2D Spatial Grid Partitioning.
 * Provides O(1) average cell insertion and localized range queries,
 * eliminating O(N * M) brute-force entity scans.
 * Uses pooled arrays to avoid heap allocations during frame ticks.
 */
export class SpatialGrid {
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;
  public readonly totalCells: number;

  // Each cell stores an array of entity indices
  private cells: Int32Array[];
  private cellCounts: Int32Array;
  private readonly maxPerCell: number;

  // Reusable query buffer to avoid GC
  private queryResultsBuffer: Int32Array;
  private queryCount: number = 0;

  constructor(width: number = 1280, height: number = 720, cellSize: number = 64, maxPerCell: number = 2048) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize) + 1;
    this.rows = Math.ceil(height / cellSize) + 1;
    this.totalCells = this.cols * this.rows;
    this.maxPerCell = maxPerCell;

    this.cells = new Array(this.totalCells);
    for (let i = 0; i < this.totalCells; i++) {
      this.cells[i] = new Int32Array(this.maxPerCell);
    }
    this.cellCounts = new Int32Array(this.totalCells);
    this.queryResultsBuffer = new Int32Array(8192);
  }

  /**
   * Resets all cell counts to 0 at the start of each simulation tick.
   * Zero heap allocation.
   */
  public clear(): void {
    this.cellCounts.fill(0);
  }

  /**
   * Inserts an entity index into the corresponding spatial cell.
   */
  public insert(entityIndex: number, x: number, y: number): void {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return;
    }

    const cellIdx = row * this.cols + col;
    const count = this.cellCounts[cellIdx];
    if (count < this.maxPerCell) {
      this.cells[cellIdx][count] = entityIndex;
      this.cellCounts[cellIdx] = count + 1;
    }
  }

  /**
   * Queries all entities within radius of (cx, cy).
   * Populates internal reusable queryResultsBuffer.
   * Returns count of matching entity indices.
   */
  public queryRadius(cx: number, cy: number, radius: number): { buffer: Int32Array; count: number } {
    this.queryCount = 0;

    const minCol = Math.max(0, Math.floor((cx - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((cx + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((cy - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((cy + radius) / this.cellSize));

    for (let r = minRow; r <= maxRow; r++) {
      const rowOffset = r * this.cols;
      for (let c = minCol; c <= maxCol; c++) {
        const cellIdx = rowOffset + c;
        const cellCount = this.cellCounts[cellIdx];
        const cell = this.cells[cellIdx];

        for (let i = 0; i < cellCount; i++) {
          if (this.queryCount < this.queryResultsBuffer.length) {
            this.queryResultsBuffer[this.queryCount++] = cell[i];
          }
        }
      }
    }

    return {
      buffer: this.queryResultsBuffer,
      count: this.queryCount
    };
  }
}
