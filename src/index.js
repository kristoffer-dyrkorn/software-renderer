import Camera from "./camera.js";
import Mesh from "./mesh.js";
import Vector from "./vector.js";
import Triangle from "./triangle.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screenBuffer = ctx.createImageData(
  window.innerWidth * window.devicePixelRatio,
  window.innerHeight * window.devicePixelRatio
);
const zBuffer = new Float32Array(
  window.innerWidth * window.innerHeight * window.devicePixelRatio * window.devicePixelRatio
);

let frameCounter = 0,
  prevFrameCounter = 0;
let timeStamp = Date.now();

const mesh = new Mesh(screenBuffer, zBuffer);
mesh.setLocalRotation(20, 0, 0);

let xrot = 0.3;
let camera;

async function setupModelAndCamera(objData) {
  const { min, max } = mesh.load(objData);

  const center = new Vector(min);
  center.add(max);
  center.scale(0.5);

  const extents = new Vector(max);
  extents.sub(center);
  const radius = extents.length();

  const cameraPos = new Vector(0, 0, 2 * radius);

  const near = cameraPos[2] - max[2];
  const far = cameraPos[2] - min[2];

  camera = new Camera(60, near, far, canvas);
  camera.setPosition(cameraPos);

  window.addEventListener("resize", resize);

  resize();
  draw();
}

function draw() {
  requestAnimationFrame(draw);

  screenBuffer.data.fill(0);
  zBuffer.fill(0);

  mesh.setLocalRotation(0, xrot, 0);
  //  xrot++;
  mesh.project(camera);
  mesh.render();

  // print stats about every two seconds
  if (frameCounter % 120 === 0) {
    console.log("Triangles, culled / drawn per frame", Triangle.trianglesCulled / 120, Triangle.trianglesDrawn / 120);
    console.log("Pixels, drawn / overdrawn per frame", Triangle.pixelsDrawn / 120, Triangle.pixelsOverdrawn / 120);
    console.log("Swaps", Triangle.swaps / 120);
    console.log("Fps", (1000 * (frameCounter - prevFrameCounter)) / (Date.now() - timeStamp));
    timeStamp = Date.now();
    prevFrameCounter = frameCounter;
    Triangle.swaps = 0;
    Triangle.pixelsDrawn = 0;
    Triangle.pixelsOverdrawn = 0;
    Triangle.trianglesCulled = 0;
    Triangle.trianglesDrawn = 0;
  }
  frameCounter++;

  ctx.putImageData(screenBuffer, 0, 0);
}

function resize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  camera.setViewPort(canvas);
}

document.getElementById("dropzone").addEventListener("drop", dropHandler, false);
document.getElementById("dropzone").addEventListener("dragover", dragOverHandler, false);

function dropHandler(e) {
  e.preventDefault();

  const reader = new FileReader();
  reader.addEventListener("load", () => setupModelAndCamera(reader.result), false);

  const file = e.dataTransfer.items[0].getAsFile();
  reader.readAsText(file);

  return false;
}

function dragOverHandler(e) {
  e.preventDefault();
}
