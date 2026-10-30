/**
 * 6. QUEUE DATA STRUCTURE (FIFO - First In, First Out)
 * Stores sequential campus missions in order (Mission 1 -> Mission 6)
 * and also serves as the frontier queue inside Breadth-First Search (BFS).
 *
 * Uses a head-pointer offset for O(1) amortized dequeue without O(n) array shifting.
 */
export class Queue<T> {
  private storage: Record<number, T> = {};
  private head = 0;
  private tail = 0;

  public enqueue(item: T): void {
    this.storage[this.tail] = item;
    this.tail++;
  }

  public dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.storage[this.head];
    delete this.storage[this.head];
    this.head++;
    return item;
  }

  public front(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.storage[this.head];
  }

  public isEmpty(): boolean {
    return this.tail - this.head === 0;
  }

  public size(): number {
    return this.tail - this.head;
  }

  public clear(): void {
    this.storage = {};
    this.head = 0;
    this.tail = 0;
  }

  public toArray(): T[] {
    const result: T[] = [];
    for (let i = this.head; i < this.tail; i++) {
      result.push(this.storage[i]);
    }
    return result;
  }
}
