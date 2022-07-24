# A fast and correct triangle rasterizer

In this section, we will draw a triangle on the screen - using the principles we have learned in section 1, and the setup code in section 2.

## The application code

Let's get started. Take a look at this code:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3beb537f0a38efd3c03868c0f9d4805f4521af66/tutorial/3/index.js#L13-L23

Here, we create an array of vertex coordinates for three vertices in a triangle, define indices to those vertices, instantiate a `Triangle` object, define a color by its RGB values, and draw the triangle using the vertex coordinate array and the color.

The code relies on a `Vector` class that we use for coordinates, colors and other numbers that need to be grouped together.

Note that we set the vertex indices in the constructor, and keep a separate array around for the vertex values themselves. This way the vertices can be moved around without impacting the overall definition of a triangle - that it consists of three vertices. We will return to this later when we will start animating our triangles.

Also see that the vertices are specified in counterclockwise order, as mentioned in the first section.

## The triangle code

Let's have a look at the start of the triangle drawing method - ie the actual rasterizer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3beb537f0a38efd3c03868c0f9d4805f4521af66/tutorial/3/triangle.js#L22-L34

The first step is to read out the actual coordinates (passed along in the parameter) using the indices that were previously provided in the constructor. We name the three vertices `va`, `vb` and `vc`. They are three-dimensional `Vector`s that have x, y and z coordinates. (For now all z coordinates are zero.)

We calculate the determinant value based on the three vertices. The value will be negative if the triangle is has clockwise ordering (something which will happen if it is back-facing). In that case, we don't draw anything. Also, we don't draw anything if the determinant is zero - which means that the triangle has zero area (something that might happen if a triangle is rotated 90 degrees to its side in three-dimensional space).

The next step is to find the minimum and maximum coordinates for the vertices - the corner coordinates for a bounding box around the triangle. We also calculate the offset in the pixel buffer for the upper left corner of the bounding box, and the stride (index change) when going from one pixel in the buffer to the pixel directly below.

Then we define two `Vector`s, one to hold a variable `w` (explained in the next section) and one `p` that holds the x- and y-coordinates of the current pixel.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3beb537f0a38efd3c03868c0f9d4805f4521af66/tutorial/3/triangle.js#L36-L51

The code that follow looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3beb537f0a38efd3c03868c0f9d4805f4521af66/tutorial/3/triangle.js#L53-L72

We are now at the heart of the rasterizer. We loop through all pixels inside the bounding box and calculate three different determinants - each of them based on two triangle vertices in turn, and the current pixel as the last vertex.

We store the determinant values in a vector `w`. If all three w components are larger than - or equal to - zero, the pixel will belong to the triangle, and we write RGB and transparency values (the value 255 means "not transparent") to the specified offsets in the pixel buffer - before updating the offsets for the next iterations of the two loops.

Now - the result looks like this:

And with that, we have our first, basic, rasterizer up and running!
