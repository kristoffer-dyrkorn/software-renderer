# Let's go continuous!

In this section, we will improve the smoothness of the animation.

So far, we have only used integer values when drawing things on screen. But, as we rotate our triangles, the new vertex coordinates will get non-integer values. We have - until now - rounded coordinates off to integers before sending them to the rasterizer. This means that all calculations in the rasterizer will be performed on coordinate values that are slightly shifted around a bit. The shifts are small (less than one pixel) but will have random magnitude and direction, and the result is that the triangles will jump around a bit as they rotate.

One way to improve on the situation is to base the calculations in the rasterizer directly on floating point values coming from the rotated vertices.

We will still need to put pixels on the screen using integer coordinates, since that is the only way to address the screen buffer, but from now on we will do so without first rounding the vertex coordinates. We will instead evalute candidate pixels in a different way. Let's have a look.

## The application code

In the application, the only change we will make is that we don't round off the rotated vertex coordinates. The `rotate(angle)` function now looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/69c665e30005a3c41d353963e1cce56b45dac791/tutorial/6/index.js#L50-L63

## The triangle code

In the rasterizer, we now receive floating point coordinates. However, we would still like our bounding box to be defined by integer coordinates. That way it is easier to calculate and keep track of the final screen coordinates for pixel drawing.
We use rounding up or down (depending on whether we look at min or max values) to modify the bounding box so it at least covers the triangle, and expands out to the nearest integer coordinates.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L37-L40

Now comes the important part: We no longer use integer values when calculating the determinant values.

The vertex coordinates used to be integers, and refer to a location in a grid of discrete values, but now they represent a point within a continuous two-dimensional space. The edges between vertices also belong in this continuous space.

How can ve convert the edges in this space over to integer coordinates for pixel drawing?

We can imagine putting a grid, with a spacing of 1 by 1, on top of the continuous vertex space. The grid lines intersect the integer values in this continuous space, and the grid cells represent pixels. This means that pixel edges lie at integer coordinates, and that pixel centers are located at (integer) + 0.5 coordinate values, for both axes.

When we now draw a triangle, we loop through all coordinates inside our integer bounding box, and calculate the determinant value at pixel centers, ie at integer coordinates where we have added 0.5 along both axes. So the triangles will need to cover those points for a pixel to be drawn.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/9f51672b8e895df9a78725130e03d5471ba87b40/tutorial/6/triangle.js#L53-L76

The choice of adding (and not subtracting) 0.5 is made since then we don't have to deal with any negative coordinate values anywhere in our coordinate system. (If we subtracted 0.5, the left half of the leftmost pixels on screen would have a negative x coordinate). (See [this article](https://www.realtimerendering.com/blog/the-center-of-the-pixel-is-0-50-5/) for details.)

To summarize: We keep the input vertex coordinates as they are (floating point values), and calculate a slightly larger bounding box, having integer coordinates, that covers the triangle. We then calculate the determinant at each (integer) + 0.5 location, and use this result to decide whether to draw that pixel or not. The net effect is that the placement of the vertices inside their pixel grid cell (ie, the fractional values of the vertex coordinates) are kept in consideration in all of the determinant calculations along the triangle edges. The rasterizer will then reproduce the triangle (ie, as defined in the continuous coordinate space) on screen (ie, in our integer-based pixel grid) in a much more precise way.

Here is the result - the two triangles now rotate smoothly. This looks good!

But wait - there is something wrong here - there are singel-pixel gaps running up and down the edge between the triangles. The fill rule is correct and we do use floating point numbers (with double precision, even). What is wrong? Read all about it in the next section!
