# A fast and correct triangle rasterizer

In this section, you will get to know the `<canvas>` element and how to set up the browser (and our code) to draw individual pixels on the screen. This will set the stage for drawing triangles - which we will do in the next section.

## The drawing surface

To be able to draw rasterized triangles in a browser window, we need a surface to draw on. This is provided by the `<canvas>` HTML5 tag. A canvas is an block element, and can take size parameters in the element itself, _and_ via CSS styling. Why both?

If you, in JavaScript, reference a canvas element object, say - like this:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L4

...then the element object will have `width` and `height` properties that you can manipulate:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L29-L30

As the `devicePixelRatio` variable here might reveal: These properties decide the resolution of the drawing surface. That is, the number of pixels it will contain - horizontally and vertically. In the normal case, you would like to read out the `window.devicePixelRatio` property to use that to set high DPI resolution for your canvas.

However, when we are drawing triangles it is nice to have a low resolution surface, where each pixel is large, so we can see more easily what is going on. After some experimenting, it turns out that a `devicePixelRatio` of 0.2 is a suitable value.

Should you want to set the _size_ of the element itself, in the browser window, you use CSS. In JavaScript:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L32-L33

Together, these last two code examples set up a canvas element to cover the entire browser window, and to have a pixel resolution that depends on the provided `devicePixelRatio` value, which in our case will be 0.2. So one canvas pixel will be 5 physical pixels in each direction, for a total of 25 physical pixels.

The default behaviour for browsers is to smooth out low resolution graphics in the canvas to become less jaggy. However, we want the opposite: We want to see sharp, boxy pixels on the screen. For that, we style the HTML `<canvas>` element with CSS - which tells the browser not to do any pixel smoothing:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.html#L5

## Pixels in the browser

When we want to draw pixels on the screen we need to know the coordinates of the pixel and the color it should have. Inside a canvas element there is an array of Uint8 (byte) values that we need to manipulate. The array contains all the pixels that are shown in the canvas - stored as 4 byte values per pixel (one value for each of the red, blue, green and transparency channels). The byte values are stored sequentially in the buffer, which means: To draw a pixel at a spesific (x, y) location, we need to convert the (x, y) coordinates to an array index. This is done with the following formula: `index = 4 * (y * width + x)`. (The multiplication by 4 is needed since there are 4 byte values per pixel.)

Note: In the canvas coordinate system, (0, 0) is the top left pixel. The x-axis goes to the right, and the y-axis goes downwards.

However, we don't draw directly to the canvas array. Instead, we create a separate array (often called a buffer), draw on that, an then copy the contents of that buffer over to the canvas. This way of doing things eliminates screen flicker that might otherwise appear when drawing directly to the screen at the moment the screen is being refreshed (something that takes place 60 times per second).

How do we get hold of the buffer that we will write our pixel values to? First, we need get the so-called `drawing context` for the canvas element:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L5

Then, the buffer is available this way - note that we need to specify a width and a height, which for us is the same as the full canvas:

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L35

After having set red, green, blue and transparency values in the buffer, we put the buffer onscreen this way (the two last parameters specify the pixel coordinates in the canvas where the buffer should be placed).

https://github.com/kristoffer-dyrkorn/software-renderer/blob/c7b5a0ab1c164c96bd8db30fdc0f8d215eb414a4/tutorial/3/index.js#L25

And with that, we have all we need to start drawing triangle pixels in the browser! Let's do that in the next section!
