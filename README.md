# software-renderer

A pure software renderer that displays OBJ files in your browser. Completely self-contained, has no dependencies. All code runs on the CPU and draws pixels to a buffer that is copied onto a canvas element.

## Example output

![](https://github.com/kristoffer-dyrkorn/software-renderer/blob/main/images/cessna.jpg)

## Why?

To explore how a rendering pipeline - and, especially, a rasterizer - looks like. Also, an experiment on how fast a CPU-based renderer can become.

## Features

This is implemented now:

- dragging and dropping of OBJ files to open and render them
- full transform pipeline (local, world, camera, clip and screen spaces)
- creation of vertex normals (if not present in the OBJ)
- backface culling
- z buffering, optimized for numerical precision
- flat, Gouraud and Lambert shading
- simple viewport clipping
- reasonably optimized code

To come:

- perspective correct texture mapping (almost done)
- even more optimized code

## Running

Go to the root directory of the project and start a web server, such as `python3 -m http.server`. Open a browser, go to `http://localhost:8000/src`. Drag and drop an OBJ file onto the browser window and you should se a 3D object spinning in your browser.

## License

MIT.
