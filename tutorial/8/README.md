# A fast and correct triangle rasterizer

In this section, we will convert the rasterizer to use fixed point coordinates. We have already implemented a `FixedPointVector` class to help us, so the walkthrough here only considers the changes to the application and to the rasterizer itself.

When calculating the determinant we now refer to input vectors as `FixedPointVectors`. Apart from that there are no changes - the two vector classes have the same APIs.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L12-L20

Likewise, for the start of the triangle draw method, we convert the floating point screen coordinates to fixed point coordinates:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L22-L34

When we create the bounding box, we no longer have the `Math.floor()` and `Math.ceil()` functions avaiable, so we round the values up and down manually when we convert from fixed point to normal numbers:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L36-L40

Also, our `w` vector and the candidate point vector needs to be represented using fixed points:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L47-L57

The final part is to update the fill rule function to operate on fixed point numbers. Again, the APIs of the two vector classes are the same, so the change is very small.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/5a919f2dfa5e6cd651286cf146bf504ab302e3cb/tutorial/8/triangle.js#L80-L84
