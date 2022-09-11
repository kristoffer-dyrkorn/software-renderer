# Time to go incremental

In this section we will improve the performance of the rasterizer. We would like to draw our triangles much faster so we can show and animate a lot of triangles on screen at the same time. Hopefully we can do this without making the code much more complicated or hard to read.

One way to optimize code for performance is to look for blocks of code that are executed many times, and see if there is a way to change the work that happens there into something that runs faster. We can also try to redistribute work - so that tasks that are executed many times are moved to a place where they need to happen fewer times. Of course, we must keep the total computation unchanged so the program works the same way as before.

The plan here is to restructure the work so the heavy, time-consuming calculations happen once per triangle draw call. Also, we will make the calculations that happen once per pixel run as quickly as possible.

## Going incremental

Right now, we calculate one determinant and evaluate one fill rule per edge per pixel inside the bounding box. That is, we calculate everything from scratch for each pixel and do not reuse any of the previous calculations.

A common optimization trick is to try to calculate things incrementally. That means to perform a potentially heavy calculation once, and then to update the result as needed with small (lighter) changes. This trick depends on whether those changes can be calculated easily.

We can apply this trick here as well. We can do the full determinant and fill rule calculation for just one pixel, and then apply the change - when going from one pixel to the next - on top of that. In this situation, we are lucky, since if you do the math (which we will not look at here) the change in determinant value per pixel - both horizontally and vertically - is constant. It is also easily calculated. That means that we can apply it to the current (running) determinant value very quickly.

We use the top left corner of the bounding box as the starting point - and do the full set of calculations there.

(L43)

We then calculate the three determinants for that pixel, and put the result in the `wLeft` variable. We also calculate the fill rule adjustment at this point.

(L45-49)

Since the fill rule adjustments are constant across entire triangle edges, we can calculate all determinants for the first pixel, apply the adjustments, and then all the consecutive pixels that we are going to draw inside the bounding box will already have been adjusted. So we only need to evaluate the fill rule once. The incremental calculations make the adustment stick.

We now calculate the change in determinant values when moving from one pixel to the next, both horizontally (`dwdx`) and vertically (`dwdy`). As you can see, finding the change per pixel is a very lightweight operation:

(L55-66)

We are now mostly ready. For each new horizontal line in the triangle, we use the current `wLeft` value as a starting point, and copy that value over to `w` - which contains the final determinant value at a given pixel location. Then, for each pixel `x` we add `dxdw` onto `w`. (Here, we actually subtract - due to the way we calculated the change, but we could also have used a negative change value, and used addition instead.) As we jump to the next horizontal line, we then add `dwdy` onto the `wLeft` value, and are then ready for the next loop iteration.

(L74-94)

We also rephrase the expression for evaluating `w`: The values in `w` are now integers and we can bitwise OR the three components together before testing whether the resulting value is larger than, or equal to, zero. This reduces the risk of branch misprediction, something that can be very time-consuming on modern CPUs.

Looking at the code now, we see that the innermost loop only consists of copying values from one variable to another - or adding/subtracting values. There is no obvious way to further simplify how we evaluate `w` for each pixel. Also, we take care to instantiate all objects before we enter the loops that draw pixels. This way we don't need to spend time allocating memory, and the browser's need to do garbage collection is reduced drastically.

We now call it a day. Drawing a single triangle takes 0.23 ms on my machine. That is 10% of the time the previous version needed! We have achieved a 10x speedup by rephrasing our calculations so that we get the needed results incrementally - instead of from scratch - for each pixel.

The result is a fast, smooth and correct triangle rasterizer. Not bad!
