# A fast and correct triangle rasterizer

In this section, we will start animating our triangles - we will make them rotate on the screen!

## The application code

To make our triangles rotate, it is enough to make the vertices rotate. The triangles themselves contain references to their vertex coordinates - so as long as the coordinates are updated, everything will be correctly set up.

We start by keeping our existing vertex coordinate array as it is. In addition, we create an array of rotated vertices, and initialize it to contain empty `Vector` objects.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/7f0eaec2299ea9dd6d96aabbbd9bf400f8c74a6c/tutorial/5/index.js#L24

To rotate the vertices, we first move them so they are centered around origo, then do the rotation, and then move them back to they originally were centered. Then we write them to the array of rotated vertices.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/a654c06f3c567165f98ac53926677728d02c2004/tutorial/5/index.js#L50-L63

For each frame, we base all calculations on the same unrotated vertices, but we increase the rotation angle per frame. This way the vertices (and then the triangles) rotate. We could also have decided to rotate the coordinates from the previous frame with a fixed, small amount, but that would mean that small errors would accumulate. So doing everything from scratch is more precise.

For each frame, we first rotate the vertices, clear the pixel buffer, draw the triangles, and then put the buffer onto the screen - and increase the rotation angle.

We also use the `requestAnimationFrame` method to synchronise the drawing and rotation with the screen refresh rate. The code looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/a654c06f3c567165f98ac53926677728d02c2004/tutorial/5/index.js#L65-L78

We are now ready to inspect the result. Not bad - the triangles are indeed rotating, but notice: The movement is not smooth - the vertices jump here and there as they move.

This can be improved, check out the next section!
