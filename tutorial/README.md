# A fast and correct triangle rasterizer

In this article series, you will get to learn how a computer draws a triangle on screen. This may sound like a silly thing to study, but if you go through the series you will likely see that there are details, considerations, tradeoffs and complexity that you would not have thought about up front.

This is not unusual in the field of computer graphics: If you stumble upon a problem and ask yourself: "Can it be that hard" - then well, yes, sometimes it can! Drawing a triangle on screen correctly and efficiently is certainly not trivial. And at the same time, it is considered an "old" and "already solved" problem. However, that should not stop us from diving into the subject. Depending on your experience and skill level there are likely things to learn here, things that will be applicable in other fields of programming - either related to maths, numerics, computer graphics or performance optimization.

To begin with, we must have a look at what it means to draw a triangle. The process is often called rasterization. The reason is that a triangle usually is defined by three points (vertices). And by drawing a line between each of the three points you get the triangle. However, on computer screens we cannot draw lines directly, we need to draw pixels. Put differently: We need to change the colors on a given set of pixels in our screen. The pixels form a regular grid, a _raster_ and that explains the name: By rasterization we mean the process of figuring out how a triangle (actually: any graphical object defined by points or lines) should be drawn on a pixel screen.

The series is structured as follows: First, you will get to know the principles behind triangle rasterization and the method we will be using here. Then we will gradually refine the code as we test the code and discover needs for various types of improvements. The final section looks at performance optimization - and as you will see, the changes we do to our code there will make the final version run 10 times as fast as the unoptimized one.

Here are the articles, please go ahead!

1. An overview of the method
2. Setting up the browser to draw pixels
3. The first, basic rasterizer
4. Moar triangles, moar problems
5. We've got to move it
6. Let's go continuous!
7. One solution, but two new problems
8. Let's fix this
9. Time to go incremental
