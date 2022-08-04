# A fast and correct triangle rasterizer

In this section, you will get to know the `<canvas>` element and how to set up the browser to draw individual pixels on the screen. This will set the stage for drawing actual triangles - which we will go through in the next section.

## The drawing surface

To be able to draw triangles in a browser window, we need a surface to draw on. This is provided by the `<canvas>` HTML5 tag. A canvas is a block element, and can take size parameters - both on the element itself, _and_ via CSS styling. Why both?

If you reference a canvas element object in JavaScript, like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L4

...then the element object will have `width` and `height` properties that you can manipulate:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L29-L30

As the `devicePixelRatio` variable here might reveal: The `width` and `height` properties define the resolution of the drawing surface. That is, the number of pixels it will contain - horizontally and vertically. In this tutorial we will set up a low resolution surface, where each pixel is large, so we easily can see what is going on when we draw triangles. After some experimenting, it turns out that a `devicePixelRatio` setting of 0.2 is a suitable value.

Normally, instead of setting the pixel ratio manually, you would use the value of the `window.devicePixelRatio` property to set up a high DPI canvas for your screen.

Should you instead want to set the _size_ of the element (the extents in the browser window) you use CSS. In JavaScript:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L32-L33

Together, these code snippets set up a canvas element to cover the entire browser window, and to have a resolution as defined by the given `devicePixelRatio` value - which here is 0.2. So one canvas pixel will cover 5 physical pixels in each direction, for a total of 25 physical pixels.

Browsers will normally try to improve low resolution graphics by smoothing out pixels. This means that the result will look blurry. However, we want the opposite: We want to see sharp, boxy pixels on the screen. To achieve that, we style the HTML `<canvas>` element with CSS, which tells the browser not to do any pixel smoothing:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.html#L5

## Pixels in the browser

The canvas element has an array which stores the color values for all the pixels shown on the canvas. The array has 4 Uint8 (byte) values per pixel - one value for each of the red, blue, green and transparency channels. The pixel values are stored sequentially in the array.

To draw a pixel at a specific (x, y) location, we need to convert the (x, y) coordinates to an array index that will point to the right location inside the array. This is done by the formula `index = 4 * (y * width + x)`. The multiplication by 4 is needed since there are 4 byte values per pixel. At this location we can start writing 4 byte values after one another - the read, green, blue and transparency values for that pixel. The minimum value is zero (no intensity) and the maximum is 255 (full intensity). The resulting color for that pixel is a mix of the three color intensities and the transparency. Here we will not use transparency, so we write the value 255 - which means a completely opaque pixel.

Note: In the canvas coordinate system, (0, 0) is the top left pixel. The x-axis goes to the right, and the y-axis goes downwards.

While drawing, we will actually not draw directly to the canvas array. Instead, we create a separate array (often called a buffer), draw on that, an then copy the contents of that buffer over to the canvas array. This way of doing things eliminates screen flicker that might otherwise appear should we draw directly to the screen at the exact same moment the screen is being refreshed (something that happens 60 times per second).

How do we create the buffer that we will write our pixel values to? First, we need get the so-called `drawing context` for the canvas element:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L5

Then, we get hold of the buffer this way. Note that we need to specify a width and a height, which for us is the same as the full canvas:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L35

After having set all of the pixel values in the buffer, we put the buffer onscreen this way. (The two last parameters specify the pixel location in the canvas where the top left corner of the buffer should be placed).

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L25

And with that, we have all we need to start drawing triangles in the browser! Let's do that in the next section!
