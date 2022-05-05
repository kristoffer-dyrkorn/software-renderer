import Vector from "./vector.js";
import Matrix from "./matrix.js";

const DEGREES_TO_RADIANS = Math.PI / 180;

export default class Camera {
  constructor(fovy, near, far, canvas) {
    this.fovy = fovy;
    this.near = near;
    this.far = far;
    this.setViewPort(canvas);

    this.viewMatrix = new Matrix(); // location and orientation of the camera
    this.cameraMatrix = new Matrix(); // inverse view matrix, aka camera matrix
    this.projectionMatrix = new Matrix(); // perspective projection & screen aspect ratios
    this.transformMatrix = new Matrix(); // final transform: premultiplied projection matrix and inverse view matrix

    this.viewIsChanged = true;
    this.projectionIsChanged = true;
  }

  setPosition(v) {
    this.viewMatrix.setPosition(v);
    this.viewIsChanged = true;
  }

  getPosition() {
    return this.viewMatrix.getPosition();
  }

  getDirection() {
    return this.viewMatrix.getDirection();
  }

  moveForward(dist) {
    this.viewMatrix.moveForward(dist);
    this.viewIsChanged = true;
  }

  rotateX(angle) {
    this.viewMatrix.rotateX(angle);
    this.viewIsChanged = true;
  }

  rotateY(angle) {
    this.viewMatrix.rotateY(angle);
    this.viewIsChanged = true;
  }

  rotateZ(angle) {
    this.viewMatrix.rotateZ(angle);
    this.viewIsChanged = true;
  }

  setViewPort(canvas) {
    this.screenWidth = canvas.width;
    this.screenHeight = canvas.height;
    this.projectionIsChanged = true;
  }

  updateProjectionMatrix() {
    // set up a projection matrix where the far plane (here: infinity) maps to 0
    // and the near plane maps to 1
    // https://dev.theomader.com/depth-precision/
    const aspect = this.screenWidth / this.screenHeight;
    const f = 1.0 / Math.tan((this.fovy * DEGREES_TO_RADIANS) / 2);
    this.projectionMatrix[0] = f / aspect;
    this.projectionMatrix[5] = f;
    this.projectionMatrix[10] = 0;
    this.projectionMatrix[11] = -1;
    this.projectionMatrix[14] = this.near;
    this.projectionMatrix[15] = 0;
  }

  getProjectionMatrix() {
    if (this.projectionIsChanged) {
      this.updateProjectionMatrix();
    }

    return this.projectionMatrix;
  }

  // reads viewMatrix, inverts it (in an optimized way)
  // and stores the result in cameraMatrix
  updateCameraMatrix() {
    // inverse the position part
    const x = this.viewMatrix.getXAxis();
    const y = this.viewMatrix.getYAxis();
    const z = this.viewMatrix.getZAxis();
    const p = this.viewMatrix.getPosition();

    this.cameraMatrix.setXAxis(x);
    this.cameraMatrix.setYAxis(y);
    this.cameraMatrix.setZAxis(z);
    const position = new Vector(-x.dot(p), -y.dot(p), -z.dot(p));
    this.cameraMatrix.setPosition(position);

    // inverse the rotation part
    // trick: in a 3x3 orthogonal matrix, inverse = transpose
    this.cameraMatrix.transposeRotation();
  }

  getCameraMatrix() {
    if (this.viewIsChanged) {
      this.updateCameraMatrix();
    }

    return this.cameraMatrix;
  }
}
