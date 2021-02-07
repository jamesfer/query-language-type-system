export class StateRecorder<T> {
  values: T[] = [];

  push(value: T) {
    this.values.push(value);
  }

  pushAll(values: T[]) {
    values.forEach((value) => {
      this.push(value);
    });
  }
}
