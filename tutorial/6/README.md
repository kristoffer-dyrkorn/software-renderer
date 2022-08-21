# A fast and correct triangle rasterizer

In this section, we will improve the smoothness of the animation.

So far, we have only used integer values when drawing things on screen. But, as we rotate our triangles, the new vertex coordinates will get non-integer values. We have - until now - rounded coordinates off to integers before sending them to the rasterizer. This means that all calculations inside the rasterizer are performed on shifted coordinate values. The result is that the triangles jump around as they rotate.

One way to improve this is to base the calculations in the rasterizer directly on the floating point values from the rotated vertices.

We still need to put pixels on the screen using integer coordinates, since that is the only way to address the screen buffer, but from now on we will do so without first shifting the coordinates. We will instead evalute candidate pixels in a different way. Let's have a look.

## The application code

In the application, the only change we will make is that we no longer round off the rotated vertex coordinates. The `rotate(angle)` function now looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/69c665e30005a3c41d353963e1cce56b45dac791/tutorial/6/index.js#L50-L63

## The triangle code

In the rasterizer, we now receive floating point coordinates. However, we would still like our bounding box to be defined by integer coordinates. That way it is easier to calculate the final screen coordinates for pixel drawing. So, depending on whether we look at max or min values, we use rounding up or down to expand the bounding box to the nearest integer coordinates.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L37-L40

Now comes the important part: We no longer use integer values when calculating the determinant values.

The vertex coordinates used to be integers, and refer to a location in a grid of discrete values, but now they represent a point within a continuous two-dimensional space. The edges between vertices will also belong in this continuous space.

How can ve convert this to integer coordinates for pixel drawing?

We can imagine putting a grid, with a spacing of 1 by 1, on top of the continuous vertex space. The grid lines follow the integer values in the continuous space, and the grid cells represent pixels. This means that pixel centers are now located at (integer + 0.5) coordinates, for both axes.

When we now draw a triangle, we loop through all integer coordinates inside the bounding box, and calculate the determinant value at pixel centers, ie at coordinates where we have added 0.5. So triangles will need to cover those locations for pixels to be drawn.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L53-L76

We choose to add (and not subtract) 0.5 so we don't have to deal with negative values for the left half of the leftmost pixel on screen. (See [this article](https://www.realtimerendering.com/blog/the-center-of-the-pixel-is-0-50-5/) for details.)

To summarize: We keep the input vertex coordinates as they are, and calculate a bounding box having integer coordinates and that covers the triangle. We then calculate the determinant at each (integer + 0.5) location, and use this result to decide whether to draw a pixel or not. The effect is that the placement of the vertex coordinates inside their pixel grid cell (ie, the fractional values) are kept in consideration for all determinant calculations along the triangle edges. This results in better choices being made on whether or not to draw a pixel along a given triangle edge.

Here is the result - two triangles in smooth rotation. This looks good!

But wait - there is something wrong here - there are singel-pixel gaps running up and down the edge between the triangles. The fill rule is correct and we do use floating point numbers (with double precision, even). What is wrong? Read all about it in the next section!
