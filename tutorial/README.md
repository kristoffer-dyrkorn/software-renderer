# A fast and correct triangle rasterizer

We will first build a simple version to get to know the concepts. Then we will gradually refine the code - and you will get to know more details and the reasoning behind the changes in each step.

First, we set up the HTML for our page:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/35b8d4f4f435ff3b1a0970fafe0983cbe24cf18b/tutorial/1/index.html#L1-L8

We are going to render pixel to a `<canvas>` tag, and note that we specify pixelated rendering. The reason is that we - for now will work on a low resolution (anti-retina!) rendering so we can see details more clearly. This is how we specify resolution - similar to what is normal for high DPI rendering we set a custom `devicePixelRatio` and use that to set a lower resolution of the canvas although we keep the size at full screen width and height.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/b9838d4ed1d1c3173e927a024fa67030cc5c49a7/tutorial/1/index.js#L28-L33

This is how we get the buffer - an array of Uint8 / byte values (one byte for each of the red, green, blue and alpha channels) that we will write pixel values to.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/index.js#L35

This is what the main application does:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/index.js#L13-L23

In short, we set vertex coordinates for three vertices in a triangle (here, in the `<canvas>` coordinate system, positive `y` points down), define indices to those points, instantiate a `Triangle` object, define a color by its RGB values, and draw the triangle.

The code relies on a `Vector` class that we use for coordinates, colors and other numbers that need to be grouped together.

Note that we set the vertex indices in the constructor, and have a separate array for the vertex values themselves. This way the vertices can be modified without impacting the structure of the triangle. We will return to this later when we will start animating our triangles.

Also see that the vertices are specified in counterclockwise order. We rely heavily on this convention, see the next section. 

Let's have a look at the triangle drawing method - ie the actual triangle renderer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/triangle.js#L22-L34

The first step is to read out the actual coordinates (passed along in the parameter) using the indices that were previously provided in the constructor. We name the three vertices `va`, `vb` and `vc`. They are three-dimensional `Vector`s that have x, y and z coordinates. (For now we set all z coordinates to zero.)

We calculate what we call a determinant based on the three vertices. The determinant effectively is the z-coordinate of a cross product (a normal vector) defined by two of the triangle edges. The code looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/triangle.js#L12-L20

The edges must be specified in a consistent (here: counterclockwise) order, and if that is followed, the determinant will be negative if the triangle is clockwise - ie if it is back-facing - and zero if the triangle is orthogonal to the screen - ie has zero area. This is an effective way to skip drawing those triangles in a 3D object that will not be visible anyway. The technique is often called back-face culling. 

In fact, the determinant value is twice the area of the triangle, and we will use this value later on.

