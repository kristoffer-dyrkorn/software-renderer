import Matrix from "./matrix.js";
import Vector from "./vector.js";

const DEGREES_TO_RADIANS = Math.PI / 180;

export default class FixedPointVector extends Int32Array {
  constructor(x, y, z) {
    // homogeneous coordinates: x, y, z, w
    super(4);

    this[3] = FixedPointVector.ONE;

    if (arguments.length === 3) {
      this[0] = Math.round(x * FixedPointVector.MUL);
      this[1] = Math.round(y * FixedPointVector.MUL);
      this[2] = Math.round(z * FixedPointVector.MUL);
    }
    // copy constructor
    if (x instanceof FixedPointVector) {
      this[0] = x[0];
      this[1] = x[1];
      this[2] = x[2];
      this[3] = x[3];
    }
    // convert from Vector
    if (x instanceof Vector) {
      this[0] = Math.round(x[0] * FixedPointVector.MUL);
      this[1] = Math.round(x[1] * FixedPointVector.MUL);
      this[2] = Math.round(x[2] * FixedPointVector.MUL);
      this[3] = Math.round(x[3] * FixedPointVector.MUL);
    }
  }

  add(v) {
    this[0] += v[0];
    this[1] += v[1];
    this[2] += v[2];
  }

  sub(v) {
    this[0] -= v[0];
    this[1] -= v[1];
    this[2] -= v[2];
  }

  copy(v) {
    this[0] = v[0];
    this[1] = v[1];
    this[2] = v[2];
    this[3] = v[3];
  }
}

FixedPointVector.SHIFT = 4;
FixedPointVector.MUL = 2 ** FixedPointVector.SHIFT;
FixedPointVector.ONE = FixedPointVector.MUL;
FixedPointVector.ONE_HALF = FixedPointVector.ONE / 2;
