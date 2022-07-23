# A fast and correct triangle rasterizer

In this section, you will get to know the rasterization method that we will use in this tutorial. 

## Overview

The method described here was first published by Juan Piñeda in 1988, in a paper called ["A Parallel Algorithm for Polygon Rasterization"](https://www.cs.drexel.edu/~david/Classes/Papers/comp175-06-pineda.pdf). There exists many implementations of his idea out there on the web, but the oldest one seems to by the user `Nick` in the forum at the game developer site devmaster.net in 2004. That code appears to have inspired many other implementations of triangle rasterizers. The web site is no longer available, but the Internet Archive [has a copy](https://web.archive.org/web/20120220025947/http://devmaster.net/forums/topic/1145-advanced-rasterization/) if you are interested. 

## The inside test

Piñeda's method relies on being able to find out if a point is inside a triangle or not. To be able do that efficiently, we set up our triangles in a spesific way: We orient the vertices in a fixed order - in our case counterclockwise. So, when going from the first vertex and to the next, and then to the last one, we have made a counterclockwise turn.

When all triangles follow that convention, we can define a rule that decides if a point is inside a triangle or not: "If a candidate point is to the left of all three edges when we visit the vertices in order, the point is inside the triangle." 

Finding out if a point is to the left of an edge is not so hard. We can use a so-called determinant for that - a function that takes in three points, an edge start point, an edge end point, and a candidate point to test. The determinant will be a positive number if the candidate point is to the left of the edge, it will be zero if the point is exactly on the edge, and it will be negative if the point is to the right.

In code, it looks like this:
https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L12-L20

The code here receives three input points `a`, `b` and `c`, and calculates two vectors `ab` and `ac`. The vectors contain the differences in x- and y-coordinates when going from `a` to `b` and from `a` to `c`. It then cross-multiplies the x- and y-coordinates of the vectors and substracts one product from the other. (In the code here, a `Vector` simply represents an array of values - where the value at index 0 is an x-coordinate, and at the value at index 1 is an y-coordinate.) The result is the determinant value.

You may recognize this calculation as a cross-product, and it is: The determinant value is the z-component of a cross product of to three-dimensional vectors `ab` and `ac`. (Here we only see the vectors as two-dimenstional, we don't care about their z value).

## Finding candidate points

At this point, we have a working inside test for triangles, as long as they are specified in a counterclockwise order. The next question is: Which points should we test?

The first assumption could be to test all points on screen, but we can do better than that - we could test just the points inside a bounding box around the triangle. We can find that rectangle by finding the minimum and maximum values of the triangle vertex coordinates. Calculating the bounding box is very fast, and it ensures we don't test a lot of unnecessary candidate points.

In code, finding the bounding box looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L37-L40

## Drawing the triangle

At this point, we are ready: We can loop through all points inside the bounding box, calculate three determinant values (based on each of the triangle edges and the candidate point), and if all determinant values are positive, we know that the point is inside the triangle. In that case we paint the pixel at the candidate point with the triangle's color. (For now we also assume that pixels exactly on a triangle edge belongs to that triangle.)

The code looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/3d4164fd9e2185b194285ec7bc39a976a7fcbd54/tutorial/3/triangle.js#L53-L72

Some parts of that code takes care of drawing pixels, and has not been explained yet. Don't worry, we will get to that in the next section, where we discuss the setup for drawing pixels in a browser. 
