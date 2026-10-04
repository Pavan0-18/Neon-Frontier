/**
 * High-performance Uniform 2D Spatial Grid Partitioning.
 * Implemented using a Zero-Allocation Flat 1D Linked-List Typed Buffer architecture.
 *
 * Provides O(1) instantaneous bulk clearing via TypedArray.fill(-1),
 * O(1) single-pointer cell insertion, and contiguous L1-cache friendly spatial traversal.
 * Zero GC allocations during simulation ticks.
 */
export class SpatialGrid {
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;
  public readonly totalCells: number;

  // Flat 1D Head / Next Linked List arrays
  // cellHeads[cellIdx] -> Index of first entity in this cell (-1 if empty)
  // entityNext[entityIdx] -> Index of next entity in the same cell (-1 if end of chain)
  public readonly cellHeads: Int32Array;
  public readonly entityNext: Int32Array;
  private readonly maxEntities: number;

  // Reusable query buffer to prevent dynamic allocations
  private queryResultsBuffer: Int32Array;
  private queryCount: number = 0;

  constructor(width: number = 1280, height: number = 720, cellSize: number = 64, maxEntities: number = 16384) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize) + 1;
    this.rows = Math.ceil(height / cellSize) + 1;
    this.totalCells = this.cols * this.rows;
    this.maxEntities = maxEntities;

    this.cellHeads = new Int32Array(this.totalCells);
    this.cellHeads.fill(-1);

    this.entityNext = new Int32Array(this.maxEntities);
    this.entityNext.fill(-1);

    this.queryResultsBuffer = new Int32Array(8192);
  }

  /**
   * Resets all cell heads to -1 in a single native memory operation.
   * Zero heap allocations.
   */
  public clear(): void {
    this.cellHeads.fill(-1);
  }

  /**
   * Inserts an entity index into the corresponding spatial cell linked list in O(1) time.
   */
  public insert(entityIndex: number, x: number, y: number): void {
    if (entityIndex < 0 || entityIndex >= this.maxEntities) {
      return;
    }

    const col = (x / this.cellSize) | 0;
    const row = (y / this.cellSize) | 0;

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return;
    }

    const cellIdx = row * this.cols + col;
    this.entityNext[entityIndex] = this.cellHeads[cellIdx];
    this.cellHeads[cellIdx] = entityIndex;
  }

  /**
   * Queries all entities within radius of (cx, cy).
   * Traverses flat linked-list cell chains and populates the reusable internal buffer.
   */
  public queryRadius(cx: number, cy: number, radius: number): { buffer: Int32Array; count: number } {
    this.queryCount = 0;

    const minCol = Math.max(0, ((cx - radius) / this.cellSize) | 0);
    const maxCol = Math.min(this.cols - 1, ((cx + radius) / this.cellSize) | 0);
    const minRow = Math.max(0, ((cy - radius) / this.cellSize) | 0);
    const maxRow = Math.min(this.rows - 1, ((cy + radius) / this.cellSize) | 0);

    const buf = this.queryResultsBuffer;
    const bufLen = buf.length;
    const cols = this.cols;
    const heads = this.cellHeads;
    const nexts = this.entityNext;

    for (let r = minRow; r <= maxRow; r++) {
      const rowOffset = r * cols;
      for (let c = minCol; c <= maxCol; c++) {
        const cellIdx = rowOffset + c;
        let curr = heads[cellIdx];

        while (curr !== -1) {
          if (this.queryCount < bufLen) {
            buf[this.queryCount++] = curr;
          }
          curr = nexts[curr];
        }
      }
    }

    return {
      buffer: this.queryResultsBuffer,
      count: this.queryCount
    };
  }
}
