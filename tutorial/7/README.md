# A fast and correct triangle rasterizer

## Floating-point numbers

The rasterizer runs on floating point numbers. Unfortunately, floating point calculations are not exact, and as we have seen, we can still get visual artifacts - even when using double-precision floats, which is the JavaScript [standard for numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). Also, although correctness is the most important thing in a rasterizer, it is inconvenient that floating point operations usually take longer than their integer counterparts.

We need exactness - and hopefully without any large performance penalties. What to do?

## Fixed-point numbers

We can use a hybrid number representation called fixed point numbers. If we take a floating point number, multiply it by some constant integer, and round off the result to become an integer, we have a fixed point representation of the original floating point number.

The multiplication and rounding effectively subdivides the fractional part of the input number into a fixed set of values - ie we quantize the fractional part. This means we cannot represent all floating point values this way, but do get the advantage that mathematical operations on numbers are shifted over to their integer variants. So within the available precision we choose for our fixed point numbers, the operations we have will be fast and exact (down to potential rounding errors in the least significant bit). As long as we multiply the input by a large enough number we will have enough resolution in the fractional part to reach the same visual fidelty as when using floating point coordinates. And still keep the correctness we saw in the pure integer implementation. Put differently, we accept some (bounded) precision loss at the conversion to a fixed point representation, in exchange for correct - and faster - calculations within the fixed point domain.

The number we choose to multiply by should be some number 2^n. Then we can convert from fixed point representation back to a normal number very efficiently, by bit-shifting the fixed point number n positions to the right. This bit-shifting is essentially the same as division without rounding, but the trick only works for numbers 2^n. If we need to support division with rounding we should to add the value 0.5 (in fixed point representation) before shifting.

Which number 2^n is right? A larger number would give us higher resolution in the fractional part, but we need to keep both the integer and fractional part of our fixed point number within a 32-bit (signed) integer type. We reserve one bit of storage for the sign (we need to support negative values) so the total amount of bits we can spend is 31.

If we assume the x and y screen coordinates will be in the range 0..2048, the integer part would fit inside 11 bits (2^11 = 2048). However, when we calculate the determinant we multiply two fixed point numbers, meaning we must reserve space for double that number - 22 bits. Under this assumption we can spend up to 9 of the remaining bits for the fractional part.

## Subpixels

Why are we doing this? What is the relation between fixed point numbers and our pixels on screen?

In short, when we use fixed point numbers for screen coordinates we subdivide each whole pixel into subpixels. The integer part of the number matches the whole pixels, an the fractional part matches the subpixels.

This means we create a larger resolution "invisible grid" of the screen, and perform precise integer calculations on that grid while keeping all drawing operations running on the normal pixel grid. Moreover, all incoming floating point coordinates undergo the same quantization step, where we snap the incoming values to subpixel values. This gives us consistency, which leads to correct separations of triangle edges.

By using fixed point numbers, we can 1) keep the smooth movements, 2) avoid gaps and overlaps and 3) use efficient integer operations.

If you look at the animation smoothness at various subpixel resolutions, there are few noticeable improvements past 4 bits for the fractional part. So we have chosen that here. (The standard for GPUs nowadays seems to be 8 bits.)

Choosing 4 bits means we multiply incoming floating point numbers by 2^4 = 16 before rounding off to an integer. To get from a fixed point representation back to a normal number (an integer) we shift right by 4 places.

All of our needed operations is implemented in the class `FixedPointVector`, and we will not go through that code now. However, in the next section we will look at how we convert the rasterizer code from using floating point numbers to using the fixed point representation.
