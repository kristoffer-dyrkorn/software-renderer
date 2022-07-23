# A fast and correct triangle rasterizer

In this section, you will get to know the principles behind triangle rasterization and the overall method that we will follow in this tutorial. 

## Overview

[test](www.vg.no)

The method described here was published by Juan Pineda in 1988, in a paper called ["A Parallel Algorithm for Polygon Rasterization"](https://www.cs.drexel.edu/~david/Classes/Papers/comp175-06-pineda.pdf). There exists many implementations of this method out there on the web, but the first one seems to by the user Nick in the forum at the game developer site devmaster.net in 2004. That code appears to have inspired many later implementations of triangle rasterizers.

The web site devmaster.net is no longer available, but the Internet Archive [fortunately has a copy](https://web.archive.org/web/20120220025947/http://devmaster.net/forums/topic/1145-advanced-rasterization/). 


## The inside test

The method here relies on being able to find out if a point is inside a triangle or not. To be able do that efficiently, we set up our triangles in a spesific way: We orient the vertices in a fixed order - in our case counterclockwise. So, when going from the first vertex and to the next, and then to the last one, we have made a counterclockwise turn.

When all triangles follow that convention, we can define a rule that decides if a point is inside a triangle or not: "If a candidate point is to the left of all three edges when we visit the vertices in order, the point is inside the triangle." 

Finding out if a point is to the left of and edge is not so hard. We can use a so-called determinant for that - this is a function that takes in three points, an edge start point, an edge end point, and a candidate point to test. The determinant function returns a positive number of the candidate point is to the left of the edge, it returns zero if the point is on the edge, and it returns a negative number if the point is to the right.

In code, it looks like this:
https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L12-L20

The code here receives three input points `a`, `b` and `c`, and calculates two vectors (the differences in x- and y-coordinates) each, when going from `a` to `b` and from `a` to `c`. It then cross-multiplies the coordinate differences and substracts one product from the other. (In the code here, a `Vector` simply represents an array of values - where the value at index 0 is an x-coordinate, and at the value at index 1 is an y-coordinate.)

You may recognize this calculation as a cross-product, and it is: The determinant value is the z-component of a cross product of to three-dimensional `Vector`s `ab` and `ac`. (Here we only see the `Vector`s as two-dimenstional, we don't care about their z value). The determinant value will always be twice the area of the triangle spanned out by the three input points. We will use that property later on.

## Finding candidate points

At this point, we have a working inside test for triangles, as long as they are specified in a counterclockwise order. The next question is: Which points should we test?

The first assumption could be to test all points on screen, but we can do better than that - we could test just the points inside a bounding box around the triangle. That is - a rectangle defined by the minimum and maximum values of the triangle vertex coordinates. Calculating the bounding box is very fast while still ensuring we don't test a lot of unnecessary candidate points.

In code, finding the bounding box looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L36-L40

## Drawing the triangle

At this point, we are ready: We can loop through all points inside the bounding box, calculate three determinant values (based on each of the triangle edges and the candidate point), and if all determinant values are positive, we know that the point is inside the triangle. In that case we paint the pixel at the candidate point with the triangle's color. For now we will also paint the pixels that lie exactly on a triangle edge, ie has a determinant value of zero.
