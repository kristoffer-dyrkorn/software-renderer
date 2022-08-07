# A fast and correct triangle rasterizer

In this section, we will improve the smoothness of the animation.

So far, we have used only integer values when drawing things on screen. Rotating vertices will produce floating-point results, but we have rounded off everything to integer values before drawing our triangles. This means that we move vertices to the center of their nearest pixel. This also shifts the triangle edges, and the result is triangles that jump around as they rotate.

One way to improve this is to introduce floating point values in our calculations. We still need to put pixels on the screen using integer coordinates (since that is the only coordinate type the screen buffer accepts), but we can do this without snapping vertices. That way the the vertex locations sent to the rasterizer are kept unmodified.

## The application code

In the application, the only change we will make is that we no longer round off the rotated vertex coordinates. The `rotate(angle)` function now looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/69c665e30005a3c41d353963e1cce56b45dac791/tutorial/6/index.js#L50-L63

## The triangle code

In the rasterizer, we now receive floating point coordinates. However, the bounding box for the triangle must still be defined in integer coordinates, since that is what we base the pixel selection on. So we convert the incoming coordinates to integers by rounding off values, carefully choosing whether to round up or down. The point is to ensure that we end up with a bounding box having integer coordinates that enclose the entire triangle.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L37-L40

And now comes the important part: We no longer use integer values when calculating determinant values.

The reason is that we now must treat the vertex coordinates - and thereby the coordinates along the edges - as continuous values. The vertex coordinates no longer refer to a location in a grid of integer values, instead the represent an idealized point in a continuous coordinate system. We still need to find out which pixels to draw on the screen, so we will have to somehow map the continuous vertex coordinates onto integer values that can be used as screen coordinates.

The most common convention in computer graphics is to assume that a pixel covers a 1.0 by 1.0 area, and that pixel centers are placed at values n + 0.5, for integer n. Then, to find out whether a pixel is inside or outside a triangle, we loop through the bounding box integer values, and evaluate whether the pixel center (0.5 off the bounding box coordinate, along both axes) is inside or outside.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L53-L76

We choose to add 0.5 (and not subtract) so we don't have to deal with negative values for the left half of the leftmost pixel on screen. (See [this article](https://www.realtimerendering.com/blog/the-center-of-the-pixel-is-0-50-5/) for details.)

Put differently, we keep the vertex coordinates at their floating point resolution, calculate a bounding box around the triangle, and perform point sampling of the triangle at regular intervals - while still using floating point resolution. The sample results are determinant values, and this way we know which pixels to draw.

Here is the result - two triangles in smooth rotation. This looks good!

But wait - there is something wrong here - there is a singel-pixel gap that runs up and down the edge between the triangles. The fill rule is correct and we use floating point numbers - with double precision, even. What is wrong? Read all about it in the next section!
