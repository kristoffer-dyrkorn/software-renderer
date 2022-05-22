# software-renderer

A pure software renderer that displays OBJ files in your browser. Completely self-contained, has no dependencies. All computations run on the CPU.

## Example output

![](https://github.com/kristoffer-dyrkorn/software-renderer/blob/main/images/cessna.jpg)

## Why?

To explore how a rendering pipeline - and, especially, a modern rasterizer - looks like. Also, an experiment on how fast a CPU-based renderer can become.

## Features

This is implemented now:

- drag and drop OBJ files to render them
- full transform pipeline
- will generate vertex normals if not present in the OBJ
- backface culling
- z buffering, optimized for numerical precision
- flat, Gouraud and Phong shading
- simple viewport clipping
- reasonably optimized code

To come:

- perspective correct texture mapping (almost done)
- even more optimized code

## Running

Go to the root directory of the project and start a web server, such as `python3 -m http.server`. Open a browser, go to `http://localhost:8000/src`. Drag and drop an OBJ file onto the browser window and you should se a 3D object spinning in your browser.

## License

MIT.
