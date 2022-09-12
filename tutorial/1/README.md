# An overview of the method

In this section, you will get to know the principles behind the rasterization method that we will go through in this tutorial.

## Introduction

The method we use was first published by Juan Piñeda in 1988, in a paper called ["A Parallel Algorithm for Polygon Rasterization"](https://www.cs.drexel.edu/~david/Classes/Papers/comp175-06-pineda.pdf). If you do some searching on the web, you will likely find many implementations of it. The oldest one seems to by Nicolas Capens, posted to the site `devmaster.net` (a game developer forum) back in 2004. His code seems to be the original one that has inspired most of the other triangle rasterizer implementations out there. The Internet Archive [has a copy of the posting](https://web.archive.org/web/20120220025947/http://devmaster.net/forums/topic/1145-advanced-rasterization/) if you are interested.

## The inside test

Piñeda's method is based on scanning an area of candidate pixels, and for each pixel, finding out whether or not that pixel is inside the triangle. If it is inside, the pixel is painted with the desired triangle color. To be able do this efficiently, we have to set up our triangles in a specific way: We orient the vertices in a consistent order - which there is chosen to be counterclockwise. So, when going from the first vertex and to the next, and then to the last one, we will make a counterclockwise turn.

When all triangles to be drawn follow that convention, we can define a rule that decides if a pixel is inside a triangle or not: "If a candidate pixel is to the left of all three edges when we visit the vertices in order, then the pixel is inside the triangle."

Finding out if a pixel is to the left of an edge is not so hard. We can use a function that takes three coordinates as parameters - an edge start point, an edge end point, and a candidate pixel - and that returns a positive, zero or negative value. The result is positive if the candidate pixel is to the left of the edge, it will be zero if the pixel is exactly on the edge, and negative if the pixel is to the right.

In code, the function can look like this:
https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L12-L20

The function receives three inputs `a`, `b` and `c`. The edge coordinates are `a` and `b`, and the candidate pixel coordinates is `c`. (A `Vector` here simply represents an array of values - where the value at index 0 is the x-coordinate, and at the value at index 1 is the y-coordinate.)

The code calculates two vectors `ab` and `ac`. The vectors describe the differences in x- and y-coordinates when going from `a` to `b` and from `a` to `c`. It then cross-multiplies those vectors. This is the same as calculating what is called a determinant - if the vectors were organized in a 2 by 2 matrix. In this article series, we will call the result of this calculation a determinant value.

We repeat this edge test for each of the three edges in the triangle - and this way we have an inside test for the whole triangle.

## Finding candidate pixels

At this point, we have a working test - as long as the vertices are specified in a counterclockwise order. The next question is: Which pixels should we test?

The first assumption could be to test all pixels on screen, but we can be more efficient than that - we could test just the pixels inside a bounding box around the triangle. This way we test fewer pixels, but we still ensure that we test all the pixel we need to test. If finding such a bounding box can be done relatively quickly (quicker than testing all pixels on the screen), then this will also make the code execute faster.

The bounding box can be found by taking the minimum and maximum values of all the vertex coordinates. And this is a very quick operation, so we will use that optimization.

In code, finding the bounding box looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L37-L40

## Drawing the triangle

Now we have all we need: We can loop through all points inside the triangle bounding box, we can calculate three determinant values (based on each of the triangle edges and the candidate pixel), and if all the determinant values are positive, we know that the candidate pixel is inside the triangle. In that case we paint the pixel with the desired triangle color. (For now we also assume that pixels that lie exactly on a triangle edge belong to the triangle.)

The code looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L53-L72

Some parts of this code takes care of drawing pixels, something we have not yet explained how to do. Don't worry, we will get to that in the next section - where we go through how to set up the browser to run our code and draw pixels.
