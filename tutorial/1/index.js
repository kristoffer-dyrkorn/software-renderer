import Vector from "../lib/vector.js";
import Triangle from "./triangle.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let screenBuffer;

window.addEventListener("resize", resize);

resize();

const vertexIndices = [0, 1, 2];
const triangle = new Triangle(vertexIndices, screenBuffer);

const v0 = new Vector(140, 100, 0);
const v1 = new Vector(140, 40, 0);
const v2 = new Vector(80, 40, 0);

const vertices = [v0, v1, v2];
const color = new Vector(120, 240, 100);

triangle.draw(vertices, color);

ctx.putImageData(screenBuffer, 0, 0);

function resize() {
  const devicePixelRatio = 0.2;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  screenBuffer = ctx.createImageData(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
}
