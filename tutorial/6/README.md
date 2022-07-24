# A fast and correct triangle rasterizer

In this section, we will improve the smoothness of the animation - we will go from integer to floating point coordinates!

## The application code

In the application, the only change we will make is that we no longer round off the coordinades after they have been rotated. The `rotate(angle)` function now looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/69c665e30005a3c41d353963e1cce56b45dac791/tutorial/6/index.js#L50-L63

## The triangle code

In the rasterizer, we now convert the incoming floating point coordinates to integers when we calculate the bounding box. We do this by either rounding up or down, depending on whether we want a minimum or maximum value. This way we ensure that the bounding box will have integer coordinates - ie get correct pixel coordinates while still covering the entire triangle.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L37-L40

At the same time, we no longer evaluate the candidate pixels at integer coordinates.

The reason is that the vertex coordinates now are continuous - and we need to find a mapping between the continuous input values and the discrete output values (pixel coordinates) when calculating determinants. We no longer consider a pixel to be a box in a grid, we now consider it to be a rectangle placed in a continuous coordinate system, and having an area of 1 by 1 units. So, to evaluate whether the pixel is inside or outside a triangle edge we evaluate whether the pixel center is inside or outside.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L53-L76

The choice of adding 0.5 (instead of subtracting) is made to avoid having to deal with negative values for the left half of the leftmost pixel. (See [this article](https://www.realtimerendering.com/blog/the-center-of-the-pixel-is-0-50-5/) for more info.)

The rest of the code stays the same. Note that although the bounding box has integer coordinates, we kept the vertex coordinates as they were when sending them to the determinant function. This is what gives the smoother rotation: The determinant now considers edge distances with much higher precision.

Here is the result - two triangles in smooth rotation. This looks good!

But wait - there are gaps between the triangles. What is going on? Read all about it in the next section!
