# A fast and correct triangle rasterizer

In this section, we will take a closer look at what happens when we draw two triangles that share an edge. There are some important details that need to be resolved.

## The application code

It is not so interesting to look at just one triangle on a screen. We need more triangles! So, let's add a blue one. In the application code, it looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/056d879bd79b618800b64e8947c485b78140b8a5/tutorial/4/index.js#L16-L29

We add another vertex to the array of all vertices, and create a new, separate vertex index array just for the blue triangle. Note that the indices `2` and `0` are shared between the two triangles. This means that the two triangles share an edge - that goes between vertices number 2 and 0.

This is how it looks like:

## Oooops

At first, this seems to look just great. But, if we draw first the green triangle, and then the blue one, we will see that there are some blue pixels that are drawn on top of the green ones.

This is called overdraw - and it is something we want to avoid. It will worsen performance, since we waste time on drawing pixels that later become hidden. Also, the visual quality will suffer: Edges will seem to move between triangles, depending on the order we draw them in. Should we want to use the rasterizer to draw complex objects on screen we must avoid artifacts like that.

You might rember from the previous section that we considered pixels lying exactly on a triangle edge (`w` = 0) to belong to the triangle. What we have here is an unfortunate result of that: The pixels along the shared edge between two triangles lie exactly on that edge, and thus belong to both triangles. So they are drawn twice.

## One rule to rule them all

We need to sort out that, and introduce another rule for triangles. The common rule that most graphics APIs use, is to say that pixels that lie on a left side edge of a triangle, or on a flat top edge of a triangle, do not belong to that triangle. This is sufficient to cover all cases of shared edges.

The rule is often called the "top left" fill rule, and can be implemented like this, in the triangle rasterizer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/205ad80d4450d8d735ac9f0b3349031e678838b3/tutorial/4/triangle.js#L81-L85

The logic behind is as follows: An edge is a left edge if the change in y coordinate, when moving from the end and to the start of the edge, is larger than zero. An edge is a flat top edge if the change in y coordinate is zero and the change in x is negative.

This way of expressing the rule depends on two conventions we have follow in our code: That the vertices in a visible triangle have counterclockwise order, and that the positive y axis on screen points down. If those two hold, then this rule will work as intended.

(A side note: We could have chosen the opposite convention, and defined a "bottom right" rule, and that would be just as correct. The point is to have a rule that consistently separates pixels that lie on shared edges, and the "top left" version of this rule has somehow become the standard in computer graphics.)

Now that we have defined the rule, what do we do with it? How do we express that pixels on the edges that match the rule do not belong to this triangle?

We need to make an exception: We will skip the pixels that - according to this new rule - don't belong to the triangle after all. An easy way to do so is to adjust the determinant value. So, whenever an edge is affected by the fill rule, we nudge the determinant for that edge with a small amount. The value 1 is chosen somewhat arbitrarily - the point is to make the determinant value for this edge, in this triangle, differ from the determinant value calculated when the rasterizer works on the same edge in the neighbour triangle.

In a sense, what we are doing here is to nudge affected edges towards their triangle center. We don't want the nudging to introduce visual artifacts, so the value should be as small as possible - but still large enough to consistently break the tie.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/056d879bd79b618800b64e8947c485b78140b8a5/tutorial/4/triangle.js#L62-L73

The rest of the code remains the same.

And with that, we can safely draw lots of triangles - without gaps or overlaps!
