# One solution, but two new problems

## Floating-point numbers

The rasterizer runs on floating point numbers, and uses the rotated vertex coordinates as input for the determinant calculations.

The artifacts we see are gaps between triangles. Does this problem somehow involve the fill rule? Well, yes, it does. Until now we have used an adjustment value of 1, and that has consistently nudged the determinant values so that pixels are not overdrawn, and the triangles have no gaps.

A value of 1 is suitable when coordinates and determinants have integer values. Then the resolution of the determinant value equals 1. In other words, the smallest possible value that will create a separation between triangles is 1.

But now we get gaps. The reason is that the determinant value has higher resolution, since we now are using floating point values - both for vertex coordinates and when calculating determinant values. The smallest possible difference between two floating point values is much smaller than 1.

Actually, that difference is not even a constant number. The resolution of a floating point number depends on the value itself. Let's look at this in detail.

As an example, let's create a toy floating point format that follows the same principles as the floating point representation used in our code. The format here might not be particularly useful, but for now let's ignore that.

Let's set aside 3 decimal digits to store the numberic value. As in the floating point standard, the total number of digits is fixed, but the decimal can be placed anywhere between the digits. If we ignore negative numbers, the smallest possible value we can represent is 0. The next larger values are 0.01, 0.02, 0.03 and so on. That is, we have a resolution of 0.01. At a value of 9.99 the next larger value becomes 10.0, and after that the next numbers are 10.1, 10.2 and 10.3. So, the resolution has become 0.1. After 99.9 comes 100, and then we are at integer resolution - all the way up to the maximum value of 999.

So - the smallest possible value we should use when nudging our determinant will depend on the value of the determinant itself. That sounds a bit complicated.

We also hit upon another difficulty here: The calculation of the determinant value itself will not be exact. We use multiplication and subtraction to calculate determinants based on vertex coordinates, and those operations are lossy in the floating point domain. So the determinant might be wrong - or, at least differ somewhat from what the precise value, based on the vertex coordinates, is. And this might affect the logic in our tie-breaker rule.

As an example of precision issues, see for yourself what 0.1 + 0.2 is in JavaScript. Although the language we use here uses double-precision floating point values as standard, even that is not sufficient. And, determinant calculations are known to be numerically unstable (see for example [this article](https://observablehq.com/@mourner/non-robust-arithmetic-as-art)).

It may be possible to find a small adjustment value that is both "the smallest possible" (to avoid visual artifacts like the gaps we saw), and at the same time sufficiently large to encompass slight errors in the determinant calculations.

But actually, we don't have to. Instead, we can use a different representation of our vertex coordinates and determinant values. We can use what is called fixed point numbers. And then, seemingly by magic, get rid of both problems!

What is a fixed point number? Let's have a look.

Like in a floating point representation, we will set a side a given number of digits. But instead of letting the comma be placed anywhere between digits, we will fix it: We place it at the same location for all numbers, hence the name fixed point.

As an example, assume we set a side 4 digits in total, and use 2 digits for the integer part and 2 digits for the fractional part of a number. If we ignore negative numbers we can now represent a numerical range from 0 to 99.99, and the resolution is constant across the entire value range: 0.01. This is convenient. And here comes an extra trick: We can use integers to store these numbers - by storing the original value multiplied by a constant. Assuming we set aside 2 digits for the fractional part, the constant we will then need to multiply by is 100 (10^2). So, the number 47.63 will be represented - and stored - as an integer value of 4673. We can even use normal integer operations to do maths on fixed point numbers. They behave just like integers for addition, subtraction, multiplication and division. When we need to read out the actual value, we divide the fixed point number by the same constant as we multiplied by earlier.

Fixed point numbers is the industry standard way to handle the precision problem in triangle rasterization: We use a number representation that provides higher resolution than pure integers, but still gives exact results, and allows us to use fast integer operations for the calculations we need.

But - what happened to the adjustment value? In a fixed point representation there is again such a thing as a smallest possible adjustment value. Our fixed point numbers have a known, constant resolution, and that is exactly the value we want to adjust by. Just as in our old integer-based code. So things are now under control. But now, let us look some more at how we use fixed point numbers.

## Practicalities

How do we create fixed point numbers? If we take a floating point number, multiply it by some integer value, and round off the result to an integer, we have made a fixed point representation of the original floating point number.

The multiplication and rounding effectively subdivides the fractional part of the original number into a fixed set of values - ie we quantize the fractional part. This means that we cannot represent all values that a floating point number might have, but we do get the advantage that all mathematical operations on numbers can be realized by their integer variants. So within the available precision we choose for our fixed point numbers, the calculations will be fast and exact. And, as long as we multiply the input by a large enough number we will achieve enough resolution in the fractional part to reach the same animation smoothness as we had when using floating point numbers. At the same time, we still keep the correctness we saw in the pure integer implementation. Put differently, we accept some (bounded) precision loss when converting to fixed point, in exchange for correct - and faster - calculations.

The number we choose to multiply by should be some number 2^n. Then we can convert from a fixed point representation back to a normal number very efficiently. Instead of dividing by 2^n we can bit-shift the number n positions to the right. That is much much faster - but only works for division by 2^n.

The shifting gives the same result as division without rounding. It will also remove the fractional part of the number, so it is essentially a `trunc` or `floor` operation. If we need to support proper rounding we should add the value 0.5 (converted to fixed point representation) before bit-shifting.

Now, which number 2^n would be right to use? A large number will give us high resolution in the fractional part, but take more space (more bits of storage). And we need to keep both the integer and fractional part within a number of bits that is easily supported by our hardware. Here we choose to use a 32-bit (signed) integer type. We must reserve one bit of storage for the sign (since we need to support negative numbers), so the total amount of bits we can spend on the integer and fractional parts are 31.

If we assume the x and y screen coordinates will be inside the range 0..2048, the integer part would fit inside 11 bits (2^11 = 2048). However, when we calculate the determinant we multiply two fixed point numbers together, and to handle that properly we must set aside double that space. So we need 22 bits for the magnitude - and can spend up to 9 of the remaining bits for the fractional part.

## Fixed point numbers, pixels and subpixels

The structure of a fixed point number actually has some relation to the pixels we see on screen.

It is here useful to introduce the concept of subpixels. Let's assume that each whole pixel we see on screen can be divided into smaller invisible parts, subpixels. The integer part of a fixed point screen coordinate lets us address a whole pixels, and the fractional part lets us address subpixels. So using fixed point coordinates lets us address each subpixel individually and exactly.

Another way to look at this is to imagine that we create a higher-resolution "invisible grid" of the screen, and perform exact integer calculations on that grid, all while keeping our drawing operations running on the normal pixel grid. In addition, all floating point coordinates undergo the same quantization step when they are converted to fixed point numbers. That means they will be snapped to their nearest subpixel location. This is the same type of pixel shifting we saw as when we rounded floating point numbers to integers, but now the magnitude is much smaller, and it does not visibly affect the smoothness of the animation.

## Code

How smooth does the animation need to be? How many bits should we set aside for the fractional part? If you test some values, it becomes clear that you get few noticeable improvements after spending more than 4 bits on the fractional part. So we have chosen that convention here. (The standard for GPUs nowadays seems to be 8 bits of subpixel resolution.)

Choosing 4 bits means we multiply all incoming floating point numbers by 2^4 = 16 before rounding the result off to an integer - and then store that result in an integer variable. To get from a fixed point representation back to a normal number we shift the fixed point number right by 4 places. As mentioned, this conversion essentially is a truncation (a `floor` operation), so to do proper rounding we will need to add 0.5 (in fixed point representation, so, an integer value of 8) to the number before shifting to the right.

In the application code, all of the fixed point operations we need for the rasterizer are implemented in the class `FixedPointVector`. We will not go through that code here. However, in the next section we will look at how we convert the rasterizer to use this new and exciting representation.
