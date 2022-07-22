# A fast and correct triangle rasterizer

We will first build a simple version to get to know the concepts. Then we will gradually refine the code - and you will get to know more details and the reasoning behind the changes in each step.

First, we set up the HTML for our page:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/35b8d4f4f435ff3b1a0970fafe0983cbe24cf18b/tutorial/1/index.html#L1-L8

We are going to render pixel to a `<canvas>` tag, and note that we specify pixelated rendering. The reason is that we - for now will work on a low resolution (anti-retina!) rendering so we can see details more clearly. This is how we specify resolution - similar to what is normal for high DPI rendering we set a custom `devicePixelRatio` and use that to set a lower resolution of the canwas although we keep the size at full screen width and height.

https://github.com/kristoffer-dyrkorn/software-renderer/blob/b9838d4ed1d1c3173e927a024fa67030cc5c49a7/tutorial/1/index.js#L28-L33
