export class CountMap<K> {
  private map = new Map<K, number>();

  increment(key: K): void {
    this.map.set(key, (this.map.get(key) ?? 0) + 1);
  }

  decrement(key: K): void {
    const current = this.map.get(key);
    if (current !== undefined) {
      if (current === 1) {
        this.map.delete(key);
      } else {
        this.map.set(key, current - 1);
      }
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }
}
