# We've got to move it

In this section, we will start animating our triangles - we will make them rotate on the screen!

## The application code

To make our triangles rotate, it is sufficient to make the vertices rotate. Remember, the triangle objects themselves just contain references to vertex coordinates, so as long as the values in the vertex coordinate array are updated, everything will be correct.

Also, the notion of sharing edges and vertices might become clearer now: By making triangles share vertices, we save calculations: It is sufficient to rotate a vertex just once, and all triangles that use that vertex will then be updated. Also, if vertices are duplicated among triangles, there is a risk that small errors in calculations might move the overlapping vertices apart, thus creating gaps or overlaps between the triangles. We will return to the topic of precision later on in this tutorial.

Now, back to the code. We start by keeping our existing vertex coordinate array as it is. In addition, we create an array that will hold our rotated vertices, and we initialize it to contain empty `Vector` objects.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/7f0eaec2299ea9dd6d96aabbbd9bf400f8c74a6c/tutorial/5/index.js#L24

To rotate the vertices, we first move them so all vertices are centered around origo, then do the rotation, and then move them back to where they originally were centered. This way we make them rotate around their own centers. (If we don't move them to origo before rotating, they would instead rotate around the _screen coordinates_ origo, which is the top left corner of the screen.) Then we round the result to the nearest integer pixel coordinate, and store the values in the array of rotated vertices.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/a654c06f3c567165f98ac53926677728d02c2004/tutorial/5/index.js#L50-L63

For each frame we draw on screen, we base all our calculations on the same unrotated vertices, and just increase the rotation angle a little bit per frame. This way we make the vertices (and also the triangles) rotate. We could also have decided to start with the coordinates from the previous frame, and rotate them with some fixed, small amount, but that would mean that small errors in the calculations would accumulate. So doing everything from scratch is more precise - and has no performance penalty. The work to rotate vertices stays the same, only the rotation angle changes.

In the code, we set up a function that will be run each frame. Inside the function, we first rotate the vertices, clear the pixel buffer, draw the triangles into the buffer, and then put the buffer onto the screen - and increase the rotation angle.

We use the `requestAnimationFrame` method to synchronise the drawing and rotation with the screen refresh rate. The code looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/a654c06f3c567165f98ac53926677728d02c2004/tutorial/5/index.js#L65-L78

We are now ready to inspect the results. Not bad - the triangles are indeed rotating, but notice: The movement is not smooth - the triangles seem to jump around a bit as they rotate.

This can be improved, check out the next section!
