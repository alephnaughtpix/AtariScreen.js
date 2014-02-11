
var testScreen;
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
            testScreen.StartCycle(0);
            testScreen.GetNextCycle(0);
            testScreen.Display();
            testScreen.StopCycle(0);
        };
    })(f);
    reader.readAsArrayBuffer(f);
}

