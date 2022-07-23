# A fast and correct triangle rasterizer

In this section, you will get to know how to use the `<canvas>` element to draw individual pixels in a browser window. This will set the stage for drawing triangles - which we will do in the next section.

## The drawing surface

To be able to draw rasterized triangles in a browser window, we need a surface to draw on. This is easily created by using the `<canvas>` HTML5 tag. A canvas is an block element, with size parameters specified both in the element itself, _and_ in CSS. Why both?

If you, in JavaScript, get hold of a canvas element, say - like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L4

...then the element object will have `width` and `height` properties that you can manipulate:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L29-L30

As the `devicePixelRatio` might reveal: These properties decide the resolution of the drawing surface. That is, the number of pixels it will contain - horizontally and vertically. In the normal case, you would like to read out the `window.devicePixelRatio` property to use that to set high DPI resolution, if that is available on your platform.

Should you want to set the _size_ of the element itselt in the browser window, you use CSS. In JavaScript:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L32-L33

The code in this these two examples set up a canvas element to cover the entire browser window, and to have a pixel resolution that depends on the given `devicePixelRatio`.

When drawing triangles it is nice to work in low resolution, that means we can more easily see what is going on. So we would like to see large pixels. After some experimenting, a `devicePixelRatio` of 0.2 is a suitable value.

The default behaviour for browsers is to smooth out low resolution graphics to they become less jaggy. However, we want the opposite: We want to see clear, boxy pixels on our screens. To support that, we style the `<canvas>` element in HTML with a message to the browser to not smooth out the pixels:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.html#L5

## Pixels in the browser

When we want to draw pixels on the screen we need to know the coordinates of the pixel, and the color it should have. In a canvas, there is a array for Uint8 (byte) values that we need to manipulate. The array contains all the pixels that are shown in the canvas, stored as 4 byte values per pixel (one value each for the red, blue, green and transparency channels). The byte values are stored sequentially in the buffer. That means: To draw a pixel at a spesific (x, y) coordinate, we need to convert the coordinate to an array index. This can by done by the following formula: `index = 4 * (y * width + x)`. (We multiply by 4 since there are 4 byte values per pixel.)

However, we don't draw directly to the canvas array. Instead, we create a separate array (often called a buffer), draw on that, an then copy that buffer over to the canvas. This way of doing things eliminates screen flicker that might otherwise appear when drawing to the screen as the screen is refreshed (something that takes place 60 times per second).

How do we get hold of the buffer that we will write pixel values to? First, we need get hold of a so-called `drawing context` for the canvas element:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L5

Then, the buffer is available like this - note that we need to specify a width and a height, which for us is the same as the full canvas:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L35

After having put red, green, blue and transparency values in the buffer, we put the buffer onscreen this way (the two last parameters specify the pixel coordinates in the canvas where the buffer should be placed).

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L25

And with that, we have all the operations needed to start drawing triangles. We will do that in the next section!
