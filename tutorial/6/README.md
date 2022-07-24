# A fast and correct triangle rasterizer

In this section, we will improve the smoothness of the animation - we will go from integer to floating point coordinates!

## The application code

In the application, the only change we will make is that we no longer round off the coordinades after they have been rotated. The `rotate(angle)` function now looks like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/69c665e30005a3c41d353963e1cce56b45dac791/tutorial/6/index.js#L50-L63
