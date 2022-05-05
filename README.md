# software-renderer
A software renderer that displays OBJ files in your browser. No GPU needed, everything is CPU based.

# why?
To explore how a rendering pipeline - and, especially, a modern rasterizer - looks like.

# features
Supports flat, Gouraud and Phong shading. Perspective correct texture mapping is almost done.
The code is somewhat optimized - there are still many tricks on the TODO list.

# running
Go to the root directory of the project and start a web server, such as `python3 -m http.server`. Open a browser, go to `http://localhost:8000/src` and you should se a 3D object spinning in your browser.

# license
MIT.
