import { pipe } from 'fp-ts/function';
import { IO } from 'fp-ts/IO';
import { io } from 'fp-ts';

function recursive1(value: number): IO<number> {
  if (value === 1) {
    return io.of(1);
  } else {
    return recursive1(value - 1);
  }
}

function recursive2(value: number): IO<number> {
  return io.flatten(() => {
    if (value === 1) {
      return io.of(1);
    } else {
      return recursive2(value - 1);
    }
  });
}

function recursive3(value: number): IO<number> {
  return pipe(
    io.of(value),
    io.chain(value => value === 1 ? io.of(1) : recursive3(value - 1)),
  );
}

console.log(recursive3(1e6)());
