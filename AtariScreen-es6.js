/* AtariScreen v0.5 (2023-05-08)
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


class AtariScreen {

    palette;
    canvas;
    canvas_palette;
    pixel_palette;
    scale;
    screen_memory;

    // Private variables
    #scaleX; 
    #scaleY;
    #default_palette;
    #ready;
    #colour_cycles;
    #restore_palette;
    #screen_width;
    #screen_height;
    #screen_mode;
    #screen_planes;

    /* Create AtariScreen object
     * 
     * This creates a canvas object emulating an ST(E) screen.
     *
     * mode = ST(E) graphics mode (integer 0-2)
     * element = HTML element to attach canvas to
     * name = ID name of object (string)
     * autoscale (optional) = whether to automatically scale the screen to the canvas
     */
    constructor(mode, element, name, autoscale) {
        if (autoscale === undefined) autoscale = true;      // If not defined, set to true as default

         // Initialise private variables
        this.scale = autoscale;
        this.#ready = true;
        this.screen_memory = new Uint16Array(16000);
        this.#colour_cycles = new Array();

        // Set up canvas
        this.canvas = element.appendChild(document.createElement('canvas'));
        this.canvas.id = name;
        this.canvas.width = 640;
        this.canvas.height = 400;

        // Set up read/write properties
        this.cycles = this.#colour_cycles;

        // Finally, initialise AtariScreen in the required graphics mode
        this.SetMode(mode);
    }

    // PRIVATE METHODS ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    #show() {
        this.canvas.style.visibility = 'visible';
    }

    #hide() {
        this.canvas.style.visibility = 'hidden';
    }

    /* Set up canvas for AtariScreen */
    #setup_canvas() {
        // Get the canvas set up
        var context = this.canvas.getContext('2d');
        if (this.scale) {                                   // If we're doing autoscaling
            this.canvas.width = 640;                        // make sure canvas is full size 
            this.canvas.height = 400;
            context.setTransform(1, 0, 0, 1, 0, 0);         // Reset scaling
            context.scale(this.#scaleX, this.#scaleY);      // Set scaling to the ST(E) graphics mode
            context.imageSmoothingEnabled = false;          // Switch off interpolation
        } else {
            this.canvas.width = this.#screen_width;         // Otherwise set canvas to actual screen dimensions
            this.canvas.height = this.#screen_height;
        }
        return context;                             // Return canvas context
    }

    /* Initialise blank AtariScreen */
    #initialise_screen() {
        var context = this.#setup_canvas();                                 // Set the canvas up
        context.fillStyle = this.canvas_palette[0];                              // Get background colour
        context.fillRect(0, 0, this.#screen_width, this.#screen_height);    // Fill screen with background colour
    }

    // END OF PRIVATE METHODS :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    // PUBLIC METHODS :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    /* Set AtariScreen graphics mode and initialise with default palette
     *
     * newmode = graphics mode
     *
     * These are based on the standard ST(E) graphics modes:
     *   0 = Low res, 320 x 200, 16 colours
     *   1 = Med res, 640 x 200, 4 colours
     *   2 = Hi res,  640 x 400, monochrome
     */
    SetMode(newmode) {
        newmode = (typeof newmode === "undefined") ? 0 : newmode; // If undefined, set to lores
        newmode = ((0 > newmode) || (newmode > 2)) ? 0 : newmode; // If outside range, set to lores
        switch (newmode) {
            case 0:
            // ST lo-res
            {
                this.#screen_planes = 4;
                this.#scaleX = 2;
                this.#scaleY = 2; // 320 x 200
                this.#screen_width = 320;
                this.#screen_height = 200;
                this.#default_palette = new Uint16Array([0xFFF, 0xF00, 0x0F0, 0xFF0, 0x00F, 0xF0F, 0x0FF, 0x555, 0x333, 0xF33, 0x3F3, 0xFF3, 0x33F, 0xF3F, 0x3FF, 0]);
                this.SetPalette(this.#default_palette);
                break;
            }
            case 1:
            // ST med-res
            {
                this.#screen_planes = 2;
                this.#scaleX = 1;
                this.#scaleY = 2; // 640 x 200
                this.#screen_width = 640;
                this.#screen_height = 200;
                this.#default_palette = new Uint16Array([0xFFF, 0xF00, 0x0F0, 0]);
                this.SetPalette(this.#default_palette);
                break;
            }
            case 2:
            // ST hi-res
            {
                this.#screen_planes = 1;
                this.#scaleX = 1;
                this.#scaleY = 1; // 640 x 400
                this.#screen_width = 640;
                this.#screen_height = 400;
                this.#default_palette = new Uint16Array([0, 0xFFF]);
                this.SetPalette(this.#default_palette);
                break;
            }
        }
        this.#initialise_screen();
        this.#screen_mode = newmode;
        return newmode;
    };

    /* Display AtariScreen on canvas
    *
    * This plots the planar data in the AtariScreen buffer as a true colour 
    * image onto the canvas according to the colour register values.
    */
    Display() {
        if (this.#ready) {
            this.#ready = false;
            // Get the canvas set up
            var context = this.#setup_canvas();
            var canvasData = context.createImageData(this.#screen_width, this.#screen_height);
            // Now initialise the variables need for our calculations
            var length = (this.screen_memory.length / this.#screen_planes);
            var memory_pointer = 0;
            var start_plane = 0;
            var word_length = 16 - 1;
            var i, j, k, l, pixel_colour, mask;
            // Set up a temporary buffer for the plane data for a 16 pixel area
            var plane_data = new Array(this.#screen_planes);
            // Now we start going through the screen buffer (array of words)
            for (i = 0; i < length; i++) {
                // Get the planar data for a 16 pixel length of screen
                for (k = 0; k < this.#screen_planes; k++)
                    plane_data[k] = this.screen_memory[start_plane++];
                // Now we have the plane data for a 16 pixel area, start
                // iterating over each of the 16 pixels.
                for (j = word_length; j > -1; --j) {            // Starting with the last plane, the HSB of the colour value of the pixel, and going downwards...
                    pixel_colour = 0;                           // Initialise pixel colour value
                    mask = (1 << j);
                    for (l = 0; l < this.#screen_planes; l++)   // Iterate over each of the planes
                        if (plane_data[l] & mask)               // If the masked pixel exists in plane data
                            pixel_colour += 1 << l;             // Add the plane's binary digit value to the pixel colour value
                    canvasData.data[memory_pointer++] = this.pixel_palette[pixel_colour][0];     // Copy RGB of pixel to canvas memory
                    canvasData.data[memory_pointer++] = this.pixel_palette[pixel_colour][1];
                    canvasData.data[memory_pointer++] = this.pixel_palette[pixel_colour][2];
                    canvasData.data[memory_pointer++] = 255;    // Pixel is fully opaque
                }
            }
            context.putImageData(canvasData, 0, 0);
            if (this.scale)
                context.drawImage(this.canvas, 0, 0);
            this.#ready = true;
        }
        return this.#ready;
    };
    
    /* Set palette range
     * 
     * newpalette = array of palette values
     */
    SetPalette(newpalette) {
        var length = newpalette.length;
        this.palette = new Array(length);                // Palette of ST(E) register values 
        this.canvas_palette = new Array(length);         // Palette of Web colour values   
        this.pixel_palette = new Array(length);          // Palette of canvas pixel colour values    
        this.#restore_palette = new Array(length);        // Backup palette
        for (var i = 0; i < length; i++)                // Set palette values
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
     SetPaletteValue(colour, value) {
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
        this.palette[colour] = value;
        this.canvas_palette[colour] = '#' + red + red + green + green + blue + blue;
        // Add to pixel RGB palette for createImage display method
        this.pixel_palette[colour] = [parseInt(red + red, 16), parseInt(green + green, 16), parseInt(blue + blue, 16)];
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
    ExtractDegasElite(data) {
        var dv = new DataView(data);                        // Get reader for buffer data
        // Initial flag is a word comprised of [Compression flag byte & Graphics mode byte]
        var mode_data = dv.getUint16(0); // Get initial file header flag
        this.SetMode(mode_data & 0x00FF);                        // Set ST(E) graphics mode.
        this.ExtractPalette(dv, 2);                              // Extract palette information
        var position;
        if ((mode_data & 0x8000) > 0)                       // Detect if compressed 
            position = this.ExtractRLEData(dv, 34);              // If .PC? file
        else
            position = this.ExtractPlanarScreen(dv, 34);         // If .PI? file

        // Degas Elite files differ from earlier Degas files in that they have a list of 4 colour cycling
        // definitions at the end, so now this is checked for. 
        if ((data.byteLength - position) == 32) {           // If there's colour animation info at the end
            this.#colour_cycles = new Array();                    // Reset colour animations list
            for (var i = 0; i < 4; i++) {                   // For each of the 4 animation slots
                var colour_animation = new Object();        // Create the animation object
                colour_animation.left_colour = dv.getUint16(position + (i * 2));        // Left (start) colour
                colour_animation.right_colour = dv.getUint16(position + (i * 2) + 8);   // Right (end) colour
                colour_animation.direction = dv.getUint16(position + (i * 2) + 16) - 1; // Direction (-1=<, 0=off, 1=>)
                // Animation delay- this is a bit funny as it's expressed as 128 *minus* the delay
                // (128 is the maximum value), and it's expressed in 1/60ths of a second. (Remember this was a
                // picture format developed by a US company for the Atari platform, so their monitors would have a 60Hz 
                // refresh rate.) So as well as getting the value, it's converted from 1/60ths of a second to 1/1000ths
                // of a second to make it more Javascript friendly.
                colour_animation.delay = Math.round(
                    ((128 - // Value taken from 128
                        dv.getUint16(position + (i * 2) + 24)   // Get value
                    ) * 1000) / 60);                            // Convert 1/60ths to 1/1000ths second
                colour_animation.position = 0;                  // Reset position of cycling to start
                colour_animation.length = (
                    colour_animation.right_colour - colour_animation.left_colour
                    ) + 1; 										// Get length of cycle range
                colour_animation.on = false;					// Rest animation flags;
                colour_animation.animating = false;
                this.#colour_cycles.push(colour_animation);           // Add animation to the list
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
    ExtractPalette(dv, position) {
        var length = this.palette.length;                // Get palette length according to the graphics mode
        var newpalette = new Uint16Array(length);   // Copy the palette from the buffer data
        for (var i = 0; i < length; i++) {
            newpalette[i] = dv.getUint16(position);
            position += 2;                          // Move to next word
        }
        this.SetPalette(newpalette);                     // Set the palette in the AtariScreen object
    };
    
    /* Extract uncompressed planar screen data to AtariScreen object
    * 
    * dv = DataView of ArrayBuffer containing planar screen data
    * position = position in ArrayBuffer
    * Returns the length of the data
    */
    ExtractPlanarScreen(dv, position) {
        var length = this.screen_memory.length;              // Get screen memory length (usually 16000 words)
        for (var i = 0; i < length; i++) {              // Copy from ArrayBuffer to AtariScreen buffer
            this.screen_memory[i] = dv.getUint16(position);
            position += 2;                              // Move to next word
        }
        return position;                                // Return length of data
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
    ExtractRLEData(dv, position) {
        var pic_bytewidth = 160;                                // Width of scanline in bytes
        console.info("Extracting RLE data");
        console.log("Screen width: " + this.#screen_width);
        console.log("Screen height: " + this.#screen_height);
        console.log("Screen planes: " + this.#screen_planes);
        var sl_bytewidth = (pic_bytewidth / this.#screen_planes);     // Width of scanline for single plane in bytes
        var sl_looplength = (sl_bytewidth / 2);                 // Width of scanline for single plane in words
        var i, j, k,                                            // Set up loop variables
            buffer_pointer,                                     // Pointer to scanline buffer
            decoded_length,                                     // Length of data packet when decoded
            control_byte,                                       // Variable for control byte
            size;                                               // Size of compressed data
        var scanline_buffer = new ArrayBuffer(pic_bytewidth);   // Set up scanline buffer 
        var sl_dv = new DataView(scanline_buffer);              // Set up view for scanline buffer
        var screen_pointer = 0;                                 // Set pointer to start of output screen buffer                
        for (i = 0; i < this.#screen_height; i++) {       // Do for each scan line...
            buffer_pointer = 0;                     // Go to start of scanline buffer
            for (j = 0; j < this.#screen_planes; j++) {   // Decode data for each plane
                decoded_length = 0;
                while (decoded_length < sl_bytewidth) {         // Decode until a scanlines worth of data for a plane is complete
                    control_byte = dv.getUint8(position++);     // Get control byte (8 bit 2's complement signed)
                    if ((control_byte & 0x80) > 0) {            // If sign bit set... -> PACKED DATA    
                        size = (256 - control_byte) + 1;        // Get size of unpacked data
                        control_byte = dv.getUint8(position++); // Get next byte- this is the packed data
                        for (k = 0; k < size; k++) {            // Copy this byte for the size of the unpacked data
                            sl_dv.setUint8(buffer_pointer++, control_byte);
                            decoded_length++;
                        }
                    } else {                                    // If sign bit not set... -> UNPACKED DATA
                        control_byte++;                         // Get number of bytes to copy
                        for (k = 0; k < control_byte; k++) {    // Copy them to the scanline buffer
                            sl_dv.setUint8(buffer_pointer++, dv.getUint8(position++));
                            decoded_length++;
                        }
                    }
                }
            }
            // Now we have depacked the scanline, copy it to interleaved bitmap data in the screen buffer.
            buffer_pointer = 0;                             // Go back to start of scanline buffer
            for (j = 0; j < sl_looplength; j++) {           // For each word of the plane data
                for (k = 0; k < this.#screen_planes; k++)         // For each plane
                this.screen_memory[screen_pointer + k] = sl_dv.getUint16(buffer_pointer + (k * sl_bytewidth)); // Interleave bitmap data into screen buffer
                buffer_pointer += 2;                        // Next word in scanline buffer
                screen_pointer += this.#screen_planes;            // Next interleaved bitmap position
            }
        }
        return position;                                    // Return length of compressed data
    };


    /* Initialise colour cycling
     * 
     * cycle_id = index of colour cycling animation (0-3)
     * start_animation (optional) = true if starting animation interrupt (default is false)
     * Returns true if successful
     */
    StartCycle(cycle_id, start_animation) {
        if (start_animation === undefined) start_animation = false; // default = false
        var success = false;
        if ((cycle_id >= 0) && (cycle_id <= 3)) {           // Keep within 0-3
            var cycle_info = this.#colour_cycles[cycle_id]; // Get reference for the colour cycling info    
            if (cycle_info.direction != 0) {                // Don't bother if there's no direction 
                var length = this.pixel_palette.length;     // Get the source palette length
                this.#restore_palette = new Array(length);  // Create new destination palette to save to
                for (var i = 0; i < length; i++)            // Back up palette
                    this.#restore_palette[i] = [
                        this.pixel_palette[i][0],
                        this.pixel_palette[i][1],
                        this.pixel_palette[i][2]
                    ];
                cycle_info.position = 0;                    // Reset position of cycling to start
                cycle_info.length = (
                	cycle_info.right_colour - cycle_info.left_colour
                	) + 1; 									// Get length of cycle range
                cycle_info.on = true;                       // Flag we're ready to start
                if (start_animation)                        // Start animation interrupt if specified
                    this.StartCycleAnimation(cycle_id);
                success = true;                             // Operation fully successful   
            }
        }
        return success;
    };

    /* Execute next step of colour cycling
     * 
     * cycle_id = index of colour cycling animation (0-3)
     * Returns true if successful
     */
    GetNextCycle(cycle_id) {
        var success = false;
        if ((cycle_id >= 0) && (cycle_id <= 3)) {               // Keep within 0-3  
            var cycle_info = this.#colour_cycles[cycle_id];     // Get reference for the colour cycling info      
            if (cycle_info.on) {                                // Don't bother if it's not on  
                var left_reset = cycle_info.left_colour;        // Get left most boundry of cycling
                var left_start = left_reset;
                var loop_position = cycle_info.right_colour;    // Get right most boundry of cycling
                var current_position = cycle_info.position;
                current_position -= cycle_info.direction;       // Move forward/backward a step in the cycling
                if (current_position > loop_position)           // If too far left or right, move to the other side
                    current_position = left_start;
                if (current_position < left_start)
                    current_position = loop_position;
                cycle_info.position = current_position;
                var length = cycle_info.length;                 // Get length of cycle
                for (var i = 0; i < length; i++) {
                    if (current_position > loop_position)       // If we're past the end, go back to the start
                        current_position = left_reset;
                    this.pixel_palette[left_start++] = [             // Copy palette entry to the display palette
                        this.#restore_palette[current_position][0],
                        this.#restore_palette[current_position][1],
                        this.#restore_palette[current_position++][2]
                    ];
                }
                success = true;                                 // Operation fully successful
            }
        }
        return success;
    };

    /* Start animation interrupt for colour cycling
     * 
     * cycle_id = index of colour cycling animation (0-3)
      Returns animation id if successful, -1 otherwise
     */
    StartCycleAnimation(cycle_id) {
        var id = -1;                                        // return value will be -1 if unsuccessful  
        if ((cycle_id >= 0) && (cycle_id <= 3)) {           // Keep within 0-3
            var cycle_info = this.#colour_cycles[cycle_id]; // Get reference for the colour cycling info
            if (cycle_info.direction != 0) {                // Don't bother if there's no direction 
                var this_instance = this;                   // Get reference to this instance
                id = cycle_info.animationId = setInterval(  // Start animation and save id
                    function() {                            // INTERRUPT FUNCTION: call passes in reference to current AtariScreen object
                        this_instance.GetNextCycle(cycle_id);             //   Get next colour cycle
                        requestAnimFrame(function() {       //   Wait for next frame
                            this_instance.Display();                      //   Display new frame
                        });
                    },
                    cycle_info.delay                        // cycle delay
                );
                cycle_info.animating = true;   // Set animating flag to true
            }
        }
        return id;      // Return back animation id (if successful) or -1 (if not successful)
    };

    /* Continue animation interrupt for colour cycling
    */


    /* Stop colour cycling
     *
     * If the animation interrupt is running, this will be stopped.
     * 
     * cycle_id = index of colour cycling animation (0-3)
     * Returns true if successful
     */
    StopCycle(cycle_id) {
        var success = false;
        if ((cycle_id >= 0) && (cycle_id <= 3)) {           // return value will be -1 if unsuccessful
            var cycle_info = this.#colour_cycles[cycle_id];       // Get reference for the colour cycling info  
            if (cycle_info.on) {                            // Don't bother if it's not on
                if (cycle_info.animating)                   // If the animation interrupt is on, switch it off
                    clearInterval(cycle_info.animationId);
                cycle_info.animating = false;
                var length = this.#restore_palette.length;        // Restore display palette
                pixel_palette = new Array(length);          // Get the display palette
                for (var i = 0; i < length; i++)
                    this.pixel_palette[i] = [
                        this.#restore_palette[i][0],
                        this.#restore_palette[i][1],
                        this.#restore_palette[i][2]
                    ];
                cycle_info.on = false;
                success = true;                             // Operation fully successful
            }
        }
        return success;
    };

    // END OF PUBLIC METHODS ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    
    // PROPERTIES :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    // Read/write properties
    get canvas() { return this.canvas; }
    set canvas(val) { this.canvas = val; }

    get scale () { return this.scale; }
    set scale (val) { this.scale = val; }

    get palette() { return this.palette; }
    set palette(val) { this.palette = val; }

    get canvas_palette() { return this.canvas_palette; }
    set canvas_palette(val) { this.canvas_palette = val; }

    get pixel_palette() { return this.pixel_palette; }
    set pixel_palette(val) { this.pixel_palette = val; }

    get screen_memory() { return this.screen_memory; }
    set screen_memory(val) { this.screen_memory = val; }

    get cycles() { return this.#colour_cycles; }
    set cycles(val) { this.#colour_cycles = val; }

    // Read only properties
    get width() { return this.#screen_width; };
    get height() { return this.#screen_height; };
    get planes() { return this.#screen_planes; };
    get mode() { return this.#screen_mode; };
    get ready() { return this.#ready; };
    get default_palette() { return this.#default_palette; }
  

    // END OF PROPERTIES :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

}

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 60);
		};
})();