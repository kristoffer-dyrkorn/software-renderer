# The first, basic rasterizer

In this section, we will _finally_ get to draw a triangle on the screen - using the method we have described in section 1, and the setup code from section 2.

## The application code

Let's get started. Take a look at this code:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3beb537f0a38efd3c03868c0f9d4805f4521af66/tutorial/3/index.js#L13-L23

Here, we create an array of vertex coordinates for three vertices in a triangle, define indices to those vertices, instantiate a `Triangle` object, define a triangle color by its red, green and blue values, and draw the triangle using the vertex coordinate array and the specified color.

This code relies on the same `Vector` class that we mentioned earlier. We use that for coordinates, colors and other numbers that need to be grouped together.

Note that we set the vertex indices in the constructor, and keep the vertex coordinates in an array by themselves. This way the vertices can be moved around on screen without impacting the basic property of a triangle - that it has three specific vertices. (We will return to this subject later when we will start animating our triangles.)

Also see that the vertices are specified in counterclockwise order, as mentioned in the first section.

## The triangle code

Let's have a look at the start of the triangle drawing method - ie the actual rasterizer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3beb537f0a38efd3c03868c0f9d4805f4521af66/tutorial/3/triangle.js#L22-L34

The first step is to read out the actual vertex coordinates from the array provided in the parameter, using the indices originally provided in triangle constructor. We name the three vertices `va`, `vb` and `vc`. They are three-dimensional `Vector`s, ie having x, y and z coordinates. (For now we assume all z coordinates are zero.)

We calculate the determinant value based on the three vertices. The value will be negative if the triangle has clockwise ordering, something which will happen if it is facing away from us. In that case, we do not draw the triangle. Also, we do not draw anything if the determinant is zero - which will happen if the triangle has zero area (this will happen if a flat triangle is rotated 90 degrees to its side in three-dimensional space).

The next step is to find the minimum and maximum coordinates for the vertices. These form the corner coordinates of the bounding box around the triangle. We also calculate the index in the pixel buffer that points to the pixel at the upper left corner of the bounding box, and the stride (change in index value) when going from one pixel in the buffer to the pixel directly below.

Then we define two `Vector`s, one to hold a variable `w` (that will be explained in the next paragraph) and one to hold the variable `p` which contains the x- and y-coordinates of the current candidate pixel.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/a7d72c0481f796fc774bee6c2019613997589b46/tutorial/3/triangle.js#L37-L51

The code that follow looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/a7d72c0481f796fc774bee6c2019613997589b46/tutorial/3/triangle.js#L53-L72

We are now at the heart of the rasterizer. We loop through all pixels inside the bounding box and calculate three different determinants, each of them based on two of the triangle vertices plus the current pixel.

We store the determinant values in a vector `w`. If all three `w` components are larger than - or equal to - zero, the pixel will belong to the triangle, and we write RGB and transparency values (as mentioned, the value 255 means "not transparent") to the specified offsets in the pixel buffer - before updating the offsets so they point to the right screen locations when traversing the two loops.

Now - the result looks like this:

And with that, we have our first, basic, rasterizer up and running!
