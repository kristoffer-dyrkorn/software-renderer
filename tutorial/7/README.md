# A fast and correct triangle rasterizer

## Floating-point numbers

The rasterizer now runs on floating point numbers, and uses the rotated vertex coordinates directly.
The artifacts we see are gaps between triangles. Does this problem somehow involve the fill rule? Well, yes, it does. Until now we have used an adjustment value of 1, and that has consistently nudged the determinant values correctly, so that pixels are not overdrawn - and the triangles also have no gaps.

Now, with the higher resolution of floating point values, we do get gaps. It turns out the adjustment value is too large. We could look for a new smaller value and use that instead, but it seems it would be hard to find a right value. We have no guidance on how to find our value.

Let's have a look at what the determinant value actually is.

Cross product, difference. Imprecision.
near triangle edges the determinant will be small.
Adjustment value is also small - and of same magnitude as the derminant itself.
worst case scenario: subtraction of two small floating point values.
the values involved in the calculations will depend on triangle sizes, and ensuring correct floating point operations in all cases (ie finding the magic value that always will make our adjustments correct) would be hard.

- even when using double-precision floats, which is the JavaScript [standard for numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).

The solution here is to change the approach. The industry standard way to handle the problem is to use a different representation for numbers - one that will give exact results. Although correctness is the most important thing in a rasterizer, it is also inconvenient that the floating point operations usually take longer than their integer counterparts.

We need exactness - and hopefully without performance penalties. What to do?

## Fixed-point numbers

We can use a hybrid number representation called fixed point numbers. If we take a floating point number, multiply it by some constant integer, and round off the result to become an integer, we have a fixed point representation of the original floating point number.

The multiplication and rounding effectively subdivides the fractional part of the input number into a fixed set of values - ie we quantize the fractional part. This means we cannot represent all floating point values this way, but do get the advantage that mathematical operations on numbers are shifted over to their integer variants. So within the available precision we choose for our fixed point numbers, the operations we have will be fast and exact (down to potential rounding errors in the least significant bit). As long as we multiply the input by a large enough number we will have enough resolution in the fractional part to reach the same visual fidelty as when using floating point coordinates. And still keep the correctness we saw in the pure integer implementation. Put differently, we accept some (bounded) precision loss at the conversion to a fixed point representation, in exchange for correct - and faster - calculations within the fixed point domain.

The number we choose to multiply by should be some number 2^n. Then we can convert from fixed point representation back to a normal number very efficiently, by bit-shifting the fixed point number n positions to the right. This bit-shifting is essentially the same as division without rounding, but the trick only works for numbers 2^n. The conversion removes the fractional part of the number, so it is essentially a `floor` operation. If we need to support conversion with proper rounding we should to add the value 0.5 (in fixed point representation) before shifting.

Which number 2^n is right? A larger number would give us higher resolution in the fractional part, but we need to keep both the integer and fractional part of our fixed point number within a 32-bit (signed) integer type. We reserve one bit of storage for the sign (we need to support negative values) so the total amount of bits we can spend is 31.

If we assume the x and y screen coordinates will be in the range 0..2048, the integer part would fit inside 11 bits (2^11 = 2048). However, when we calculate the determinant we multiply two fixed point numbers, meaning we must reserve space for double that number - 22 bits. Under this assumption we can spend up to 9 of the remaining bits for the fractional part.

## Subpixels

Why are we doing this? What is the relation between fixed point numbers and our pixels on screen?

It is here useful to introduce the concept of subpixels. Each whole pixel we see on screen can be divided into smaller invisible parts, subpixels. And using fixed point coordinates lets us adress each subpixel individually and exactly. The integer part of a fixed point number maps to whole pixels, and the fractional part maps to subpixels.

Another way to look at it is that we create a larger resolution "invisible grid" of the screen, and perform precise integer calculations on that grid while keeping all our drawing operations running on the normal pixel grid. Also, all incoming floating point coordinates undergo the same quantization step when converted to fixed point numbers - they are snapped to their nearest subpixel. This gives us consistency, which leads to correct separations of triangle edges.

This way we can 1) keep the smooth movements, 2) avoid gaps and overlaps and 3) use efficient integer operations.

If we look at our application, and consider the smoothness of the animation at various subpixel resolutions, there are few noticeable improvements past 4 bits for the fractional part. So we have chosen that subpixel resolution here. (The standard for GPUs nowadays seems to be 8 bits.)

Choosing 4 bits means we multiply all incoming floating point numbers by 2^4 = 16 before rounding the result off to an integer. To get from a fixed point representation back to a normal number we shift right by 4 places. As mentioned, this conversion essentially is a `floor` operation, to support rounding we would need to add 0.5 (in fixed point representation, which here is 8) to the number before shifting.

All of the needed fixed point operations is implemented in the class `FixedPointVector`, and we will not go through that code here. However, in the next section we will look at how we convert the rasterizer code from using floating point numbers to using the fixed point representation.
