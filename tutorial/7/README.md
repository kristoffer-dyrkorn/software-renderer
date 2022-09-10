# A fast and correct triangle rasterizer

## Floating-point numbers: A solution and a problem

The rasterizer runs on floating point numbers, and uses the rotated vertex coordinates as input for the determinant calculations.

The artifacts we see are gaps between triangles. Does this problem somehow involve the fill rule? Well, yes, it does. Until now we have used an adjustment value of 1, and that has consistently nudged the determinant values correctly, so that pixels are not overdrawn and the triangles have no gaps.

A value of 1 is suitable when coordinates and determinants have integer values. In that situation, the resolution of the determinant value is 1 - so the smallest possible value that will create a separation between triangles is also 1.

But now we get gaps. The reason is that the determinant value has much higher resolution. We are now using floating point values to represent vertex coordinates in a continous space, and to find determinant values at pixel centers. The smallest resolution of floating point values is much smaller than an integer. Also, the resolution is not even a constant number.

The resolution of a floating point number depends on the magnitude of the value itself. Let's look at this in some more detail.

As an example, let's create a toy floating-point format that follows the same structure and principles as the floating point representation used in our code - the IEEE 755 standard. This exact format is not very useful but for now let's ignore that.

We set aside 3 decimal digits to store the number value. As in the floating point standard, the number of total digits is fixed - but the decimal can be placed anywhere between the digits. If we ignore the negative numbers, the smallest possible value we can represent is zero. The next values we can represent are 0.01, 0.02, 0.03 and so on. That is, we have a resolution of 0.01. At a value of 9.99 the next value becomes 10.0, and after that the next numbers are 10.1, 10.2 and 10.3. So, the resolution has become 0.1. After 99.9 comes 100, and then we are at integer resolution - all the way up to the maximum value of 999.

So - the smallest possible value to nudge our determinants with with will depend on the value of the determinant itself. That sounds a bit complicated.

Also, we hit upon another difficulty here: The calculation of the determinant value itself will not be exact. That is, we will lose some precesion in the subtractions and multiplications taking place in the determinant calculation itself. The reason is that numbers are not represented exactly - even when using double-precision floating point values, the standard for JavaScript. (As an example, see for yourself what 0.1 + 0.2 is, if both values are represented as floating point numbers.) And determinant calculations are known to be notoriously unprecise (see [this article]() for details).

It is likely possible to find a small adjustment value that is "the smallest possible" (to avoid visual artifacts like the gaps we saw), and at the same time sufficiently large to encompass precision loss in determinant calculations, but actually, we don't have to.

---

In principle, what happens in a floating point number representation is that you set aside a fixed number of digits to describe a number. The comma can, however, be located anywhere inbetween those digits (it is "floating"). So, for instance, if we assume we set aside 5 digits, PI would be represented as 3.1415. The number 16002/4 can be represented exactly, as 4000.5, but the number 10000 + 0.5 can not.

This varying resolution means you will lose precision when you perform calculations on floating point numbers having large differences in magnitude.

---

Instead, we can use a different representation of our vertex coordinates and determinant values. We can use what is called fixed point numbers.

Similar to the floating point representation, we can set a side a given number of digits, but instead of letting the comma be placed anywhere, we fix it: We place it at the same location for all numbers, ie independent of the magnitude of the value. Hence the name fixed point.

As an example, assume we use a fixed point representation of 4 digits in total. We use 2 digits for the integer part and 2 digits for the fractional part. If we ignore negative numbers we can now represent a numerical range from 0 to 99.99, and the resolution is constant: 0.01. And here comes an extra trick: We can use integers to store these numbers - by storing the original value multiplied by some constant number. Assuming we set aside 2 digits for the fractional part, the constant we need to multiply by is 100. So, the number 47.63 will then be represented as an integer value of 4673. We will need to multiply or divide when we convert back and forth between fixed point representation and a normal number representation, but as we will see shortly, that is not a problem.

And, we can use normal integer operations to do maths on numbers in the fixed point representation. So after the conversion to fixed point numbers they behave exactly as integers, and when can read out the values by converting back to a normal representation as needed.

Fixed point numbers is the industry standard way to handle the precision problem in triangle rasterization: We use a number representation that provides higher resolution than pure integers, gives exact results, and allows us to use fast integer operations in the calculations we need.

But - what happened to the adjustment value? Well - in a fixed point representation there is again such a thing as a smallest possible adjustment value. The resolution of the numbers we can represent is constant - and equals the value to adjust by, just as in our old integer-based code.

## Fixed-point numbers

How do we create fixed point numbers? If we take a floating point number, multiply it by some integer value, and round off the result so it becomes an integer, we have made a fixed point representation of the original floating point number.

The multiplication and rounding effectively subdivides the fractional part of the (floating point) input number into a fixed set of values - ie we quantize the fractional part. This means we cannot represent all floating point values this way, but we do get the advantage that all mathematical operations on numbers can be realized by their integer variants. So within the available precision we choose for our fixed point numbers, the calculations will be fast and exact (down to potential rounding errors in the least significant bit). And, as long as we multiply the input by a large enough number we will have enough resolution in the fractional part to reach the same animation smoothness as when using floating point coordinates when drawing pixels on screen. And we still keep the correctness we saw in the pure integer implementation. Put differently, we accept some (bounded) precision loss at the point of conversion to a fixed point representation, in exchange for correct - and faster - calculations inside the fixed point domain.

The number we choose to multiply by should be some number 2^n. Then we can convert from fixed point representation back to a normal number very efficiently, by bit-shifting the fixed point number n positions to the right. This bit-shifting is essentially the same as division without rounding, but only works when dividing by numbers 2^n. So that is why we choose to multiply by some number 2^n in the first place. The fixed-point-to-normal-number conversion removes the fractional part of the number, so it is essentially a `trunc`of `floor` operation. If we need to support proper rounding we should to add the value 0.5 (in fixed point representation) to the fixed point number before bit-shifting.

Now, which number 2^n is right? A larger number would give us higher resolution in the fractional part, but we need to keep both the integer and fractional part of our fixed point number within a number of bits that is easily supported by our hardware. We choose to store the fixed point numbers inside a 32-bit (signed) integer type. We then reserve one bit of storage for the sign (since we need to support negative values) so the total amount of bits we can spend on the integer part and the fractional part is 31.

If we assume the x and y screen coordinates will be inside the range 0..2048, the integer part would fit inside 11 bits (2^11 = 2048). However, when we calculate the determinant we multiply two fixed point numbers together, so we must reserve twice that space to store the intermediate value. So we need 22 bits for the magnitude - and can spend up to 9 of the remaining bits for the fractional part.

## Subpixels

Why are we doing this? What is the relation between fixed point numbers and our pixels on screen?

It is here useful to introduce the concept of subpixels. Each whole pixel we see on screen can be divided into smaller invisible parts, subpixels. The integer part of a fixed point number maps to whole pixels, and the fractional part maps to subpixels. And using fixed point coordinates lets us adress each subpixel individually and exactly.

Another way to look at it is that we create a higher-resolution "invisible grid" of the screen, and perform exact integer calculations on that grid, while keeping all our drawing operations running on the normal pixel grid. Also, all incoming floating point coordinates undergo the same quantization step when converted to fixed point numbers, so we can say they are consistently snapped to their nearest subpixel. This is the same type of shifting as when rounding floating point numbers to integers, but now the amount is much smaller, and not noticeable.

## Code

After some testing of different subpixel resolutions, it becomes clear that there are few noticeable improvements in the smoothness of the animation when we start spending more than 4 bits on the fractional part of our fixed point numbers. So we have chosen that representation here. (The standard for GPUs nowadays seems to be 8 bits of subpixel resolution.)

Choosing 4 bits means we multiply all incoming floating point numbers by 2^4 = 16 before rounding the result off to an integer - and then storing that result in an integer variable. To get from a fixed point representation back to a normal number we shift the fixed point number right by 4 places. As mentioned, this conversion essentially is a truncation (a `floor` operation), so to support rounding we will need to add 0.5 in fixed point representation (which here will mean an integer value of 8) to the number before shifting to the right.

In the application code, all of the fixed point operations we need for the rasterizer is implemented in the class `FixedPointVector`. We will not go through that code here. However, in the next section we will look at how we convert the rasterizer to using fixed point numbers.
