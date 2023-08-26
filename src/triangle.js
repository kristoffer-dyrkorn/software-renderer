import Vector from "./vector.js";

export default class Triangle {
  constructor(vertexIndices, normalIndices, textureIndices, defaultColor) {
    this.va = vertexIndices[0];
    this.vb = vertexIndices[1];
    this.vc = vertexIndices[2];

    this.na = normalIndices[0];
    this.nb = normalIndices[1];
    this.nc = normalIndices[2];

    this.ta = textureIndices[0];
    this.tb = textureIndices[1];
    this.tc = textureIndices[2];

    this.pixelColor = new Vector(defaultColor);

    // a light source at (inf, inf, inf), shining towards origo
    this.lightDirection = new Vector(-1, -1, -1);
    this.lightDirection.normalize();

    // k = edge distances - that are also converted to interpolation weights
    this.k = new Vector();

    // keep the normal vector in a separate variable.
    // assume flat shading, ie the normal is constant for the entire triangle.
    // smooth shading will later overwrite the value (with interpolated vertex normals)
    this.n = new Vector();

    // distance function sample points
    this.p = new Vector();

    // distance functions (interpolation weights) along the left edge of the bounding rectangle
    this.kLeft = new Vector();
  }

  getDeterminant(a, b, c) {
    const ab = new Vector(b);
    ab.sub(a);

    const ac = new Vector(c);
    ac.sub(a);

    return ab[1] * ac[0] - ab[0] * ac[1];
  }

  draw(screenCoordinates, normalCoordinates, textureCoordinates, textureMap, screenBuffer, zBuffer) {
    const buffer = screenBuffer.data;

    // get screen coordinates for this triangle
    const va = screenCoordinates[this.va];
    const vb = screenCoordinates[this.vb];
    const vc = screenCoordinates[this.vc];

    const determinant = this.getDeterminant(va, vb, vc);
    // backface culling: only draw if determinant is positive
    // in that case, the triangle is ccw oriented - ie front-facing
    if (determinant <= 0) {
      Triangle.trianglesCulled++;
      return;
    }

    Triangle.trianglesDrawn++;

    // pre-store 1/determinant, to later replace divides by multiplications
    const invDeterminant = 1 / determinant;

    // create bounding box around triangle, expanding coordinates out to integer values
    let xmin = Math.trunc(Math.min(va[0], vb[0], vc[0]));
    let xmax = Math.ceil(Math.max(va[0], vb[0], vc[0]));
    let ymin = Math.trunc(Math.min(va[1], vb[1], vc[1]));
    let ymax = Math.ceil(Math.max(va[1], vb[1], vc[1]));

    // clip bounding box against viewport
    xmin = Math.max(xmin, 0);
    xmax = Math.min(xmax, screenBuffer.width);
    ymin = Math.max(ymin, 0);
    ymax = Math.min(ymax, screenBuffer.height);

    // skip triangle if bounding box is entirely outside the viewport
    if (xmax < 0 || xmin > screenBuffer.width || ymax < 0 || ymin > screenBuffer.height) {
      return;
    }

    // do distance function sampling on pixel centers, not pixel corners
    this.p[0] = xmin + 0.5;
    this.p[1] = ymin + 0.5;

    // set up distance functions (interpolation weights) to use when traversing along the left edge of the
    // bounding rectangle - which we do when filling the triangle.
    // values here are kept un-normalized (ie not divided by the determinant of full triangle) to retain precision.
    // ie, these values are barycentric coordinates (0..1), multiplied by the determinant of the full triangle.
    // kLeft[0] = distance from a to bc, kLeft[1] = from b to ca, kLeft[2] = from c to ab
    this.kLeft[0] = this.getDeterminant(vb, vc, this.p);
    this.kLeft[1] = this.getDeterminant(vc, va, this.p);
    this.kLeft[2] = this.getDeterminant(va, vb, this.p);

    // calculate per pixel / per line deltas for incremental evaluation of distance function
    const dkdx = new Vector(vb[1] - vc[1], vc[1] - va[1], va[1] - vb[1]);
    const dkdy = new Vector(vb[0] - vc[0], vc[0] - va[0], va[0] - vb[0]);

    // the w coordinate contains the distance (parallel to z axis / view direction) from
    // the camera to the vertex. (The clip and screen space transforms don't change it.)

    // compute 1/w for each vertex, to later 1) do linear interpolation on the 1/w values,
    // and 2) take the inverse at a given pixel - to get the "actual value" there when needed.
    // this is the way to get perspective correct *attribute* interpolation.
    const wInverted = new Vector(1 / va[3], 1 / vb[3], 1 / vc[3]);

    // pre-multiply the inverted w values at the vertices by 1 / determinant
    // so that this normalizing multiply is not needed after interpolating attribute values
    // since the interpolation weights k are already scaled with determinant value in the inner loop, this
    // premultiplication will compensate for it when the w's are multiplied by the weights
    wInverted.scale(invDeterminant);

    // use projected (perspective transformed) z values for each vertex for the z buffer calculations.
    // using linear interpolation of already-perspective-transformed z values is the correct way to get
    // *values to put in the z buffer*.
    // the projection matrix will define the z range, and the spesific matrix values chosen there now
    // maximise the numerical precision. the range of the projected z values are
    // 1 (near plane) to 0 (far plane, at infinity)
    // see https://developer.nvidia.com/content/depth-precision-visualized
    const projectedZ = new Vector(va[2], vb[2], vc[2]);

    // in the fill loop we use scaled barycentric weights (pre-multipled by the determinant value)
    // so pre-multiply here by 1 / determinant - so the resulting weighted values become correct
    projectedZ.scale(invDeterminant);

    // texture x- and y-coordinates for each vertex, scaled by the corresponding inverse w value
    // and by texture size. the last scaling is there to convert from uv range (0..1) to raster coordinate range
    const sDivW = new Vector(
      textureCoordinates[this.ta][0],
      textureCoordinates[this.tb][0],
      textureCoordinates[this.tc][0]
    );
    sDivW.multiply(wInverted);
    sDivW.scale(255); // texture size of 256 pixels in x direction

    const tDivW = new Vector(
      textureCoordinates[this.ta][1],
      textureCoordinates[this.tb][1],
      textureCoordinates[this.tc][1]
    );
    tDivW.multiply(wInverted);
    tDivW.scale(255); // texture size of 256 pixels in y direction

    // x, y, z components of each vertex normal, scaled by the corresponding inverse z value
    const nxDivW = new Vector(
      normalCoordinates[this.na][0],
      normalCoordinates[this.nb][0],
      normalCoordinates[this.nc][0]
    );
    nxDivW.multiply(wInverted);

    const nyDivW = new Vector(
      normalCoordinates[this.na][1],
      normalCoordinates[this.nb][1],
      normalCoordinates[this.nc][1]
    );
    nyDivW.multiply(wInverted);

    const nzDivW = new Vector(
      normalCoordinates[this.na][2],
      normalCoordinates[this.nb][2],
      normalCoordinates[this.nc][2]
    );
    nzDivW.multiply(wInverted);

    let zBufferOffset = ymin * screenBuffer.width + xmin;
    let imageOffset = zBufferOffset * 4;

    // stride: change in raster buffer offsets from one line to next
    const stride = screenBuffer.width - (xmax - xmin);
    const imageStride = 4 * stride;

    //    let nWeight = 0.7;
    let nWeight = -this.lightDirection.dot(normalCoordinates[this.na]);
    if (nWeight < 0) nWeight = 0;

    for (let y = ymin; y < ymax; y++) {
      this.k.copy(this.kLeft);
      for (let x = xmin; x < xmax; x++) {
        if (this.k[0] > 0 && this.k[1] > 0 && this.k[2] > 0) {
          // the z buffer contains linearly interpolated *projected* z values
          const perspectiveZ = projectedZ.dot(this.k);
          if (perspectiveZ > zBuffer[zBufferOffset]) {
            Triangle.pixelsDrawn++;

            if (zBuffer[zBufferOffset] > 0) Triangle.pixelsOverdrawn++;
            zBuffer[zBufferOffset] = perspectiveZ;

            // interpolate the normal vector (based on vertex normals)
            // since we normalize the normal vector in the next step (before using it in the lighting calculation)
            // we can skip the otherwise needed scaling of each vector component by camera space z value
            // thus, only the sign (and not the magnitude) of z matters. the sign will always will be negative
            // since camera is placed in origo and looks down negative z, and the object is placed in negative z space
            //            this.n[0] = -nxDivW.dot(this.k);
            //            this.n[1] = -nyDivW.dot(this.k);
            //            this.n[2] = -nzDivW.dot(this.k);
            //            this.n.normalize();
            // TODO find approximation to normal interpolation and subsequent normalizing

            //            nWeight = -this.n.dot(this.lightDirection);
            //            if (nWeight < 0) nWeight = 0;

            // while, vertex attributes are calculated by interpolating 1/w

            // get interpolated 1/w value (based on each of the vertex 1/w values) for this point in the triangle
            const interpolatedWInverted = wInverted.dot(this.k);
            // get actual w value - to use in uv interpolation
            const interpolatedW = 1 / interpolatedWInverted;

            // calculate s/w and t/w values for this point inside the triangle, by
            // linearly interpolating the corner attribute values (using barycentric weights)
            // and then multiplying by the interpolated w - to get to actual s and t values
            const s = sDivW.dot(this.k) * interpolatedW;
            const t = tDivW.dot(this.k) * interpolatedW;

            const tx = Math.trunc(s);
            const ty = Math.trunc(t);
            const index = 3 * ((ty << 8) + tx);

            buffer[imageOffset + 0] = textureMap[index] * nWeight;
            buffer[imageOffset + 1] = textureMap[index + 1] * nWeight;
            buffer[imageOffset + 2] = textureMap[index + 2] * nWeight;
            buffer[imageOffset + 3] = 255;
          }
        }
        imageOffset += 4;
        zBufferOffset++;
        this.k.sub(dkdx);
      }
      imageOffset += imageStride;
      zBufferOffset += stride;
      this.kLeft.add(dkdy);
    }
  }
}

Triangle.swaps = 0;
Triangle.pixelsDrawn = 0;
Triangle.pixelsOverdrawn = 0;
Triangle.trianglesCulled = 0;
Triangle.trianglesDrawn = 0;
