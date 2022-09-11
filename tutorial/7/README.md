# A fast and correct triangle rasterizer

## Floating-point numbers: A solution _and_ a problem

The rasterizer runs on floating point numbers, and uses the rotated vertex coordinates as input for the determinant calculations.

The artifacts we see are gaps between triangles. Does this problem somehow involve the fill rule? Well, yes, it does. Until now we have used an adjustment value of 1, and that has consistently nudged the determinant values so that pixels are not overdrawn and triangles have no gaps.

A value of 1 is suitable when coordinates and determinants have integer values. The resolution of the determinant value then equals 1, so the smallest possible value that will create a separation between triangles is also 1.

But now we get gaps. The reason is that the determinant value has higher resolution. We are now using floating point values for vertex coordinates and when calculating determinant values at pixel centers. The resolution of floating point values is much smaller than 1.

Actually, the resolution is not even a constant number. The resolution of a floating point number depends on the value itself. Let's look at this in some more detail.

As an example, let's create a toy floating-point format that follows the same principles as the floating point representation used in our code. The format here is not very useful, but for now let's ignore that.

Let's set aside 3 decimal digits to store the value. As in the floating point standard, the total number of digits is fixed, but the decimal can be placed anywhere between the digits. If we ignore negative numbers, the smallest possible value we can represent is zero. The next larger values are 0.01, 0.02, 0.03 and so on. That is, we have a resolution of 0.01. At a value of 9.99 the next larger value becomes 10.0, and after that the next numbers are 10.1, 10.2 and 10.3. So, the resolution has become 0.1. After 99.9 comes 100, and then we are at integer resolution - all the way up to the maximum value of 999.

So - the smallest possible value to nudge our determinant with will depend on the value of the determinant itself. That sounds a bit complicated.

Also, we hit upon another difficulty here: The calculation of the determinant value itself will not be exact. That is, we will lose some precision in the subtractions and multiplications underway - and that could affect the logic in our tie-breaker rule. The reason is that numbers are not represented exactly in computers. (As an example, see for yourself what 0.1 + 0.2 is in JavaScript.) Double-precision floating point values, the standard for JavaScript, have very high resolution, but determinant calculations are known to be a case that needs extra concern (see [this article]() for details).

It may be possible to find a small adjustment value that is "the smallest possible" (to avoid visual artifacts like the gaps we saw), and at the same time sufficiently large to encompass precision loss in determinant calculations.

But actually, we don't have to. Instead, we can use a different representation of our vertex coordinates and determinant values. We can use what is called fixed point numbers.

Similar to the floating point representation, we will set a side a given number of digits. But instead of letting the comma be placed anywhere between digits, we fix it: We place it at the same location for all numbers, hence the name fixed point.

As an example, assume we set a side 4 digits in total, and use 2 digits for the integer part and 2 digits for the fractional part. If we ignore negative numbers we can now represent a numerical range from 0 to 99.99, and the resolution is constant across the entire value range: 0.01. This is convenient. And here comes an extra trick: We can use integers to store these numbers - by storing the original value multiplied by a constant. Assuming we set aside 2 digits for the fractional part, the constant we will need to multiply by is 100 (10^2). So, the number 47.63 will be represented as an integer value of 4673. We can even use normal integer operations to do maths on fixed point numbers. They behave just like integers for addition, subtraction, multiplication and division. When we need to read out the value again, we divide the fixed point number by the same constant as we multiplied by earlier.

Fixed point numbers is the industry standard way to handle the precision problem in triangle rasterization: We use a number representation that provides higher resolution than pure integers, gives exact results, and allows us to use fast integer operations in the calculations we need.

But - what happened to the adjustment value? Well - in a fixed point representation there is again such a thing as a smallest possible adjustment value. Our fixed point numbers have a known, constant resolution, and that is exactly the value we want to adjust by. Just as in our old integer-based code. So things are now under control. But now, let us look some more at how we use fixed point numbers.

## Practicalities

How do we create fixed point numbers? If we take a floating point number, multiply it by some integer value, and round off the result to an integer, we have made a fixed point representation of the original floating point number.

The multiplication and rounding effectively subdivides the fractional part of the original number into a fixed set of values - ie we quantize the fractional part. This means that we cannot represent all values that a floating point number might have, but we do get the advantage that all mathematical operations on numbers can be realized by their integer variants. So within the available precision we choose for our fixed point numbers, the calculations will be fast and exact (down to potential rounding errors in the least significant bit). And, as long as we multiply the input by a large enough number we will have enough resolution in the fractional part to reach the same animation smoothness as when we used floating point coordinates. At the same time, we still keep the correctness we saw in the pure integer implementation. Put differently, we accept some (bounded) precision loss when converting to fixed point, in exchange for correct - and faster - calculations inside the fixed point domain.

The number we choose to multiply by should be some number 2^n. Then we can convert from fixed point representation back to a normal number very efficiently. Instead of dividing by 2^n we can bit-shift the number n positions to the right. That is much much faster - but only works for division by 2^n.

The shifting gives the same result as division without rounding. It will also remove the fractional part of the number, so it is essentially a `trunc`of `floor` operation. If we need to support proper rounding we should to add the value 0.5 (in fixed point representation) before bit-shifting.

Now, which number 2^n would be right to use? A large number will give us high resolution in the fractional part, but we need to keep both the integer and fractional part within a number of bits that is easily supported by our hardware. Here we choose to use a 32-bit (signed) integer type. We must reserve one bit of storage for the sign (since we need to support negative values), so the total amount of bits we can spend on the integer and fractional parts are 31.

If we assume the x and y screen coordinates will be inside the range 0..2048, the integer part would fit inside 11 bits (2^11 = 2048). However, when we calculate the determinant we multiply two fixed point numbers together, and to handle that we must set aside double that space. So we need 22 bits for the magnitude - and can spend up to 9 of the remaining bits for the fractional part.

## Fixed point numbers, pixels and subpixels

The structure of a fixed point number actually has some relation to the pixels we see on screen.

It is here useful to introduce the concept of subpixels. Let's assume that each whole pixel we see on screen can be divided into smaller invisible parts, subpixels. The integer part of a fixed point screen coordinate lets us address a whole pixels, and the fractional part lets us address subpixels. So using fixed point coordinates lets us address each subpixel individually and exactly.

Another way to look at this is to imagine that we create a higher-resolution "invisible grid" of the screen, and perform exact integer calculations on that grid, all while keeping our drawing operations running on the normal pixel grid. In addition, all floating point coordinates undergo the same quantization step when they are converted to fixed point numbers. That means they will be snapped to their nearest subpixel location. This is the same type of pixel shifting we saw as when we rounded floating point numbers to integers, but now the amount is much smaller, and it does not affect the smoothness of the animation.

## Code

How smooth does the animation need to be? How many bits should we set aside for the fractional part? If you test some different resolutions, it becomes clear that you get few noticeable improvements after spending more than 4 bits on the fractional part. So we have chosen that convention here. (The standard for GPUs nowadays seems to be 8 bits of subpixel resolution.)

Choosing 4 bits means we multiply all incoming floating point numbers by 2^4 = 16 before rounding the result off to an integer - and store that result in an integer variable. To get from a fixed point representation back to a normal number we shift the fixed point number right by 4 places. As mentioned, this conversion essentially is a truncation (a `floor` operation), so to support rounding we will need to add 0.5 (in fixed point representation, so, an integer value of 8) to the number before shifting to the right.

In the application code, all of the fixed point operations we need for the rasterizer is implemented in the class `FixedPointVector`. We will not go through that code here. However, in the next section we will look at how we convert the rasterizer to use this representation.
