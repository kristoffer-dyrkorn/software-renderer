# Let's fix this

(This article is part of a [series](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial#sections). Also see the [previous section](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/7#readme).)

In this section, we will convert the rasterizer to use fixed point coordinates. We have already implemented a `FixedPointVector` class to help us, so the walkthrough here only considers the changes to the application and to the rasterizer itself.

When calculating the determinant we now refer to input vectors as `FixedPointVectors`. Apart from that, there are no changes - the two vector classes we use have the same API.

```JavaScript
getDeterminant(a, b, c) {
    const ab = new FixedPointVector(b);
    ab.sub(a);

    const ac = new FixedPointVector(c);
    ac.sub(a);

    return ab[1] * ac[0] - ab[0] * ac[1];
}
```

At the start of the triangle draw method, we convert the incoming floating point screen coordinates to fixed point coordinates by using the built-in constructor in `FixedPointVectors`:

```JavaScript
draw(screenCoordinates, color) {
    // get screen coordinates for this triangle
    const va = new FixedPointVector(screenCoordinates[this.va]);
    const vb = new FixedPointVector(screenCoordinates[this.vb]);
    const vc = new FixedPointVector(screenCoordinates[this.vc]);

    const determinant = this.getDeterminant(va, vb, vc);

    // backface culling: only draw if determinant is positive
    // in that case, the triangle is ccw oriented - ie front-facing
    if (determinant <= 0) {
        return;
    }

    (...)
```

When we create the bounding box, we no longer have the `Math.floor()` and `Math.ceil()` functions avaiable, so we round the values up and down manually when we convert from fixed point numbers to normal integers:

```JavaScript
const xmin = Math.min(va[0], vb[0], vc[0]) >> FixedPointVector.SHIFT;
const ymin = Math.min(va[1], vb[1], vc[1]) >> FixedPointVector.SHIFT;

const xmax = (Math.max(va[0], vb[0], vc[0]) + FixedPointVector.DIVISION_CEILING) >> FixedPointVector.SHIFT;
const ymax = (Math.max(va[1], vb[1], vc[1]) + FixedPointVector.DIVISION_CEILING) >> FixedPointVector.SHIFT;
```

Also, our `w` vector and the candidate point vector `p` need to change type:

```JavaScript
   // w = edge distances
    const w = new FixedPointVector();

    // p = screen coordinates
    const p = new FixedPointVector();

    for (let y = ymin; y <= ymax; y++) {
      for (let x = xmin; x <= xmax; x++) {
        // there is no need to round off the result.
        // the input is an integer, and although we add 0.5 to it,
        // we then multiply by 2^n (n>0), which means the result will always be an integer
        p[0] = (x + 0.5) * FixedPointVector.MULTIPLIER;
        p[1] = (y + 0.5) * FixedPointVector.MULTIPLIER;
```

The final part now is to update the fill rule to operate on fixed point numbers. Again, the APIs of the two vector classes are the same, so the change is very small.

```JavaScript
function isLeftOrTopEdge(start, end) {
    const edge = new FixedPointVector(end);
    edge.sub(start);
    if (edge[1] > 0 || (edge[1] == 0 && edge[0] < 0)) return true;
    return false;
}
```

Regarding the fill rule, there is an important detail here: When we used integer coordinates in the rasterizer, the adjustment value was 1 - since that was the numerical resolution (ULP). Independent of our current use of fixed point coordinates, we still want the adjustment value to equal the resolution of the numeric representation. And that value is now 1 - _in fixed point representation_. So although the code does not seem to have changed, the meaning of the number 1 here has changed.

```JavaScript
if (isLeftOrTopEdge(vb, vc)) w[0]--;
if (isLeftOrTopEdge(vc, va)) w[1]--;
if (isLeftOrTopEdge(va, vb)) w[2]--;
```

And that is all that's needed in the rasterizer! Sweet! We now have a fully working and correct rasterizer that gives us smooth animation, due to subpixel resolution support.

If you want to test out various subpixel resolutions and see the effects yourself, you can adjust the value of the `FixedPointVector.SHIFT` constant (see). Try out values like 0 (no subpixels - ie back to a pure-integer version), 1, 2, 4, and 8 for example.

```JavaScript
FixedPointVector.SHIFT = 4;
```

However, the code - as it is now - is not particularly fast. Let's add some simple timing code around the triangle draw function in the application code:

```JavaScript
let start = performance.now();
greenTriangle.draw(rotatedVertices, greenColor);
triangleDrawTime += performance.now() - start;

if (frameCounter % 100 == 0) {
    console.log(`Triangle time: ${(triangleDrawTime / frameCounter).toFixed(2)} ms`);
}
```

When running the code on my machine, drawing the green triangle takes around 2.3 ms. That is actually quite a long time. Here, each triangle consists of only a few pixels (remember, the pixels we see on screen are very large) and does not require a lot of work to draw, but we still would not be able to draw and animate more than 7 triangles on screen before the movement would start stuttering. The browser draws 60 frames per second, so for everyting to run smoothly we must keep at least the same tempo. That means we have a budget of 16.7 ms per frame to draw and animate everything. And `7 triangles` times `2.3 ms per triangle` equals 16.1 ms, so 7 triangles will be the max.

The profiler in my browser tells me that we spend a lot of time calculating determinants, evaluating the fill rule and instantiating `FixedPointVectors`. Could we speed up our code? Yes we can! In the [next section](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/9#readme) we will do just that.
