import Matrix from "./matrix.js";

const DEGREES_TO_RADIANS = Math.PI / 180;

export default class Vector extends Float32Array {
  constructor(x, y, z) {
    // homogeneous coordinates: x, y, z, w
    super(4);
    this[3] = 1;

    if (arguments.length === 3) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
    }
    // x is a matrix, y is start index
    if (x instanceof Matrix) {
      this[0] = x[y + 0];
      this[1] = x[y + 1];
      this[2] = x[y + 2];
    }
    // copy constructor
    if (x instanceof Vector) {
      this[0] = x[0];
      this[1] = x[1];
      this[2] = x[2];
      this[3] = x[3];
    }
  }

  // incremental rotation of an arbitrary axis system
  // input: this, toVector and perpendicularVector (the three axes, all orthogonal unit vectors)
  // result: rotates this vector towards the toVector, around perpendicularVector, and updates toVector
  rotate(toVector, perpendicularVector, angle) {
    this.scale(Math.cos(angle * DEGREES_TO_RADIANS));
    toVector.scale(Math.sin(angle * DEGREES_TO_RADIANS));
    this.add(toVector);
    this.normalize();
    toVector.cross(perpendicularVector, this);
  }

  cross(a, b) {
    this[0] = a[1] * b[2] - a[2] * b[1];
    this[1] = a[2] * b[0] - a[0] * b[2];
    this[2] = a[0] * b[1] - a[1] * b[0];
  }

  dot(v) {
    return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
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

  scale(s) {
    this[0] *= s;
    this[1] *= s;
    this[2] *= s;
  }

  // component-wise multiplication
  multiply(s) {
    this[0] *= s[0];
    this[1] *= s[1];
    this[2] *= s[2];
  }

  copy(v) {
    this[0] = v[0];
    this[1] = v[1];
    this[2] = v[2];
    this[3] = v[3];
  }

  length() {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
  }

  normalize() {
    this.scale(1.0 / this.length());
  }

  approxNormalize() {
    const s = this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
    const m = 0.125 * (9 - s);
    this.scale(m);
  }

  toClipSpace(out) {
    out.copy(this);
    const inverseW = 1 / this[3];
    out.scale(inverseW);
  }

  toScreenSpace(halfWidth, halfHeight, out) {
    out.copy(this);
    out[0] = halfWidth * (out[0] + 1);
    out[1] = halfHeight * (-out[1] + 1);
  }
}
