# A fast and correct triangle rasterizer

In this article series, you will get to learn how a computer draws a triangle on screen. This may sound like a silly thing to study, but if you go through the series you will likely discover that there are details, tradeoffs and complexity that you would not have thought about up front.

This is not unusual in the field of computer graphics - or even computer science: If you stumble upon a problem and ask yourself: "Can it be that hard" - then well, yes, sometimes it can! Drawing a triangle on screen correctly and efficiently is certainly not trivial. And at the same time, it is considered an "old" and "already solved" problem. However, that should not stop us from diving into the subject. Depending on your experience and skill level there are likely things to learn here, things that will be applicable in other fields related to programming - for example maths, numerics, computer graphics or performance optimization.

To begin with, let's have a look at what it means to draw a triangle on the screen. This process is often called triangle rasterization. The term can be explained like this: A triangle is defined by three points (vertices). By drawing lines between each of them the triangle appears.

However, on a computer screen we cannot draw lines directly, instead we need to draw pixels. Put differently: We need to change the colors for a given set of pixels on screen. They are organized in a regular grid, a _raster_, and this is what gives us the name: By rasterization we mean the process of figuring out how to draw a graphical object - defined by points or lines - on a pixel screen.

<p align="center">
<img src="images/0-rasterization.png" width="75%">
</p>

This tutorial is structured as follows: First, you will get to know the principles behind triangle rasterization and more details about the approach we will be using. Then we will write code that will become a simple, first version of a rasterizer. Then we will gradually refine it as we see needs for improvements. The final section in this tutorial looks at performance optimizations - and as you will see, the changes we make there will give a 10-time increase in speed.

Enjoy!

## Sections

1. [A walkthrough of the method](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
1. [Setting up the browser to draw pixels](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/2#readme)
1. [The first, basic rasterizer](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/3#readme)
1. [Moar triangles, moar problems](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/4#readme)
1. [We've got to move it](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/5#readme)
1. [Let's go continuous!](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/6#readme)
1. [One solution, but two new problems](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/7#readme)
1. [Let's fix this](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/8#readme)
1. [Time to go incremental](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/9#readme)

# 1. A walkthrough of the method

(This article is part of a [series](#sections). Also see the [previous section](#readme).)

In this section, you will get to know the principles behind the rasterization method we will use.

## Introduction

The method was first published by Juan Piñeda in 1988, in a paper called ["A Parallel Algorithm for Polygon Rasterization"](https://www.cs.drexel.edu/~david/Classes/Papers/comp175-06-pineda.pdf). As the title says, it was made for parallel execution, something we will not have here, but since the algorithm actually is quite simple, and also well suited for serial execution, we will use it here.

If you search for triangle rasterization on the web, you will likely find many implementations of Piñeda's algorithm. The oldest one I have found is by Nicolas Capens, posted on the site `devmaster.net` (a game developer forum) back in 2004. His code seems to be the original one that has inspired most of the other triangle rasterizer implementations you will find. That web site does not exist anymore, but The Internet Archive [has a copy of the posting](https://web.archive.org/web/20120220025947/http://devmaster.net/forums/topic/1145-advanced-rasterization/) if you are interested.

## The inside test

Piñeda's method is based on scanning an region of candidate pixels, and for each candidate inside that region, finding out whether or not that pixel lies inside the triangle. If it is inside, the pixel is painted with the requested triangle color.

<p align="center">
<img src="../images/1-candidates.png" width="75%">
</p>

To do this efficiently, we have to set up our triangles in a specific way: We orient the vertices in a consistent order - which here is chosen to be counterclockwise. So, when going from any vertex and to the next, and then to the last one in the triangle, we will make a counterclockwise turn.

<p align="center">
<img src="../images/1-orientation.png" width="75%">
</p>

As long as all triangles to be drawn follow that convention, we can define a rule that will decide if a pixel is inside a triangle or not: "If a candidate pixel lies to the left of all three edges when we visit the vertices in order, then the pixel is inside the triangle."

<p align="center">
<img src="../images/1-left.png" width="75%">
</p>

Finding out if a pixel lies to the left of an edge is not so hard. We can use a function that takes three coordinates as parameters - an edge start point, an edge end point, and a candidate pixel - and that returns a positive, zero or negative value. The result is positive if the candidate pixel is to the left of the edge, it will be zero if the pixel is exactly on the edge, and negative if the pixel is to the right.

<p align="center">
<img src="../images/1-edge-function.png" width="75%">
</p>

In code, such a function can look like this:

```JavaScript
getDeterminant(a, b, c) {
    const ab = new Vector(b);
    ab.sub(a);

    const ac = new Vector(c);
    ac.sub(a);

    return ab[1] * ac[0] - ab[0] * ac[1];
}
```

The function receives three inputs `a`, `b` and `c`. The edge coordinates are `a` and `b`, and the candidate pixel coordinates is `c`. (A `Vector` here simply represents an array of values - where the value at index 0 is the x-coordinate, and at the value at index 1 is the y-coordinate.)

The code calculates two vectors `ab` and `ac`. These vectors describe the differences in x- and y-coordinates when going from `a` to `b` and from `a` to `c`. It then cross-multiplies those vectors. This is the same as calculating what is called a determinant - if the vectors were organized in a 2-by-2 matrix. In this tutorial, we will call the result of this calculation a determinant value.

We repeat this edge test for each of the three edges in the triangle - and by doing so we have an inside test for the triangle itself.

## Finding candidate pixels

At this point, we have a working test - as long as the vertices are specified in a counterclockwise order. The next question is: Which pixels should we test?

The first idea could be to just test all pixels on screen, but we can be more efficient than that - we could test just the pixels inside a bounding box enclosing the triangle. This way we test fewer pixels, but still all that are needed. If calculating a bounding box is fast (faster than testing the pixels outside it), then this will be the faster solution.

Taking the minimum and maximum values of all the vertex coordinates gives us the coordinates of the bounding box. This is a very fast operation, so we will use that optimzation here.

In code, finding the corner points of the bounding box looks like this:

```JavaScript
const xmin = Math.min(va[0], vb[0], vc[0]);
const ymin = Math.min(va[1], vb[1], vc[1]);

const xmax = Math.max(va[0], vb[0], vc[0]);
const ymax = Math.max(va[1], vb[1], vc[1]);
```

Here, the `Vectors` `va`, `vb` `vc` contain the vertex coordinates of the triangle.

<p align="center">
<img src="../images/1-bounding-box.png" width="75%">
</p>

## Drawing the triangle

Now we have all we need: We can loop through all points inside the triangle bounding box, we can calculate three determinant values (based on each of the triangle edges and the candidate pixel), and if all the determinant values are positive, we know that the candidate pixel is inside the triangle. (The determinant even has the nice property that the value is proportional to the shortest distance between the pixel and the edge.)

If we are inside we paint the pixel with the desired triangle color. (For now we also assume that a pixel exactly on a triangle edge also belongs to that triangle.)

The code could look like this:

```JavaScript
for (let y = ymin; y < ymax; y++) {
    for (let x = xmin; x < xmax; x++) {
        p[0] = x;
        p[1] = y;

        w[0] = getDeterminant(vb, vc, p);
        w[1] = getDeterminant(vc, va, p);
        w[2] = getDeterminant(va, vb, p);

        if (w[0] >= 0 && w[1] >= 0 && w[2] >= 0) {
            drawPixel(p, color)
        }
    }
}
```

The code here draws pixels - something we have not explained yet. Don't worry, we will get to that in the next section - where we go through how to set up the browser to run code and draw pixels one by one.

# 2. Setting up the browser to draw pixels

(This article is part of a [series](#sections). Also see the [previous section](#1-a-walkthrough-of-the-method).)

In this section we will use the `<canvas>` element to draw individual pixels on the screen. This will set the stage for drawing actual triangles - which we will go through in the section after this one.

## The drawing surface

To be able to draw triangles in a browser window, we need a surface to draw on. This is provided by the `<canvas>` tag - a block element that can receive sizing parameters - both as element attributes, _and_ via CSS styling. Why both?

The `width` and `height` properties of `<canvas>` define the number of pixels the canvas will contain - horizontally and vertically.

Most graphical applications use the value of the `window.devicePixelRatio` property to scale the size of the canvas. This way the code can utilize high DPI hardware if you have that.

However, in this tutorial we will set up a low resolution surface. We want each pixel to be large so that we can see what is going on when we draw triangles. We therefore use a custom `devicePixelRatio` value to specify the scale - and a value of 0.2 works well for our case.

```JavaScript
const canvas = document.getElementById("canvas");
const devicePixelRatio = 0.2;

canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
```

When we want to set the _size_ of the element (the extents in the browser window) we use CSS. In JavaScript:

```JavaScript
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
```

Together, these code snippets set up a canvas element for us to work on. It covers the entire browser window and will have a resolution along x and y that is 20% of the native resolution for a normal-DPI screen. That means, one canvas pixel will cover 5 pixels in each direction, for a total of 25 pixels.

However, there is still something left. Browsers will in general try to improve low resolution graphics by smoothing out pixels. This means that anything we draw on our canvas would end up looking blurry. We want the opposite: We want to see sharp, boxy pixels on the screen. To achieve that, we style the `<canvas>` element with some CSS that tells the browser not to do smoothing:

```HTML
<canvas id="canvas" style="image-rendering:pixelated;"></canvas>
```

## Pixels in the browser

The canvas element object - that we can access from JavaScript - also has an array that stores the color values for all the pixels it contains. The array contains 4 Uint8 (byte) values per pixel - one value for each of the red, blue, green and transparency (alpha) channels. After those 4 values come the 4 values for the next pixel. The array is one-dimensional, you cannot send it x and y values directly.

<p align="center">
<img src="../images/2-array-values.png" width="75%">
</p>

To draw a pixel at a specific (x, y) location on screen, we need to convert the x and y values to an array index that then will point to the right location in the array. The correct value is `4 * (y * width + x)`. The multiplication by 4 is needed since we address bytes, and there are 4 byte values per pixel. At this array location we can then start writing byte values - red, green, blue and transparency values. The minimum value we can write is 0 (no intensity) and the maximum is 255 (full intensity). The resulting color of the pixel will be a mix of the three color intensities and the transparency. In this tutorial we will not use transparency, so we write a value of 255 - which means a completely opaque pixel.

Note: In the canvas coordinate system, (0, 0) is the top left pixel. The x-axis goes to the right, and the y-axis goes downwards. This is how the array addressing looks like if each pixel consisted of one byte:

<p align="center">
<img src="../images/2-array-indices.png" width="75%">
</p>

(As mentioned the array index must be multiplied by 4 since there are 4 bytes in each pixel in our setup.)

When drawing, we will actually not write values directly to the canvas array. Instead, we create a separate array (often called a buffer), draw on that, and then copy the buffer contents over to the canvas array. This way of doing things eliminates flicker that might otherwise appear if we draw directly to the screen while it is being refreshed. The screen refreshes 60 times per second and although we already synchronise our drawing with the screen refresh rate, we will use an intermediate buffer. The reason is that it is more efficient to draw into a buffer in RAM, and then send the full buffer to the GPU in one go, rather than sending lots of small updates directly to the GPU.

How do we create this buffer? First, we need get the so-called `drawing context` for the canvas element:

```JavaScript
const ctx = canvas.getContext("2d");
```

Then, we get hold of the buffer. Note that we need to specify a width and a height, which for us is the same as the full canvas:

```JavaScript
const screenBuffer = ctx.createImageData(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
```

After having set all of the pixel values in the buffer, we put the contents on screen. (The two last parameters specify the pixel location in the canvas where the top left corner of the buffer should be placed).

```JavaScript
ctx.putImageData(screenBuffer, 0, 0);
```

And with that, we have all we need to start drawing triangles in the browser! Let's do that in the next section.

In the mean time, here is the [code for this section](2)
