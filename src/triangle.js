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

    // w = edge distances - that are also converted to interpolation weights
    this.w = new Vector();

    // keep the normal vector in a separate variable.
    // assume flat shading, ie the normal is constant for the entire triangle.
    // smooth shading will later overwrite the value (with interpolated vertex normals)
    this.n = new Vector();

    // distance function sample points
    this.p = new Vector();

    // distance functions (interpolation weights) along the left edge of the bounding rectangle
    this.wLeft = new Vector();
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

    // pre-store 1/determinant, to later replace divides by multiplication
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

    // set up distance functions (interpolation weights) along the left edge of the bounding rectangle.
    // values are kept un-normalized (ie not divided by determinant of full triangle) to retain precision.
    // so these values are barycentric coordinates (0..1), multiplied by the determinant of the full triangle.
    // wLeft[0] = distance from a to bc, wLeft[1] = from b to ca, wLeft[2] = from c to ab
    this.wLeft[0] = this.getDeterminant(vb, vc, this.p);
    this.wLeft[1] = this.getDeterminant(vc, va, this.p);
    this.wLeft[2] = this.getDeterminant(va, vb, this.p);

    // calculate per pixel / per line deltas for incremental evaluation of distance function
    const dwdx = new Vector(vb[1] - vc[1], vc[1] - va[1], va[1] - vb[1]);
    const dwdy = new Vector(vb[0] - vc[0], vc[0] - va[0], va[0] - vb[0]);

    //    this.wLeft.quantize(4);
    //    dwdx.quantize(4);
    //    dwdy.quantize(4);

    // trick: after perspective transform, the z distance from camera to vertex
    // is stored in the w coordinate. (The clip space and screen space transforms don't change it.)
    // we reverse the sign to convert from a distance to a coordinate (as the camera is placed in origo)

    // compute inverse z coordinates for each vertex, and do linear interpolation on the values,
    // and then compute inverse again (ie get the "actual value") when it is needed.
    // this way we get perspective correct z interpolation - since 1/z is linear.
    // perspective correct z values are needed for correct texture mapping.
    const zInverted = new Vector(1 / -va[3], 1 / -vb[3], 1 / -vc[3]);

    // pre-multiply inverted z values at the vertices by 1 / determinant
    // so that this multiply is not needed when calculating each interpolated 1/z value
    // (ie when we are dotting inverted z values from vertices with the weights, which are *scaled* barycentric coordinates)
    // thus we save one multiply per pixel
    zInverted.scale(invDeterminant);

    // use projected z values for each vertex for the z buffer calculations.
    // the projection matrix setup defines the z range, and the matrix values chosen there
    // maximise the numerical precision. the range of the projected z value is
    // 1 (near plane) to 0 (far plane, at infinity)
    // see https://developer.nvidia.com/content/depth-precision-visualized
    const projectedZ = new Vector(va[2], vb[2], vc[2]);

    // use projected z for z buffer calculations.
    // in the fill loop we use scaled barycentric weights (pre-multipled by determinant value)
    // so pre-multiply here by the inverse - so the resulting values are correct
    // TODO consider other ways of calculating z buffer values - skipping/shifting pre-multiplication,
    // or adding constants dxdz and dydz per pixel
    // TODO consider removing the scaling here, it should not be needed for the z buffer operation
    // and might reduce precision
    projectedZ.scale(invDeterminant);

    // texture x- and y-coordinates for each vertex, scaled by the corresponding inverse z value
    // and by texture size. the last scaling is to convert from uv range (0..1) to raster coordinate range
    const sDivZ = new Vector(
      textureCoordinates[this.ta][0],
      textureCoordinates[this.tb][0],
      textureCoordinates[this.tc][0]
    );
    sDivZ.multiply(zInverted);
    sDivZ.scale(255); // texture size of 256 pixels in x direction

    const tDivZ = new Vector(
      textureCoordinates[this.ta][1],
      textureCoordinates[this.tb][1],
      textureCoordinates[this.tc][1]
    );
    tDivZ.multiply(zInverted);
    tDivZ.scale(255); // texture size of 256 pixels in y direction

    // x, y, z components of each vertex normal, scaled by the corresponding inverse z value
    const nxDivZ = new Vector(
      normalCoordinates[this.na][0],
      normalCoordinates[this.nb][0],
      normalCoordinates[this.nc][0]
    );
    nxDivZ.multiply(zInverted);

    const nyDivZ = new Vector(
      normalCoordinates[this.na][1],
      normalCoordinates[this.nb][1],
      normalCoordinates[this.nc][1]
    );
    nyDivZ.multiply(zInverted);

    const nzDivZ = new Vector(
      normalCoordinates[this.na][2],
      normalCoordinates[this.nb][2],
      normalCoordinates[this.nc][2]
    );
    nzDivZ.multiply(zInverted);

    let zBufferOffset = ymin * screenBuffer.width + xmin;
    let imageOffset = zBufferOffset * 4;

    // stride: change in raster buffer offsets from one line to next
    const stride = screenBuffer.width - (xmax - xmin);
    const imageStride = 4 * stride;

    //    let nWeight = 0.7;
    let nWeight = -this.lightDirection.dot(normalCoordinates[this.na]);
    if (nWeight < 0) nWeight = 0;

    for (let y = ymin; y < ymax; y++) {
      this.w.copy(this.wLeft);

      // TODO Calculate pre-step (first triangle x) using deltas (see Delatin)
      // Also consider breaking x loop (detect we have been inside, but aren't anymore)

      for (let x = xmin; x < xmax; x++) {
        if (this.w[0] > 0 && this.w[1] > 0 && this.w[2] > 0) {
          const zValue = projectedZ.dot(this.w);
          if (zValue > zBuffer[zBufferOffset]) {
            Triangle.pixelsDrawn++;

            if (zBuffer[zBufferOffset] > 0) Triangle.pixelsOverdrawn++;
            zBuffer[zBufferOffset] = zValue;

            // interpolate the normal vector (based on vertex normals)
            // since we normalize the normal vector in the next step (before using it in the lighting calculation)
            // we can skip the otherwise needed scaling of each vector component by camera space z value
            // thus, only the sign (and not the magnitude) of z matters. the sign will always will be negative
            // since camera is placed in origo and looks down negative z, and the object is placed in negative z space
            //            this.n[0] = -nxDivZ.dot(this.w);
            //            this.n[1] = -nyDivZ.dot(this.w);
            //            this.n[2] = -nzDivZ.dot(this.w);
            //            this.n.normalize();
            // TODO find approximation to normal interpolation and subsequent normalizing

            //            nWeight = -this.n.dot(this.lightDirection);
            //            if (nWeight < 0) nWeight = 0;

            // get interpolated 1/z value (based on each of the vertex 1/z values) for this point in the triangle
            const interpolatedZInverted = zInverted.dot(this.w);
            // get perspective corrected z value - to use in uv interpolation
            const perspectiveZ = 1 / interpolatedZInverted;

            // calculate s/z and t/z values for this point in the triangle, using linear interpolation
            // then multiply by perspective correct z to get actual s and t values
            const s = sDivZ.dot(this.w) * perspectiveZ;
            const t = tDivZ.dot(this.w) * perspectiveZ;

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
        this.w.sub(dwdx);
      }
      imageOffset += imageStride;
      zBufferOffset += stride;
      this.wLeft.add(dwdy);
    }
  }
}

Triangle.swaps = 0;
Triangle.pixelsDrawn = 0;
Triangle.pixelsOverdrawn = 0;
Triangle.trianglesCulled = 0;
Triangle.trianglesDrawn = 0;
