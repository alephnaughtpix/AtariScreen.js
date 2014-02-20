
var testScreen, testScreen2;
var animationLoaded = false;
var demo2running = false;
var postback = false;
var demo2anim = null;

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
        var colour_animation = new Object();            // Create the colour cycling
        colour_animation.left_colour = 0;  
        colour_animation.right_colour = 15;
        colour_animation.direction = 1;
        colour_animation.delay = 100;
        testScreen2.cycles.push(colour_animation);
        testScreen2.Display();
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
function toggleDemo2() {
	var button = document.getElementById('cyclingButton');
	if (demo2running) {
	    testScreen2.StopCycle(0);
	    testScreen2.Display();
		button.value = 'Start Cycling';
		demo2running = false;
	}
	else {
	    testScreen2.StartCycle(0);
	    testScreen2.StartCycleAnimation(0);
		button.value = 'Stop Cycling';
		demo2running = true;
	}
}
