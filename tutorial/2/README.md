# Setting up the browser to draw pixels

In this section, you will get to know the `<canvas>` element and how to set up the browser to draw individual pixels on the screen. This will set the stage for drawing actual triangles - which we will go through in the section following this one.

## The drawing surface

To be able to draw triangles in a browser window, we need a surface to draw on. This is provided by the `<canvas>` tag - a block element that can receive sizing parameters - both as element attributes, _and_ via CSS styling. Why both?

If you reference a canvas element object in JavaScript, like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L4

...then the element object will have `width` and `height` properties that you can manipulate:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L29-L30

The `width` and `height` properties define the number of pixels the canvas will contain - horizontally and vertically. In this tutorial we will set up a low resolution surface, where each pixel is large, so we easily can see what is going on when we draw triangles. We can use `devicePixelRatio` to specify that. After some experimentation, a `devicePixelRatio` value of 0.2 works well for our case.

Instead of setting the pixel ratio manually, you would normally use the existing value set in the `window.devicePixelRatio` property to read out you hardware capabilities so you can set up a canvas that matches the dots-per-inch-capabilites of your screen.

Should you instead want to set the _size_ of the element (the extents in the browser window) you use CSS. In JavaScript:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L32-L33

Together, these code snippets set up a canvas element for us to work on. It covers the entire browser window, and it is set up to have a resolution factor that is 0.2 of the native one for the screen. That means one canvas pixel will cover 5 physical pixels in each direction, for a total of 25 physical pixels.

However, it is not enough to spesify low resolution. Browsers will, in the normal situation, try to improve low resolution graphics by smoothing out pixels. This means that anything we draw now would look blurry. We want the opposite: We want to see sharp, boxy pixels on the screen. To achieve that, we style the `<canvas>` element with some CSS that tells the browser not to do any smoothing:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.html#L5

## Pixels in the browser

In JavaScript, the canvas element object also has an array that stores the color values for all the pixels it contains. The array stores 4 Uint8 (byte) values per pixel - one value for each of the red, blue, green and transparency (alpha) channels, and in that sequence. Then comes the next 4 pixel values, and so on.

To draw a pixel at a specific (x, y) location on screen, we need to convert the x and y values to an array index that will point to the right location in the array. The right value is `4 * (y * width + x)`. The multiplication by 4 is needed since we address bytes, and there are 4 byte values per pixel. At this array location we can then start writing byte values (red, green, blue and transparency values). The minimum value we can write is 0 (no intensity) and the maximum is 255 (full intensity). The resulting color of the pixel will be a mix of the three color intensities and the transparency. Here we will not use transparency, so we write the value 255 - which means a completely opaque pixel.

Note: In the canvas coordinate system, (0, 0) is the top left pixel. The x-axis goes to the right, and the y-axis goes downwards.

When drawing, we will actually not write values directly to the canvas array. Instead, we create a separate array (often called a buffer), draw on that, and then copy the buffer contents over to the canvas array. This way of doing things eliminates flicker that might otherwise appear if we draw directly to the screen while it is being refreshed. The screen refreshes 60 times per second and although we already synchronise our drawing with the screen refresh rate, we use an intermediate buffer since it is more efficient to draw into a buffer in RAM, and then send the full buffer to the GPU in one go, rather than sending lots of small updates directly to the GPU.

How do we create this buffer? First, we need get the so-called `drawing context` for the canvas element:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L5

Then, we get hold of the buffer. Note that we need to specify a width and a height, which for us is the same as the full canvas:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L35

After having set all of the pixel values in the buffer, we put the contents on screen. (The two last parameters specify the pixel location in the canvas where the top left corner of the buffer should be placed).

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L25

And with that, we have all we need to start drawing triangles in the browser! Let's do that in the next section!
