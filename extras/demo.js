
var testScreen, testScreen2;
var animationLoaded = false;
var postback = false;

// Initialisation of screen and "Test Card", called by body.onload
function initTest() {
    if (!postback) {
        var testPlace = document.getElementById('test');
        testScreen = new AtariScreen(0, testPlace, 'myTest');

        // Test card - columns of colours 0-15
        var length = testScreen.screen_memory.length;
        for (var i = 0; i < length; i += 4) {
            testScreen.screen_memory[i] = 21845;
            testScreen.screen_memory[i + 1] = 13107;
            testScreen.screen_memory[i + 2] = 3855;
            testScreen.screen_memory[i + 3] = 255;
        }
        testScreen.Display();
        // Event listener for load file button
        document.getElementById('files').addEventListener('change', load_file, false);
        
        
    	// Now start the colour cycling demo
        var testPlace2 = document.getElementById('test2');
        testScreen2 = new AtariScreen(0, testPlace2, 'myTest2', true);
        // Test card - columns of colours 0-15
        for (i = 0; i < length; i += 4) {
            testScreen2.screen_memory[i] = 21845;
            testScreen2.screen_memory[i + 1] = 13107;
            testScreen2.screen_memory[i + 2] = 3855;
            testScreen2.screen_memory[i + 3] = 255;
        }
        // Replace standard St mode 0 palette with black -> white gradient
        //
        // If you want a demonstration of how frustrating it was to work 
        // with the STE palette registers, here it is! 
        //
        // In order to do a black -> white gradient, you can't just go from 0 to 0xFFF 
        // in 0x111 jumps- what you actually have to do is go: 
        //    0, 0x888, 0x111, 0x999, 0x222 ... 0xFFF!
        //
        // This is due to the least significant bit of the STE colour actually being the 
        // most significant bit in the colour register in order to remain compatible 
        // with the STFM colour register. So every colour transition performed on STE 
        // colour registers would need to be aware of this, and coders would invariably have to
        // mess around with bitwise operations in order to keep the STE least significant 
        // bit separate from the STFM value, and combine the results differently according
        // to whether they are using the value as represented in the palette registers,
        // or whether they're using what the value *actually represents*, eg for numerical
        // comparisons.
        var colour = 0;					// Base "STFM" colour
        var lsb = 0x888;				// "STE" addition to colour
        var dest_colour = 0;			// Combined "STFM" + "STE" colour result 
        for (i = 0; i < 16; i++) {
        	lsb ^= 0x888;					// Exclusive OR STE least significant bits 
        	dest_colour = colour + lsb;		// Combine "STFM" and "STE" values 
            testScreen2.SetPaletteValue(i, dest_colour);	// Add to palette
            if (lsb > 0)					// If we've been setting an STE grey
            	colour += 0x111;			// Go to ne STFM grey
        }
        var colour_animation = new Object();            // Create the colour cycling
        colour_animation.left_colour = 0;  				// Cycling goes from first colour...
        colour_animation.right_colour = 15;				// ... to last
        colour_animation.direction = 1;					// Cycling goes ->
        colour_animation.delay = 100;					// Animation rate is 1/10 s
        testScreen2.cycles.push(colour_animation);		// Add to cycles in the demo screen
        testScreen2.Display();							// Display the screen
        // Event listener for load file button
        document.getElementById('files2').addEventListener('change', load_demo2file, false);

        postback = true;
    }
}

// Load Degas file to screen. Called by load file button
function load_file(evt) {
    var files = evt.target.files; // Get list of files
    var f = files[0]; 		  // Get filename
    var reader = new FileReader();

    // When file is loaded, display it
    reader.onload = (function (theFile) {
        return function (e) {
            // File is now in ArrayBuffer in "reader.result"
            testScreen.scale = (document.getElementById('autoscale').checked);
            testScreen.ExtractDegasElite(reader.result);
            testScreen.Display();
        };
    })(f);
    reader.readAsArrayBuffer(f);
}


// Load Degas file to screen. Called by load file button
function load_demo2file(evt) {
    var files = evt.target.files; // Get list of files
    var f = files[0]; 		  // Get filename
    var reader = new FileReader();

    // When file is loaded, display it
    reader.onload = (function (theFile) {
        return function (e) {
            // File is now in ArrayBuffer in "reader.result"
            testScreen2.ExtractDegasElite(reader.result);
            testScreen2.Display();
        };
    })(f);
    reader.readAsArrayBuffer(f);
}

// Toggle colour cycling demo on and off
// Called by onClick of 'cyclingButton' button.
function toggleDemo2() {
	var button = document.getElementById('cyclingButton');
	if (testScreen2.cycles[0].animating) {			// If animation is running
	    testScreen2.StopCycle(0);					// Stop it
	    testScreen2.Display();						// ... and reset to start palette
		button.value = 'Start Cycling';
	}
	else {											// If animation is not running
	    testScreen2.StartCycle(0);					// Initialise colour cycling
	    testScreen2.StartCycleAnimation(0);			// ... and start animation interrupt 
		button.value = 'Stop Cycling';
	}
}
