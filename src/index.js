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
const { min, max } = await mesh.load("/cessna.obj");

let xrot = 0.3;
mesh.setLocalRotation(20, 0, 0);

const center = new Vector(min);
center.add(max);
center.scale(0.5);

const extents = new Vector(max);
extents.sub(center);
const radius = extents.length();

const fov = 60;

const cameraPos = new Vector(0, 0, 2 * radius);

const near = cameraPos[2] - max[2];
const far = cameraPos[2] - min[2];

const camera = new Camera(fov, near, far, canvas);
camera.setPosition(cameraPos);

resize();

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

window.addEventListener("resize", resize);

function resize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  camera.setViewPort(canvas);

  draw();
}
