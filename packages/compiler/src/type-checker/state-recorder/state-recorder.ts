export class StateRecorder<T> {
  values: T[] = [];

  push(value: T): void {
    this.values.push(value);
  }

  pushAll(values: T[]): void {
    values.forEach((value) => {
      this.push(value);
    });
  }

  clear() {
    this.values = [];
  }
}
