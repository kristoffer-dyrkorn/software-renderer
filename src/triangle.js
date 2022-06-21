import Mesh from "./mesh.js";
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

    this.color = defaultColor.slice();
    this.pixelColor = new Vector();

    // a light source at (inf, inf, inf), shining towards origo
    this.lightDirection = new Vector(-1, -1, -1);
    this.lightDirection.normalize();

    // w = edge distances - that are also converted to interpolation weights
    this.w = new Vector();

    // keep the normal vector in a separate variable.
    // assume flat shading, ie the normal is constant for the entire triangle.
    // smooth shading will later overwrite the value (with interpolated vertex normals)
    this.n = new Vector();
  }

  getDeterminant(a, b, c) {
    const ab = new Vector(b);
    ab.sub(a);

    const ac = new Vector(c);
    ac.sub(a);

    return ab[1] * ac[0] - ab[0] * ac[1];
  }

  draw(screenCoordinates, normalCoordinates, textureCoordinates, screenBuffer, zBuffer) {
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

    // create bounding box around triangle, expanding area out to integer coordinates
    let xmin = Math.trunc(Math.min(va[0], vb[0], vc[0]));
    let xmax = Math.ceil(Math.max(va[0], vb[0], vc[0]));
    let ymin = Math.trunc(Math.min(va[1], vb[1], vc[1]));
    let ymax = Math.ceil(Math.max(va[1], vb[1], vc[1]));

    // clip bounding box against viewport
    xmin = Math.max(xmin, 0);
    xmax = Math.min(xmax, screenBuffer.width);
    ymin = Math.max(ymin, 0);
    ymax = Math.min(ymax, screenBuffer.height);

    // do distance function sampling on pixel centers, not pixel corners
    const p = new Vector(xmin + 0.5, ymin + 0.5, 0);

    // set up distance functions (interpolation weights) along the left edge of the bounding rectangle.
    // values are kept un-normalized (ie not divided by determinant of full triangle) to retain precision.
    // [0] = distance from a to bc, [1] = from b to ca, [2] = from c to ab
    const wLeft = new Vector(
      this.getDeterminant(vb, vc, p),
      this.getDeterminant(vc, va, p),
      this.getDeterminant(va, vb, p)
    );

    // calculate per pixel / per line deltas for incremental evaluation of distance function
    const dwdx = new Vector(vb[1] - vc[1], vc[1] - va[1], va[1] - vb[1]);
    const dwdy = new Vector(vb[0] - vc[0], vc[0] - va[0], va[0] - vb[0]);

    // trick: after perspective transform, the z distance from camera to vertex
    // is stored in the w coordinate. (The clip space and screen space transforms don't change it.)
    // the sign reversal converts from a distance to a z coordinate (since the camera is placed in origo)

    // compute inverse z coordinates for each vertex, do linear interpolation using those values,
    // and compute inverse again when actual value is needed.
    // this gives perspective correct interpolation since 1/z is linear
    const zInverted = new Vector(1 / -va[3], 1 / -vb[3], 1 / -vc[3]);

    // pre-multiply by the normalization factor for interpolation weights, so that
    // this multiply is not needed when calculating actual values (would cost one multiply per pixel)
    zInverted.scale(invDeterminant);

    // use projected Z, range 1 (near plane) to 0 (far plane, at infinity)) for z buffer calculations
    // the Z range is defined by the projection matrix, and chosen to maximise numerical precision
    // see https://developer.nvidia.com/content/depth-precision-visualized
    const projectedZ = new Vector(va[2], vb[2], vc[2]);
    projectedZ.scale(invDeterminant);

    // texture x-coordinates for each vertex
    const sDivZ = new Vector(
      textureCoordinates[this.ta][0],
      textureCoordinates[this.tb][0],
      textureCoordinates[this.tc][0]
    );
    sDivZ.multiply(zInverted);

    // texture y-coordinates for each vertex
    const tDivZ = new Vector(
      textureCoordinates[this.ta][1],
      textureCoordinates[this.tb][1],
      textureCoordinates[this.tc][1]
    );
    tDivZ.multiply(zInverted);

    // x, y, z components of each vertex normal
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

    // keep the normal vector in a separate variable.
    // assume flat shading, ie the normal is constant for the entire triangle.
    // smooth shading will later overwrite the value (with interpolated vertex normals)
    this.n.copy(normalCoordinates[this.na]);

    // lambert light factor (cos N*-L)
    // assume flat shading, ie a constant factor for the entire triangle.
    // smooth shading will later overwrite the value (based on interpolated vertex normals)
    let nWeight = -this.n.dot(this.lightDirection);
    if (nWeight < 0) nWeight = 0;

    // keep the base color drawing color in a separate variable.
    this.pixelColor.copy(this.color);

    // change in raster buffer offsets from one line to next
    const stride = screenBuffer.width - (xmax - xmin);
    const imageStride = 4 * stride;

    for (let y = ymin; y < ymax; y++) {
      this.w.copy(wLeft);

      for (let x = xmin; x < xmax; x++) {
        if (this.w[0] > 0 && this.w[1] > 0 && this.w[2] > 0) {
          const zValue = projectedZ.dot(this.w);
          if (zValue > zBuffer[zBufferOffset]) {
            Triangle.pixelsDrawn++;

            if (zBuffer[zBufferOffset] > 0) Triangle.pixelsOverdrawn++;
            zBuffer[zBufferOffset] = zValue;

            // first: reset the base color - it was rescaled in the previous run
            this.pixelColor.copy(this.color);

            // interpolate the normal vector
            // since we normalize the normal vector before using it in the lighting calculation
            // we can skip the otherwise needed scaling of each component by z value.
            // thus, only the sign of z matters, which here always will be negative
            // since camera looks down negative z from origo
            this.n[0] = -nxDivZ.dot(this.w);
            this.n[1] = -nyDivZ.dot(this.w);
            this.n[2] = -nzDivZ.dot(this.w);
            this.n.normalize();
            nWeight = -this.n.dot(this.lightDirection);
            if (nWeight < 0) nWeight = 0;

            // linearly interpolate 1/z values for perspective correct results
            const interpolatedZInverted = zInverted.dot(this.w);
            const perspectiveZ = 1 / interpolatedZInverted;

            const tx = sDivZ.dot(this.w) * perspectiveZ;
            const ty = tDivZ.dot(this.w) * perspectiveZ;
            // pixelColor = textureImage[255 * tx + ty];

            // find final color based on normal
            this.pixelColor.scale(nWeight);

            buffer[imageOffset + 0] = this.pixelColor[0];
            buffer[imageOffset + 1] = this.pixelColor[1];
            buffer[imageOffset + 2] = this.pixelColor[2];
            buffer[imageOffset + 3] = 255;
          }
        }
        imageOffset += 4;
        zBufferOffset++;
        this.w.sub(dwdx);
      }
      imageOffset += imageStride;
      zBufferOffset += stride;
      wLeft.add(dwdy);
    }
  }
}

Triangle.swaps = 0;
Triangle.pixelsDrawn = 0;
Triangle.pixelsOverdrawn = 0;
Triangle.trianglesCulled = 0;
Triangle.trianglesDrawn = 0;
