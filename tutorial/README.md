# A fast and correct triangle rasterizer

In this article series, you will get to learn how a computer draws a triangle on screen. This may sound like a silly thing to study, but if you go through the series you will likely discover that there are details, tradeoffs and complexity that you would not have thought about up front.

This is not unusual in the field of computer graphics - or even computer science: If you stumble upon a problem and ask yourself: "Can it be that hard" - then well, yes, sometimes it can! Drawing a triangle on screen correctly and efficiently is certainly not trivial. And at the same time, it is considered an "old" and "already solved" problem. However, that should not stop us from diving into the subject. Depending on your experience and skill level there are likely things to learn here, things that will be applicable in other fields related to programming - for example maths, numerics, computer graphics or performance optimization.

To begin with, let's have a look at what it means to draw a triangle on the screen. This process is often called triangle rasterization. The term can be explained like this: A triangle is defined by three points (vertices). By drawing lines between each of them the triangle appears.

However, on a computer screen we cannot draw lines directly, instead we need to draw pixels. Put differently: We need to change the colors for a given set of pixels on screen. They are organized in a regular grid, a _raster_, and this is what gives us the name: By rasterization we mean the process of figuring out how to draw a graphical object - defined by points or lines - on a pixel screen.

![](images/0-rasterization.png | width=50%)

This tutorial is structured as follows: First, you will get to know the principles behind triangle rasterization and more details about the approach we will be using. Then we will write code that will become a simple, first version of a rasterizer. Then we will gradually refine it as we see needs for improvements. The final section in this tutorial looks at performance optimizations - and as you will see, the changes we make there will give a 10-time increase in speed.

Here is an overview of the tutorial - enjoy!

1. [A walkthrough of the method](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
2. [Setting up the browser to draw pixels](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
3. [The first, basic rasterizer](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
4. [Moar triangles, moar problems](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
5. [We've got to move it](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
6. [Let's go continuous!](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
7. [One solution, but two new problems](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
8. [Let's fix this](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
9. [Time to go incremental](https://github.com/kristoffer-dyrkorn/software-renderer/tree/main/tutorial/1#readme)
