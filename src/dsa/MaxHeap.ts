import { LeaderboardEntry } from '../types/game';

/**
 * 8. PRIORITY QUEUE / BINARY MAX-HEAP
 * Ranks players on the Campus Escape Leaderboard so the highest-scoring student
 * is always at the root (index 0) in O(1) time, with O(log n) insertion and extraction.
 */
export class LeaderboardMaxHeap {
  private heap: LeaderboardEntry[] = [];

  constructor(initialEntries: LeaderboardEntry[] = []) {
    for (const entry of initialEntries) {
      this.insert(entry);
    }
  }

  public insert(entry: LeaderboardEntry): void {
    this.heap.push(entry);
    this.heapifyUp(this.heap.length - 1);
  }

  public peekMax(): LeaderboardEntry | undefined {
    return this.heap[0];
  }

  public extractMax(): LeaderboardEntry | undefined {
    if (this.heap.length === 0) return undefined;
    const max = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    return max;
  }

  public size(): number {
    return this.heap.length;
  }

  /**
   * Returns raw binary heap array (level-order tree representation)
   */
  public getHeapArraySnapshot(): LeaderboardEntry[] {
    return [...this.heap];
  }

  /**
   * Extracts all elements in priority order without mutating the original heap
   */
  public extractAllRanked(): LeaderboardEntry[] {
    const clone = new LeaderboardMaxHeap(this.heap);
    const ranked: LeaderboardEntry[] = [];
    while (clone.size() > 0) {
      ranked.push(clone.extractMax()!);
    }
    return ranked;
  }

  private isHigherPriority(a: LeaderboardEntry, b: LeaderboardEntry): boolean {
    if (a.score !== b.score) {
      return a.score > b.score;
    }
    // Tie-breaker: faster completion time wins
    return a.completionTimeSec < b.completionTimeSec;
  }

  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.isHigherPriority(this.heap[parentIndex], this.heap[index])) {
        break;
      }
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private heapifyDown(index: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let largest = index;

      if (left < n && this.isHigherPriority(this.heap[left], this.heap[largest])) {
        largest = left;
      }
      if (right < n && this.isHigherPriority(this.heap[right], this.heap[largest])) {
        largest = right;
      }
      if (largest === index) break;

      [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
      index = largest;
    }
  }
}
