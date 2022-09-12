# Let's fix this

In this section, we will convert the rasterizer to use fixed point coordinates. We have already implemented a `FixedPointVector` class to help us, so the walkthrough here only considers the changes to the application and to the rasterizer itself.

When calculating the determinant we now refer to input vectors as `FixedPointVectors`. Apart from that, there are no changes - the two vector classes we use have the same API.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L12-L20

At the start of the triangle draw method, we convert the incoming floating point screen coordinates to fixed point coordinates by using the built-in constructor in `FixedPointVectors`:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L22-L34

When we create the bounding box, we no longer have the `Math.floor()` and `Math.ceil()` functions avaiable, so we round the values up and down manually when we convert from fixed point numbers to normal integers:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L36-L40

Also, our `w` vector and the candidate point vector `p` need to change type:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L47-L57

The final part is to update the fill rule to operate on fixed point numbers. Again, the APIs of the two vector classes are the same, so the change is very small.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L80-L84

Still, there is an important detail here: When we used integer coordinates in the rasterizer, the adjustment value was 1 - since that was the numerical resolution. Independent of our current use of fixed point coordinates, we still want the adjustment value to equal resolution of the numeric representation. And that is now 1 - _in fixed point representation_. So although the code does not seem to have changed, the meaning of the number 1 here has changed.

And that is all that's needed in the rasterizer! Sweet! We now have a fully working and correct rasterizer that gives us smooth animation, due to subpixel resolution support.

If you want to test out various subpixel resolutions and see the effects yourself, you can adjust the value of the `FixedPointVector.SHIFT` constant. Try out values like 0 (no subpixels - ie back to a pure-integer version), 1, 2, 4, and 8 for example.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/b7ce1d928676e212d4ac458807b5fbd6e686862e/tutorial/lib/fixedpointvector.js#L59

However, the code - as it is now - is not particularly fast. Let's add some simple timing code around the triangle draw function in the application code:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/cbb603d3bb5c0b3f34d6a72030bc900f61f8cd39/tutorial/8/index.js#L74-L80

When running the code on my machine, drawing the green triangle takes around 2.3 ms. That is actually quite a long time. Here, each triangle is small (remember, we are working at a very low resolution) and does not require a lot of work to draw, but we still would not be able to draw and animate more than 7 triangles on screen before the movement would start stuttering. The browser draws 60 frames per second, so for everyting to run smoothly we must keep at least the same tempo. That means we have a budget of 16.7 ms per frame to draw and animate everything. And `7 triangles` times `2.3 ms per triangle` equals 16.1 ms.

The profiler in my browser tells me that we spend a lot of time calculating determinants, evaluating the fill rule and instantiating `FixedPointVectors`. Could we speed up our code? Yes we can! In the next section we will do just that.
