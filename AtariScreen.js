/* AtariScreen v0.1 (2014-02-06)
 *
 * Emulate bit plane screen on an Atari 16/24 bit computer.
 *
 * Uses HTML5 Canvas
 *
 * Example usage:
 * 
 *   var testPlace = document.getElementById('test');
 *   testScreen = new AtariScreen(0, testPlace, 'myTest');
 *    :
 *   testScreen.Display();
 *
 */


/* Create AtariScreen object
 * 
 * This creates a canvas object emulating an ST(E) screen.
 *
 * mode = ST(E) graphics mode (integer 0-2)
 * element = HTML element to attach canvas to
 * name = ID name of object (string)
 */
function AtariScreen(mode, element, name) {
    this.canvas = element.appendChild(document.createElement('canvas'));
    this.canvas.id = name;
    this.canvas.width = 640;
    this.canvas.height = 400;
    this.screen_memory = new Uint16Array(16000);
    this.cycles = new Array();
    this.mode = this.SetMode(mode);
}

/* Set AtariScreen graphics mode and initialise with default palette
 *
 * newmode = graphics mode
 *
 * These are based on the standard ST(E) graphics modes:
 *   0 = Low res, 320 x 200, 16 colours
 *   1 = Med res, 640 x 200, 4 colours
 *   2 = Hi res,  640 x 400, monochrome
 */
AtariScreen.prototype.SetMode = function(newmode) {
    newmode = (typeof newmode === "undefined") ? 0 : newmode; // If undefined, set to lores
    newmode = ((0 > newmode) || (newmode > 2)) ? 0 : newmode; // If outside range, set to lores
    switch (newmode) {
    case 0:
        // ST lo-res
        {
            this.planes = 4;
            this.scaleX = 2;
            this.scaleY = 2; // 320 x 200
            this.width = 320;
            this.height = 200;
            this.SetPalette(
                new Uint16Array([0xFFF, 0xF00, 0x0F0, 0xFF0, 0x00F, 0xF0F, 0x0FF, 0x555, 0x333, 0xF33, 0x3F3, 0xFF3, 0x33F, 0xF3F, 0x3FF, 0])
            );
            break;
        }
    case 1:
        // ST med-res
        {
            this.planes = 2;
            this.scaleX = 1;
            this.scaleY = 2; // 640 x 200
            this.width = 640;
            this.height = 200;
            this.SetPalette(new Uint16Array([0xFFF, 0xF00, 0x0F0, 0]));
            break;
        }
    case 2:
        // ST hi-res
        {
            this.planes = 1;
            this.scaleX = 1;
            this.scaleY = 1;  // 640 x 400
            this.width = 640;
            this.height = 400;
            this.SetPalette(new Uint16Array([0, 0xFFF]));
            break;
        }
    }
    this.mode = newmode;
    return newmode;
};

/* Display AtariScreen on canvas
 *
 * This plots the planar data in the AtariScreen buffer as a true colour 
 * image onto the canvas according to the colour register values.
 */
AtariScreen.prototype.Display = function () {
    // Get the canvas and fill out with the background colour.
    var context = this.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);     // Reset scaling
    context.scale(this.scaleX, this.scaleY);    // Set scaling to the ST(E) graphics mode
    context.fillStyle = this.canvas_palette[0];
    context.fillRect(0, 0, this.width, this.height);
    // Now initialise the variables need for our calculations
    var planes = this.planes;
    var length = (this.screen_memory.length / planes);
    var width = this.width;
    var x = 0;
    var y = 0;
    var word_length = 16 - 1;
    var i, j, k, l, start_plane, pixel_colour;
    // Set up a temporary buffer for the plane data for a 16 pixel area
    var plane_data = new Array(planes);
    // Now we start going through the screen buffer (array of words)
    for (i = 0; i < length; i++) {
        start_plane = (i * planes);
        // Get the planar data for a 16 pixel length of screen
        for (k = 0; k < planes; k++) 
            plane_data[k] = this.screen_memory[start_plane + k];
        // Now we have the plane data for a 16 pixel area, start
        // iterating over each of the 16 pixels.
        for (j = word_length; j > -1; --j) { // Starting with the last plane, the HSB of the colour value of the pixel, and going downwards...
            pixel_colour = 0;                    // Initialise pixel colour value
            for (l = 0; l < planes; l++)         // Iterate over each of the planes
                if (plane_data[l] & (1 << j))    // If the masked pixel exists in plane data
                    pixel_colour += 1 << l;      // Add the plane's binary digit value to the pixel colour value
            if (pixel_colour > 0) {              // If the result is not the background colour...
                context.fillStyle = this.canvas_palette[pixel_colour]; // Set the pixel colour...
                context.fillRect(x, y, 1, 1);                          // ... And plot it
            }
            x++;               // Go onto the next pixel.
            if (x >= width) {  // If we are at the end of the row, reset to the next row
                x = 0;
                y++;
            }
        }
    }
};

/* Set palette range
 * 
 * newpalette = array of palette values
 */
AtariScreen.prototype.SetPalette = function(newpalette) {
    this.palette = newpalette;
    this.canvas_palette = new Array(newpalette.length);
    for (var i = 0; i < newpalette.length; i++) 
        this.SetPaletteValue(i, newpalette[i]);
};

/* Convert ST(E) colour register value to HTML5 colour value.
 *
 * color = index of colour register (0 - 15)
 * value = ST(E) hex colour value (0xRGB)
 *
 * ST(E) colour value is in the format %0000rRRRgGGGbBBB
 * Where R,G,B = ST colour value
 *   and r,g,b = least significant bit of STE colour value
 *
 * This extracts the hex values 0-F for each of the R,G,B components
 * and then "multiplies by 0x0B" to get 0-FF for each.
 *
 * It's not super-accurate, but at this level of colour resolution 
 * it's not really needed.
 * 
 * Result as string "#RRGGBB" 
 */
AtariScreen.prototype.SetPaletteValue = function(colour, value) {
    // & 00000RRR00000000 >> 7  = RRR0 } = RRRr -> hex 0-F
    // & 0000r00000000000 >> 11 = 000r }
    var red = (((value & 0x700) >> 7) + ((value & 0x800) >> 11)).toString(16);
    // & 000000000GGG0000 >> 3  = GGG0 } = GGGg -> hex 0-F
    // & 00000000g0000000 >> 7  = 000g }
    var green = (((value & 0x70) >> 3) + ((value & 0x80) >> 7)).toString(16);
    // & 0000000000000BBB << 1  = BBB0 } = BBBb -> hex 0-F
    // & 000000000000b000 >> 3  = 000b }
    var blue = (((value & 7) << 1) + ((value & 8) >> 3)).toString(16);
    // Convert components to "#RRGGBB" value
    this.canvas_palette[colour] = '#' + red + red + green + green + blue + blue;
};

/* Extract Degas Elite file to AtariScreen object
 *
 * data = Degas Elite file in an ArrayBuffer object
 *
 * This also saves any colour cycling information to 
 * the "cycles" property.
 *
 * This does not automatically display the screen. 
 * To do this call the 'Display' method.
 */
AtariScreen.prototype.ExtractDegasElite = function (data) {
    var dv = new DataView(data);         // Get reader for buffer data
    // Initial flag is a word comprised of [Compression flag byte & Graphics mode byte]
    var mode_data = dv.getUint16(0);     // Get initial file header flag
    this.SetMode(mode_data & 0x00FF);           // Set ST(E) graphics mode.
    this.ExtractPalette(dv, 2);                 // Extract palette information
    var position;
    if ((mode_data & 0x8000) > 0)                       // Detect if compressed 
        position = this.ExtractRLEData(dv, 34);         // If .PC? file
    else 
        position = this.ExtractPlanarScreen(dv, 34);    // If .PI? file
    
    // Degas Elite files differ from earlier Degas files in that they have a list of 4 colour cycling
    // definitions at the end, so now this is checked for. Note that there's no implementation of
    // the colour cycling in this code- that's up to you!
    if ((data.byteLength - position) == 32) {               // If there's colour animation info at the end
        this.cycles = new Array();                          // Reset colour animations list
        for (var i = 0; i < 4; i++) {                       // For each of the 4 animation slots
            var colour_animation = new Object();            // Create the animation object
            colour_animation.left_colour  = dv.getUint16(position + (i * 2));       // Left (start) colour
            colour_animation.right_colour = dv.getUint16(position + (i * 2) + 8);   // Right (end) colour
            colour_animation.direction = dv.getUint16(position + (i * 2) + 16);     // Direction (0=<, 1=off, 2=>)
            // Animation delay- this is a bit funny as it's expressed as 128 *minus* the delay
            // (128 is the maximum value), and it's expressed in 1/60ths of a second. (Remember this was a
            // picture format developed by a US company for the Atari platform, so their monitors would have a 60Hz 
            // refresh rate.) So as well as getting the value, it's converted from 1/60ths of a second to 1/1000ths
            // of a second to make it more Javascript friendly.
            colour_animation.delay = Math.round(
                ((128 -                                         // Value taken from 128
                        dv.getUint16(position + (i * 2) + 24)   // Get value
                ) * 1000) / 60);                                // Convert 1/60ths to 1/1000ths second
            this.cycles.push(colour_animation);                 // Add animtion to the list
        }
    }
};

/* Extract palette information
 * 
 * dv = DataView of ArrayBuffer containing palette information
 * position = position in ArrayBuffer
 *
 * Assumes palette is a series of contiguous words containing valid
 * ST(E) colour values in the order they appear in the registers.
 */
AtariScreen.prototype.ExtractPalette = function (dv, position) {
    var length = this.palette.length;           // Get palette length according to the graphics mode
    var newpalette = new Uint16Array(length);   // Copy the palette from the buffer data
    for (var i = 0; i < length; i++) {
        newpalette[i] = dv.getUint16(position);
        position += 2;                          // Move to next word
    }
    this.SetPalette(newpalette);                // Set the palette in the AtariScreen object
};

/* Extract uncompressed planar screen data to AtariScreen object
 * 
 * dv = DataView of ArrayBuffer containing planar screen data
 * position = position in ArrayBuffer
 * Returns the length of the data
 */
AtariScreen.prototype.ExtractPlanarScreen = function (dv, position) {
    var length = this.screen_memory.length;  // Get screen memory length (usually 16000 words)
    for (var i = 0; i < length; i++) {       // Copy from ArrayBuffer to AtariScreen buffer
        this.screen_memory[i] = dv.getUint16(position);
        position += 2;                       // Move to next word
    }
    return position;    // Return length of data
};

/* Extract RLE compressed screen data to AtariScreen object
 * 
 * dv = DataView of ArrayBuffer containing compressed bitmap information
 * position = position in ArrayBuffer
 * Returns the length of the compressed data
 *
 * This decodes the RLE encoded data, and outputs to the screen buffer.
 *
 * The data is composed of a packet of RLE encoded data for each plane
 * for each scanline of the picture. The decoding process involves 
 * depacking each packet for a scanline to a buffer, and then outputting
 * the buffer to the screen buffer in the interleaved bitmap format
 * expected by the ST(E) screen.
 *
 * In RLE encoded data, packed/unpacked data is headed by a control 
 * byte, which is an 8 bit (2's complement) signed byte.
 * 
 * If x = control byte:
 * # x <  0 - copy next byte (-x + 1) times into buffer
 * # x >= 0 - copy next (x + 1) bytes into buffer.
 */
AtariScreen.prototype.ExtractRLEData = function (dv, position) {
    var lines = this.height;                            // Get number of scanlines
    var planes = this.planes;                           // Get number of planes
    var pic_bytewidth = 160;                            // Width of scanline in bytes
    var sl_bytewidth = (pic_bytewidth / planes);        // Width of scanline for single plane in bytes
    var sl_looplength = (sl_bytewidth / 2);             // Width of scanline for single plane in words
    var i, j, k,                                        // Set up loop variables
        buffer_pointer,                                 // Pointer to scanline buffer
        decoded_length,                                 // Length of data packet when decoded
        control_byte,                                   // Variable for control byte
        size;                                           // Size of compressed data
    var scanline_buffer = new ArrayBuffer(pic_bytewidth);   // Set up scanline buffer 
    var sl_dv = new DataView(scanline_buffer);              // Set up view for scanline buffer
    var screen_pointer = 0;                                 // Set pointer to start of output screen buffer                
    for (i = 0; i < lines; i++) {   // Do for each scan line...
        buffer_pointer = 0;                             // Go to start of scanline buffer
        for (j = 0; j < planes; j++) {                  // Decode data for each plane
            decoded_length = 0;                          
            while (decoded_length < sl_bytewidth) {     // Decode until a scanlines worth of data for a plane is complete
                control_byte = dv.getUint8(position++); // Get control byte (8 bit 2's complement signed)
                if ((control_byte & 0x80) > 0) {                        // If sign bit set... -> PACKED DATA    
                    size = (256 - control_byte) + 1;                    // Get size of unpacked data
                    control_byte = dv.getUint8(position++);             // Get next byte- this is the packed data
                    for (k = 0; k < size; k++) {                        // Copy this byte for the size of the unpacked data
                        sl_dv.setUint8(buffer_pointer++, control_byte);
                        decoded_length++;
                    }
                } else {                                                // If sign bit not set... -> UNPACKED DATA
                    control_byte++;                                     // Get number of bytes to copy
                    for (k = 0; k < control_byte; k++) {                // Copy them to the scanline buffer
                        sl_dv.setUint8(buffer_pointer++, dv.getUint8(position++));
                        decoded_length++;
                    }
                }
            }
        }
        // Now we have depacked the scanline, copy it to interleaved bitmap data in the screen buffer.
        buffer_pointer = 0;                     // Go back to start of scanline buffer
        for (j = 0; j < sl_looplength; j++) {   // For each word of the plane data
            for (k = 0; k < planes; k++)        // For each plane
                this.screen_memory[screen_pointer + k] = sl_dv.getUint16(buffer_pointer + (k * sl_bytewidth));  // Interleave bitmap data into screen buffer
            buffer_pointer += 2;                // Next word in scanline buffer
            screen_pointer += planes;           // Next interleaved bitmap position
        }
    }
    return position;    // Return length of compressed data
};
