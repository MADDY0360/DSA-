export interface HashBucketEntry<V> {
  key: string;
  value: V;
}

/**
 * 7. HASH TABLE DATA STRUCTURE (Separate Chaining)
 * Stores player inventory items (ID Card, Assignment, Laptop, Gate Key, Masala Chai)
 * for O(1) average-case lookup when interacting with campus checkpoints.
 *
 * Exposes its internal bucket array and hash index calculation so students can
 * visually inspect collisions and O(1) key lookups in the Inventory screen!
 */
export class HashTable<V> {
  private buckets: Array<Array<HashBucketEntry<V>>>;
  private readonly bucketCount: number;
  private itemCount = 0;

  constructor(bucketCount: number = 8) {
    this.bucketCount = bucketCount;
    this.buckets = Array.from({ length: bucketCount }, () => []);
  }

  /**
   * Polynomial rolling hash function modulo bucketCount
   */
  public hash(key: string): number {
    let hashValue = 0;
    const prime = 31;
    const normalized = key.trim().toLowerCase();
    for (let i = 0; i < normalized.length; i++) {
      hashValue = (hashValue * prime + normalized.charCodeAt(i)) % this.bucketCount;
    }
    return Math.abs(hashValue);
  }

  public set(key: string, value: V): number {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const normalized = key.trim().toLowerCase();

    const existing = bucket.find((entry) => entry.key.trim().toLowerCase() === normalized);
    if (existing) {
      existing.value = value;
    } else {
      bucket.push({ key, value });
      this.itemCount++;
    }
    return index;
  }

  public get(key: string): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const normalized = key.trim().toLowerCase();
    const match = bucket.find((entry) => entry.key.trim().toLowerCase() === normalized);
    return match ? match.value : undefined;
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  public remove(key: string): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const normalized = key.trim().toLowerCase();
    const idx = bucket.findIndex((entry) => entry.key.trim().toLowerCase() === normalized);
    if (idx !== -1) {
      bucket.splice(idx, 1);
      this.itemCount--;
      return true;
    }
    return false;
  }

  public size(): number {
    return this.itemCount;
  }

  public clear(): void {
    this.buckets = Array.from({ length: this.bucketCount }, () => []);
    this.itemCount = 0;
  }

  public entries(): Array<HashBucketEntry<V>> {
    const all: Array<HashBucketEntry<V>> = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        all.push(entry);
      }
    }
    return all;
  }

  public getBucketsSnapshot(): Array<{
    bucketIndex: number;
    chain: Array<HashBucketEntry<V>>;
  }> {
    return this.buckets.map((chain, bucketIndex) => ({
      bucketIndex,
      chain: [...chain],
    }));
  }
}
