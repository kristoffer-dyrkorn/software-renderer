import Matrix from "./matrix.js";

export default class Engine {
  constructor(model, camera, viewportSize) {
    this.model = model;
    this.camera = camera;
    this.viewportSize = viewportSize;
  }

  transform() {
    const transformMatrix = new Matrix(camera.getTransformMatrix());

    this.model.transform(transformMatrix);
  }
}
