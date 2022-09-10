# A fast and correct triangle rasterizer

In this section, we will take a closer look at what happens when we draw two triangles that share an edge. There are some important details that need to be resolved.

## The application code

It is not so interesting to look at just one triangle on a screen. We need more triangles! So, let's add a blue one. In the application code, it looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/056d879bd79b618800b64e8947c485b78140b8a5/tutorial/4/index.js#L16-L29

We add another vertex to the array of all vertices, and create a new, separate vertex index array just for the blue triangle. Note that the indices `2` and `0` are shared between the two triangles. This means that the two triangles share an edge - that goes between vertices number 2 and 0.

This is how it looks like:

## Oooops

At first, this seems to look just great. But, if we draw first the green triangle, and then the blue one, we will see that there are some blue pixels that are drawn on top of the green ones.

This is called overdraw - and it is something we want to avoid. First of all, it will worsen performance, since we spend time drawing pixels that later become hidden by other pixels. Also, the visual quality will suffer: It will make edges between triangles seem to move, depending on which triangel was drawn first. Should we want to use the rasterizer to draw detailed objects (with many triangles) the result will look awful.

You might rember from the previous section that we considered all pixels lying exactly on a triangle edge (`w` = 0) to belong to the triangle. What we have here is an unfortunate consequence of that: The pixels along the shared edge between two triangles now belong to both triangles. So they are drawn twice.

## One rule to rule them all

We need to sort out that, and introduce another rule for triangles. The rule that most graphics APIs use, is to say that pixels that lie on a left side edge of a triangle, or on a flat top edge of a triangle, do not belong to that triangle. This is sufficient to cover all cases of shared edges.

The rule is often called the "top left" fill rule, and can be implemented like this, in the triangle rasterizer:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/205ad80d4450d8d735ac9f0b3349031e678838b3/tutorial/4/triangle.js#L81-L85

The logic behind is as follows: An edge is a left edge if the change in y coordinate, when moving from the end and to the start of the edge, is larger than zero. An edge is a flat top edge if the change in y coordinate is zero and the change in x is negative.

This way of expressing the fill rule leans on two conventions we already follow in our setup: That the vertices in a visible triangle have counterclockwise order, and that the positive y axis on screen points down. As long as those two hold, then the code will work as intended.

(Side note: We could have chosen the opposite convention, and defined a "bottom right" rule, and that would be just as correct. The point is to have a rule that consistently separates pixels that lie on shared edges, and the "top left" version of this rule has somehow become the standard in computer graphics.)

Now that we have defined the rule, what do we do with it? How do we express that pixels on the edges that match the rule do not belong to this triangle?

When drawing pixels, we need to make an exception: We will skip those pixels that - according to this new rule - don't belong to the triangle after all. An easy way to do so is to adjust the determinant value. So, whenever an edge is affected by the fill rule (ie is a left edge or a horizontal top edge), we subtract some small amount from that determinant.

This is a somewhat dirty trick - reducing a determinant value essentially moves a triangle edge towards the triangle center. So the adjustment should be as small as possible, while still large enough to work as intended.

The goal here is to make the determinant value for this edge, in the current triangle, differ from the determinant value calculated when the rasterizer hits the same edge in the neighbour triangle. This way we can create a tie breaking rule - ie some logic that ensures that pixels lying exactly on the shared edge will end up belonging to only one of the triangles - and are thus drawn only once.

How large should the adjustment be? In the setup we have here, all coordinates have integer values. This means that all determinants also have integer values. The resolution of the determinant calculation is 1 and that, in turn, means that the least possible adjustment value is 1.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/056d879bd79b618800b64e8947c485b78140b8a5/tutorial/4/triangle.js#L62-L73

The rest of the code remains the same.

And with that, we can safely draw lots of triangles - without gaps or overlaps!
