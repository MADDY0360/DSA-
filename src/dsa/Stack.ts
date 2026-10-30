/**
 * 5. STACK DATA STRUCTURE (LIFO - Last In, First Out)
 * Powers the Player Movement Undo feature.
 * Every checkpoint/building transition is pushed onto the stack;
 * pressing Undo (Z) pops the most recent state and rewinds the student.
 *
 * Time Complexity:
 * - push: O(1)
 * - pop: O(1)
 * - peek: O(1)
 */
export class Stack<T> {
  private items: T[] = [];
  private maxCapacity: number;

  constructor(maxCapacity: number = 50) {
    this.maxCapacity = maxCapacity;
  }

  public push(item: T): void {
    if (this.items.length >= this.maxCapacity) {
      this.items.shift(); // Prevent unbounded memory growth while preserving recent LIFO history
    }
    this.items.push(item);
  }

  public pop(): T | undefined {
    return this.items.pop();
  }

  public peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  public size(): number {
    return this.items.length;
  }

  public clear(): void {
    this.items = [];
  }

  /**
   * Returns copy from top-of-stack to bottom for UI visualization
   */
  public toTopDownArray(): T[] {
    return [...this.items].reverse();
  }
}
