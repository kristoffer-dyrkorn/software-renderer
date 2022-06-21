import Vector from "./vector.js";
import Matrix from "./matrix.js";
import Triangle from "./triangle.js";

export default class Mesh {
  constructor(screenBuffer, zBuffer) {
    this.screenBuffer = screenBuffer;
    this.zBuffer = zBuffer;

    this.localTransform = new Matrix();
    this.worldTransform = new Matrix();

    this.indices = [];
    this.triangles = [];
    this.localVertexnormals = [];
    this.worldVertexnormals = [];
    this.textureCoordinates = [];

    this.coordinates = []; // raw/imported coordinates
    this.localCoordinates = []; // raw/imported coordinates after local transform
    this.worldCoordinates = [];
    this.cameraCoordinates = [];
    this.projectedCoordinates = [];
    this.clipCoordinates = [];
    this.screenCoordinates = [];
  }

  load(objData) {
    const obj = this.parseOBJ(objData);

    console.log("Vertices:", obj.vertices.length);
    console.log("Triangles:", obj.vertexindices.length);

    this.coordinates = obj.vertices.map((v) => new Vector(v[0], v[1], v[2]));
    this.textureCoordinates = obj.texturecoords.map((t) => new Vector(t[0], t[1], 0));

    // TODO: create local transform - to center object in local origo? scale?

    // if object did not contain normals, generate face and then vertex normals
    if (obj.vertexnormals.length === 0) {
      const generatedFaceNormals = obj.vertexindices.map((i, n) => {
        const a = this.coordinates[i[0]];
        const b = this.coordinates[i[1]];
        const c = this.coordinates[i[2]];

        // get a *non-normalized* normal vector, thus the vector length reflects the triangle area
        // this is used to weigh the face normals around a vertex - using the corresponding triangle's area
        const faceNormal = this.getNormal(a, b, c);

        // assign the face normal to this indices triple - ie this triangle
        obj.normalindices[n] = n;
        return faceNormal;
      });

      // initialize array of vertex normals with empty (0,0,0) values
      const generatedVertexNormals = Array.from({ length: this.coordinates.length }, (v) => new Vector());

      obj.vertexindices.forEach((i, n) => {
        // loop through all triangles, get the (non-normalized) face normal for that tri
        // and add that normal to the normal already present at each vertex
        const faceNormal = generatedFaceNormals[obj.normalindices[n]];
        generatedVertexNormals[i[0]].add(faceNormal);
        generatedVertexNormals[i[1]].add(faceNormal);
        generatedVertexNormals[i[2]].add(faceNormal);
      });

      this.localVertexnormals = generatedVertexNormals;

      // normalize the sum of the (weighed) face vectors
      this.localVertexnormals.forEach((n) => n.normalize());

      // vertices and normals are indexed equally, so just copy index array
      obj.normalindices = obj.vertexindices.slice();
    } else {
      // the object had normals, use them
      this.localVertexnormals = obj.vertexnormals.map((v) => new Vector(v[0], v[1], v[2]));
    }

    const defaultColor = new Vector(250, 250, 250);
    this.triangles = obj.vertexindices.map((i, n) => {
      return new Triangle(i, obj.normalindices[n], obj.textureindices[n], defaultColor);
    });

    this.localCoordinates = Array.from({ length: this.coordinates.length }, (v) => new Vector());
    this.worldCoordinates = Array.from({ length: this.coordinates.length }, (v) => new Vector());
    this.cameraCoordinates = Array.from({ length: this.coordinates.length }, (v) => new Vector());
    this.projectedCoordinates = Array.from({ length: this.coordinates.length }, (v) => new Vector());
    this.clipCoordinates = Array.from({ length: this.coordinates.length }, (v) => new Vector());
    this.screenCoordinates = Array.from({ length: this.coordinates.length }, (v) => new Vector());

    this.worldVertexnormals = Array.from({ length: this.coordinates.length }, (v) => new Vector());

    // run one local transform so local coordinate array is populated
    for (let i = 0; i < this.coordinates.length; i++) {
      this.localTransform.transform(this.coordinates[i], this.localCoordinates[i]);
    }

    // calculate and return bounding box
    const min = new Vector();
    const max = new Vector();
    min[0] = Infinity;
    min[1] = Infinity;
    min[2] = Infinity;
    max[0] = -Infinity;
    max[1] = -Infinity;
    max[2] = -Infinity;

    this.localCoordinates.forEach((c) => {
      if (c[0] < min[0]) min[0] = c[0];
      if (c[0] > max[0]) max[0] = c[0];
      if (c[1] < min[1]) min[1] = c[1];
      if (c[1] > max[1]) max[1] = c[1];
      if (c[2] < min[2]) min[2] = c[2];
      if (c[2] > max[2]) max[2] = c[2];
    });
    return { min, max };
  }

  getNormal(a, b, c) {
    const ab = new Vector(b);
    ab.sub(a);

    const ac = new Vector(c);
    ac.sub(a);

    const normal = new Vector();
    normal.cross(ab, ac);
    return normal;
  }

  parseOBJ(objData) {
    const vertices = [];
    const texturecoords = [];
    const vertexnormals = [];
    const vertexindices = [];
    const textureindices = [];
    const normalindices = [];
    objData.split(/\r?\n/).forEach((line) => {
      const lineTokens = line.split(" ");
      switch (lineTokens[0]) {
        case "v":
          // "+": cast a string to a number
          vertices.push([+lineTokens[1], +lineTokens[2], +lineTokens[3]]);
          break;
        case "vt":
          texturecoords.push([+lineTokens[1], +lineTokens[2]]);
          break;
        case "vn":
          vertexnormals.push([+lineTokens[1], +lineTokens[2], +lineTokens[3]]);
          break;
        case "f":
          const vertex = new Array(lineTokens.length - 1);
          const texturecoord = new Array(lineTokens.length - 1);
          const normal = new Array(lineTokens.length - 1);
          for (let i = 1; i < lineTokens.length; ++i) {
            const indices = lineTokens[i].split("/");
            vertex[i - 1] = indices[0] - 1; // vertex index
            texturecoord[i - 1] = indices[1] ? indices[1] - 1 : -1;
            normal[i - 1] = indices[2] ? indices[2] - 1 : -1;
          }
          vertexindices.push(vertex);
          if (texturecoord[0] !== -1) textureindices.push(texturecoord);
          if (normal[0] !== -1) normalindices.push(normal);
          break;
      }
    });
    return { vertices, texturecoords, vertexnormals, vertexindices, textureindices, normalindices };
  }

  setWorldPosition(v) {
    this.worldTransform.setPosition(v);
  }

  setLocalRotation(x, y, z) {
    this.localTransform.rotate(x, y, z);
  }

  project(camera) {
    // transform vertices
    for (let i = 0; i < this.coordinates.length; i++) {
      this.localTransform.transform(this.coordinates[i], this.localCoordinates[i]);
    }

    for (let i = 0; i < this.localCoordinates.length; i++) {
      this.worldTransform.transform(this.localCoordinates[i], this.worldCoordinates[i]);
    }

    const cameraMatrix = camera.getCameraMatrix();
    const projectionMatrix = camera.getProjectionMatrix();

    for (let i = 0; i < this.worldCoordinates.length; i++) {
      cameraMatrix.transform(this.worldCoordinates[i], this.cameraCoordinates[i]);
    }

    for (let i = 0; i < this.cameraCoordinates.length; i++) {
      projectionMatrix.transform(this.cameraCoordinates[i], this.projectedCoordinates[i]);
    }

    for (let i = 0; i < this.projectedCoordinates.length; i++) {
      this.projectedCoordinates[i].toClipSpace(this.clipCoordinates[i]);
    }

    for (let i = 0; i < this.clipCoordinates.length; i++) {
      this.clipCoordinates[i].toScreenSpace(camera.screenWidth / 2, camera.screenHeight / 2, this.screenCoordinates[i]);
    }

    // also transform normals, using local transform (for now)
    // TODO: calculate total transform (local * world) and apply that to the normals
    for (let i = 0; i < this.localVertexnormals.length; i++) {
      this.localTransform.transform(this.localVertexnormals[i], this.worldVertexnormals[i]);
    }
  }

  render() {
    // TODO Sort only front-facing tris
    // 1) calculate determinant and mark if front facing
    // 2) sort only the front facing ones
    // 3) draw (if front-facing)

    this.sort();
    this.triangles.forEach((t) =>
      t.draw(this.screenCoordinates, this.worldVertexnormals, this.textureCoordinates, this.screenBuffer, this.zBuffer)
    );
  }

  // insertion sort the triangles so we draw them front to back
  // the z-buffer handles visibility, but we would still like to avoid
  // drawing (and shading) the same pixel twice (ie drawing a pixel that
  // is later overdrawn by another, nearer pixel)
  //
  // insertion sort is chosen since it is fast on nearly sorted arrays,
  // which we will have here due to frame coherence
  sort() {
    let j, candidateTri, candidateZ, currentTri, currentZ;
    for (let i = 1; i < this.triangles.length; i++) {
      j = i - 1;
      candidateTri = this.triangles[i];
      candidateZ = -this.screenCoordinates[candidateTri.va][3];

      currentTri = this.triangles[j];
      currentZ = -this.screenCoordinates[currentTri.va][3];

      while (j >= 0 && currentZ < candidateZ) {
        Triangle.swaps++;
        this.triangles[j + 1] = this.triangles[j];
        currentTri = this.triangles[j];
        currentZ = -this.screenCoordinates[currentTri.va][3];
        j--;
      }
      this.triangles[j + 1] = candidateTri;
    }
  }
}
