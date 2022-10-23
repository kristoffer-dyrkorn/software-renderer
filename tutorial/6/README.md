# Let's go continuous!

In this section, we will improve the smoothness of the animation.

So far, we have only used integer values when drawing things on screen. But, as we rotate our triangles, the new vertex coordinates will get non-integer values. We have - until now - rounded coordinates off to integers before sending them to the rasterizer. This means that all calculations in the rasterizer will be performed on coordinate values that are slightly shifted around a bit. The shifts are small (less than one pixel) but will have random magnitude and direction, and the result is that the triangles will jump around a bit as they rotate.

One way to improve on the situation is to base the calculations in the rasterizer directly on floating point values coming from the rotated vertices.

We will still need to put pixels on the screen using integer coordinates, since that is the only way to address the screen buffer, but from now on we will do so without first rounding the vertex coordinates.

The effect can be illustrated by looking at line drawing - and what happens if one of the line end points (here marked with red dots) stays fixed while the other is slowly moving downwards inside a single pixel.

![](images/6-rounding effect.png)

When using discrete coordinates, the rounding will move the end point to the the pixel centre - so the line will look the same in all three cases. But, when using continuous coordinates, the position of the moving endpoint will have an influence on how the line is drawn.

So, we will now evalute triangle candidate pixels in a different way than before. Let's have a closer look.

## The application code

In the application, the only change we will make is that we don't round off the rotated vertex coordinates. The `rotate(angle)` function now looks like this:

```JavaScript
function rotate(angle) {
    const DEG_TO_RAD = Math.PI / 180;

    for (let i = 0; i < 4; i++) {
        const v = new Vector(vertices[i]);
        v.sub(center);

        const r = rotatedVertices[i];
        r[0] = v[0] * Math.cos(angle * DEG_TO_RAD) - v[1] * Math.sin(angle * DEG_TO_RAD);
        r[1] = v[0] * Math.sin(angle * DEG_TO_RAD) + v[1] * Math.cos(angle * DEG_TO_RAD);

        r.add(center);
    }
}
```

## The triangle code

In the rasterizer, we now receive floating point coordinates. However, we would still like our bounding box to be defined by integer coordinates. We still loop over pixel coordinates (integer values) when we check whether pixels should be drawn or not. So we want an easy way to calculate and keep track of the final screen coordinates for the pixels we are going to draw.

We use rounding up or down (depending on whether we look at min or max values) to modify the bounding box so it at least covers the triangle, and expands out to the nearest integer coordinates.

```JavaScript
let xmin = Math.floor(Math.min(va[0], vb[0], vc[0]));
let xmax = Math.ceil(Math.max(va[0], vb[0], vc[0]));
let ymin = Math.floor(Math.min(va[1], vb[1], vc[1]));
let ymax = Math.ceil(Math.max(va[1], vb[1], vc[1]));
```

Now comes the important part: We no longer use integer values when calculating the determinant values.

The vertex coordinates used to be integers, and refer to a location in a grid of discrete values, but now they represent a point within a continuous two-dimensional space. The edges between vertices also exist in this continuous space.

How can ve convert the edges over to integer coordinates for pixel drawing?

We can imagine putting a grid, with a spacing of 1 by 1, on top of the continuous vertex space. The grid lines intersect the integer values of this continuous space, and the grid cells represent pixels.

![](images/6-continuous discrete.png)

This means that pixel edges lie at integer coordinates, and that pixel centers are located at (integer) + 0.5 coordinate values.

![](images/6-pixel centers.png)

When we now draw a triangle, we loop through all coordinates inside our integer bounding box, and calculate the determinant value at pixel centers, ie at integer coordinates where we have added 0.5 along both axes. So the triangles will need to cover those points for a pixel to be drawn. (The illustration only shows candidate points near the right triangle edge.)

![](images/6-determinant pixel center.png)

```JavaScript
for (let y = ymin; y < ymax; y++) {
    for (let x = xmin; x < xmax; x++) {
        p[0] = x + 0.5;
        p[1] = y + 0.5;

        w[0] = this.getDeterminant(vb, vc, p);
        w[1] = this.getDeterminant(vc, va, p);
        w[2] = this.getDeterminant(va, vb, p);

        if (isLeftOrTopEdge(vb, vc)) w[0]--;
        if (isLeftOrTopEdge(vc, va)) w[1]--;
        if (isLeftOrTopEdge(va, vb)) w[2]--;

        if (w[0] >= 0 && w[1] >= 0 && w[2] >= 0) {
            this.buffer.data[imageOffset + 0] = color[0];
            this.buffer.data[imageOffset + 1] = color[1];
            this.buffer.data[imageOffset + 2] = color[2];
            this.buffer.data[imageOffset + 3] = 255;
        }
        imageOffset += 4;
    }
    imageOffset += imageStride;
}
```

The choice of adding (and not subtracting) 0.5 is made since then we don't have to deal with any negative coordinate values anywhere in our coordinate systems on screen. (If we subtracted 0.5, the left half of the leftmost pixels on screen would have a negative x coordinate). (See [this article](https://www.realtimerendering.com/blog/the-center-of-the-pixel-is-0-50-5/) for details.)

To summarize: We keep the input vertex coordinates as they are (floating point values), and calculate a slightly larger bounding box, having integer coordinates, that encloses the triangle. We then calculate the determinant at each (integer) + 0.5 location, and use the result to decide whether to draw that pixel or not. The net effect is that the location of the vertices inside their pixel grid cell (ie, the fractional values of the vertex coordinates) are kept in consideration in all of the determinant calculations along the triangle edges. The result is that the rasterizer will now reproduce the definition of the triangle (belonging in a continuous coordinate space) on screen (on a discrete pixel grid) in a much more precise way as. Just as the line drawing example in the very beginning of this section illustrated.

Here is the result - the two triangles now rotate smoothly. This looks good!

![](images/6-floating point rotate glitch.mov)

But wait - there is something wrong here: Now and then there are white single-pixel gaps along the edge between the triangles. The fill rule is correct and we do use floating point numbers (with double precision, even). What is wrong? Read all about it in the next section!
