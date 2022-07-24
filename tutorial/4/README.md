# A fast and correct triangle rasterizer

In this section, we will look at what happens when we draw two triangles sharing an edge.

## The application code

It is rarely interesting to look at one triangle on a screen. We need more triangles! So, we add a blue one in the application code:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/056d879bd79b618800b64e8947c485b78140b8a5/tutorial/4/index.js#L16-L29

We add another vertex to the (common) vertex array, and create a new, separate vertex index array for the blue triangle. Note that the indices `2` and `0` are shared between the two triangles. This means the two triangles share an edge.

This is how it looks like:

## Oooops

At first, everything might look nice. But, if we draw first the green triangle, and then the blue one, we will see that some blue pixels are drawn on top of the green ones. We have triangle overdraw - something we must avoid. It will influence performance (we spend time drawing pixels that are overdrawn) and visual quality (the result will look differently depending on the order the triangles are drawn in).

You might rember from the previous section that we considered pixels lying exactly on a triangle edge (w = 0) to belong to the triangle. What we have here is an unfortunate result of that: The pixels along the shared edge lie exactly on that edge, and thus belong to both triangles. So they are drawn twice.

## One rule to rule them all

We need to sort out that, and introduce a new rule for triangles. The convention in most graphics APIs is to say that pixels on a left edge, or a flat top edge, do not belong to the triangle. This way it is clear which pixels on the edge that belong to which triangle when they share edges.

The rule is often called the "top left" fill rule, and can be implemented like this, in the triangle rasterizer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/205ad80d4450d8d735ac9f0b3349031e678838b3/tutorial/4/triangle.js#L81-L85

An edge is a left edge if the change in y coordinate, when moving from the end and to the start of the edge, is larger than zero. It is a flat top edge if the change in y coordinate is zero and the change in x is negative.

This formulation of the rule relies heavily on two conventions we have set up in our code: That the vertices in a visible triangle have counterclockwise order, and that the positive y axis points down. If those hold, this rule will work as intended.

(A side note: We could have chosen the opposite convention, and defined a "bottom right" rule, and that would be equally correct. The point is to have a rule that consistently separates pixels that lie on shared edges, and the "top left" rule has just become the standard in computer graphics.)

Now we have defined the rule, but what do we do with it?

An easy way to skip drawing pixels on an edge is to adjust the determinant value for pixels on that edge. So we nudge the determinant with a small value when an edge is affected by the fill rule. The value of 1 is chosen somewhat arbitrarily here - the point is just to shift the determinant value enough for this pixel so that it influences the test directly after.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/056d879bd79b618800b64e8947c485b78140b8a5/tutorial/4/triangle.js#L62-L73

The rest of the code remains the same.

And with that, we can safely draw lots of triangles - without gaps or overlaps!
