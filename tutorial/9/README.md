# A fast and correct triangle rasterizer

In this section we will improve the performance of the rasterizer.

One way to optimize is to look for blocks of code are executed many times, and see if there is a way to make the work that happens there lighter or faster. We can also try to move work that happens _many_ times to a place where it happens _fewer_ times. Of course, we must keep the outcome of the code unchanged.

The plan here is to restructure the work so the heavy calculations happen once per triangle draw call. Also, we will try to make the remaining calculations, which happen once per pixel, as light as possible.

## Going incremental

Right now, we calculate one determinant and evaluate one fill rule per edge per pixel inside the bounding box. We calculate everything from scratch and do not reuse any previous calculation.

A common optimization trick is to try to calculate things incrementally. That means to perform a potentially heavy calculation once, and to try to update the result with small (lighter) changes as needed later.

We can apply this trick here as well. We can do the full determinant and fill rule computation for one pixel, and then apply the change - when going from one pixel to the next - on top of that. The change per pixel is constant, easily calculated, and applying it to the current result is fast.

We use the top left corner of the bounding box as the starting point - and do the full evaluation there.

(L43)

We then calculate the three determinants for that pixel, and put that in the `wLeft` variable. We also calculate the fill rule adjustment at this point.

(L45-49)

The nice thing here is that as soon as we have calculated the determinants for the first pixel, we can apply the fill rule adjustments, and then all consecutive pixels within the bounding box will be adjusted. So we only need to evaluate the fill rule once - the incremental calculations makes the adustment stick.

We can now calculate the change in determinant values when moving from one pixel to the next, both horizontally (`dwdx`) and vertically (`dwdy`). As you can see, finding the change per pixel is a lightweight calculation:

(L55-66)

We are now mostly ready. For each new line, we use the current `wLeft` value as a starting point, and copy that value over to `w` - which contains the final determinant value we would like to evaluate. Then, for each pixel `x` we add `dxdw` onto `w` (here we subtract due to the way we defined the delta, we could also have defined a delta with the opposite sign, and used addition instead). For each new line, we add `dwdy` onto the `wLeft` value, and are then ready for the next loop iteration.

(L74-94)

We also rephrase the expression for evaluating `w`: The values in `w` are now integers and we can bitwise OR the three components together before testing whether the resulting value is larger than, or equal to, zero. This saves a little bit of branching, which can be very expensive on modern CPUs.

Looking at the code now, we see that the innermost loop only consists of copying values from one variable to the next - or adding/subtracting values. The evaluation of `w` cannot be further simplified, so we call it a day.

Triangle drawing now takes 0.23 ms on my machine. That is 10% of the time the previous version needed! We have achieved a 10x speedup by rephrasing the operations we need so we can perform incremental calculations instead of full evaluations for each pixel.

The result is a fast, smooth and correct triangle rasterizer.
