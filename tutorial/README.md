# A fast and correct triangle rasterizer

We will first build a simple version to get to know the concepts. Then we will gradually refine the code - and you will get to know more details and the reasoning behind the changes in each step.

First, we set up the HTML for our page:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/35b8d4f4f435ff3b1a0970fafe0983cbe24cf18b/tutorial/1/index.html#L1-L8

We are going to render pixel to a `<canvas>` tag, and note that we specify pixelated rendering in the CSS. The reason is that we - for now - will use low-resolution (anti-retina?) renderings so we can see details more clearly. Similar to what is normal for high DPI rendering we set a custom `devicePixelRatio` and use that to set the actual canvas resolution although the canvas element size is kept at the full width and height of the browser window.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/b9838d4ed1d1c3173e927a024fa67030cc5c49a7/tutorial/1/index.js#L28-L33

This is how we get the pixel buffer - an array of Uint8 / byte values (one byte for each of the red, green, blue and alpha channels) that we will write pixel values to.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/index.js#L35

This is what the main application does:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/index.js#L13-L23

In short, we set vertex coordinates for three vertices in a triangle (here, in the `<canvas>` coordinate system, the positive `y` axis points downwards), define indices to those points, instantiate a `Triangle` object, define a color by its RGB values, and draw the triangle using the vertex coordinate array and the color.

The code relies on a `Vector` class that we use for coordinates, colors and other numbers that need to be grouped together.

Note that we set the vertex indices in the constructor, and keep a separate array around for the vertex values themselves. This way the vertices can be moved around without impacting the structure of the triangle. We will return to this later when we will start animating our triangles.

Also see that the vertices are specified in counterclockwise order. We rely heavily on this convention, see the next section. 

Let's have a look at the start of the triangle drawing method - ie the actual rasterizer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/triangle.js#L22-L34

The first step is to read out the actual coordinates (passed along in the parameter) using the indices that were previously provided in the constructor. We name the three vertices `va`, `vb` and `vc`. They are three-dimensional `Vector`s that have x, y and z coordinates. (For now we set all z coordinates to zero.)

We calculate what we call a determinant based on the three vertices. The determinant effectively is the z-coordinate of a cross product (a normal vector) defined by two of the triangle edges. The code looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/triangle.js#L12-L20

The vertices for a triangle must be specified in a consistent (here: counterclockwise) order, and if that is followed, the determinant will be negative if the triangle is clockwise (which will happen if it is back-facing) and zero if the triangle is orthogonal to the screen (has zero area). The determinant value will always be twice the (signed) area of the triangle spanned out by two of the triangle edges, and we will reuse this property for other purposes later on.

Checking the determinant value is an effective way to skip drawing those triangles in a 3D object that will not be visible anyway. This technique is often called back-face culling. 

The next step is to find the minimum and maximum coordinates for the vertices - the corner coordinates for a bounding box around the triangle. We also calculate the offset in the pixel buffer for the upper left corner of the bounding box, and the stride (offset) from one pixel in the pixel buffer to the same pixel directly below.

Then we define two `Vector`s, one to hold a variable `w` (explained in the next section) and one `p` that holds the x- and y-coordinates of the current pixel.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/triangle.js#L36-L51

The code then looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/4f1408b2d6417f21e115d0cc514d098f1868fa51/tutorial/1/triangle.js#L53-L71

We are now at the heart of the rasterizer. The method here is to loop through all pixels inside the bounding box and calculate three different determinants -  based on each of two triangle vertices in turn, plus the current pixel in the bounding box as the third vertex.

The determinants will have positive values if the input vertices form a counterclockwise order. We use this property to check whether the current pixel is counterclockwise to *all* the edges in the triangle. If this is true (all three w components are larger than - or equal to - zero), the pixel will lie inside the triangle, and we write RGB and transparency values (the value 255 means "not transparent") to the specified offsets in the pixel buffer - before updating the offsets for the next iterations of the loops.

For now, we consider a determinant value of zero - ie the candidate pixel lies exactly *on* a triangle edge - to mean that the pixel belongs to the triangle.

The result looks like this:


And with that, we have our first, basic, rasterizer up and running.
