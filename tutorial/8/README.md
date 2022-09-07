# A fast and correct triangle rasterizer

In this section, we will convert the rasterizer to use fixed point coordinates. We have already implemented a `FixedPointVector` class to help us, so the walkthrough here only considers the changes to the application and to the rasterizer itself.

When calculating the determinant we now refer to input vectors as `FixedPointVectors`. Apart from that, there are no changes - the two vector classes have the same APIs.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L12-L20

At the start of the triangle draw method, we convert the incoming floating point screen coordinates to fixed point coordinates by using the built-in constructor in `FixedPointVectors`:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L22-L34

When we create the bounding box, we no longer have the `Math.floor()` and `Math.ceil()` functions avaiable, so we round the values up and down manually when we convert from fixed point numbers to normal integers:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L36-L40

Also, our `w` vector and the candidate point vector `p` need to be represented using fixed points:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L47-L57

The final part is to update the fill rule to operate on fixed point numbers. Again, the APIs of the two vector classes are the same, so the change is very small.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L80-L84

But here there is an important change. Until now, the adjustment value has been 1. In the fixed point representation, a value of 1 represents the smallest possible difference between two numbers. Should we change the adjustment? It turns out that keeping the adjustment of 1 still makes the determinant consistently less than zero for pixels that lie exactly on an affected edge. So

And that is all that's needed in the rasterizer! Sweet! We now have a fully working and correct rasterizer that gives us smooth animation, due to its support for subpixel resolution.

If you want to test out various subpixel resolutions and see the effects yourself, you can adjust the value of the `FixedPointVector.SHIFT` constant. Try out values like 0 (no subpixels), 1, 2, 4, and 8 for example.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/b7ce1d928676e212d4ac458807b5fbd6e686862e/tutorial/lib/fixedpointvector.js#L59

However, the code is not particularly fast. Let's add some simple timing code around the triangle draw function in the application code:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/cbb603d3bb5c0b3f34d6a72030bc900f61f8cd39/tutorial/8/index.js#L74-L80

When running the code on my machine, drawing the green triangle takes around 2.3 ms. That is a lot. Each triangle is small (remember, we are working at low resolution), but still we will not be able to draw more than around 7 of those on screen before reaching the frame time limit - where the animation will start stuttering. (The browser draws 60 frames per second, which means we have 16.7 ms per frame available.)

The profiler in my browser tells me that we spend a lot of time calculating determinants, evaluating fill rules and instantiating `FixedPointVectors`. Could we speed up our code? Yes we can! In the next section we will do just that.
