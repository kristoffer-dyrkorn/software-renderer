# A fast and correct triangle rasterizer

In this section, we will convert the rasterizer to use fixed point coordinates. We have already implemented a `FixedPointVector` class to help us, so the walkthrough here only considers the changes to the application and to the rasterizer itself.

When calculating the determinant we now refer to input vectors as `FixedPointVectors`. Apart from that, there are no changes - the two vector classes we use have the same APIs.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L12-L20

At the start of the triangle draw method, we convert the incoming floating point screen coordinates to fixed point coordinates by using the built-in constructor in `FixedPointVectors`:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L22-L34

When we create the bounding box, we no longer have the `Math.floor()` and `Math.ceil()` functions avaiable, so we round the values up and down manually when we convert from fixed point numbers to normal integers:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L36-L40

Also, our `w` vector and the candidate point vector `p` need to be represented using fixed points:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L47-L57

The final part is to update the fill rule to operate on fixed point numbers. Again, the APIs of the two vector classes are the same, so the change is very small.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L80-L84

But here there is an important detail. In the early version of the rasterizer, where we used integer coordinates, we used an adjustment value of 1. Now, when we use fixed point coordinates, we want the adjustment value to be the same as the resolution of our fixed point numbers. And that is the value 1 - _in fixed point representation_. So although the code here does not seem to have changed, the meaning of the value 1 has changed - as the `w` vector now uses the fixed point representation.

And that is all that's needed in the rasterizer! Sweet! We now have a fully working and correct rasterizer that gives us smooth animation, due to its support for subpixel resolution.

If you want to test out various subpixel resolutions and see the effects yourself, you can adjust the value of the `FixedPointVector.SHIFT` constant. Try out values like 0 (no subpixels), 1, 2, 4, and 8 for example.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/b7ce1d928676e212d4ac458807b5fbd6e686862e/tutorial/lib/fixedpointvector.js#L59

However, the code - as it is now - is not particularly fast. Let's add some simple timing code around the triangle draw function in the application code:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/cbb603d3bb5c0b3f34d6a72030bc900f61f8cd39/tutorial/8/index.js#L74-L80

When running the code on my machine, drawing the green triangle takes around 2.3 ms. That is a lot. Each triangle is small (remember, we are working at a very low resolution here), but still we will not be able to draw more than around 7 triangles on screen before the animation will start stuttering - since we spend more time drawing triangles than there is time between two consecutive frames. The browser draws 60 frames per second, which means we have 16.7 ms per frame available. And 7 \* 2.3 ms equals 16.1 ms.

The profiler in my browser tells me that we spend a lot of time calculating determinants, evaluating fill rules and instantiating `FixedPointVectors`. Could we speed up our code? Yes we can! In the next section we will do just that.
