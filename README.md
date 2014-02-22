#AtariScreen.js

##A Javascript and HTML5 library for emulating the bit plane screen of an Atari 16/24 bit computer.

###Current version: v0.42 (2014-02-22)

##Updates

###v0.42 (2014-02-22)

* Various bugfixes.

###v0.4 (2014-02-21)

* Reorganistation of code for stability and optimisation.
* Some properties have made read-only, and some are no longer accessible.
* Fixed bug in colour cycling animation.

###v0.3 (2014-02-20)

* Colour cycling animation
* More display optimisations

###v0.2 (2014-02-10)

* Much more optimised screen display
* Scaling is now optional
* Added "autoscale" as a option in the constructor.
* Added "scale" property

---

##Introduction

AtariScreen implements an HTML5 emulation of the bit plane based video modes of Atari computers from the ST onwards. 
It is designed to be used when you want to emulate some aspect of an Atari screen that cannot otherwise be easily 
emulated on the HTML Canvas.

##AtariScreen features

* Emulates 3 planar bitmap graphics modes on Atari ST computers
* Emulates ST colour palette registers, and is compatible with STE colour values.
* Processes Degas Elite .P?? images into screen buffer.
* Can automatically scale according to graphics mode.
* Can simulate colour cycling.

##Files

* `AtariScreen.mini.js` - minified version of AtariScreen. This is best version to use for websites.
* `AtariScreen.js` - the full source code for AtariScreen. Use this if you're wanting to hack around with the code.
* `readme.html` - this file!
* `extras/demo.js` - source code for the demo at the bottom of this page
* `extras/main.css` - CSS file for this page
* `extras/demo_pictures` - various pictures in Degas Elite format for the demo.
* `extras/cycle_demo` - Degas Elite format pictures with colour cycling information for the demo.

---

##Usage

Include AtariScreen in the `<head>` element of your web page:

  ```javascript
  <script src="AtariScreen.mini.js" language="Javascript" type="text/javascript"></script>
  ```

In your javascript code, instantiate an AtariScreen object, passing in the screen mode, an HTML element to attach the screen to, and an ID name for the object.

  ```javascript
  // Locate "<div id="demo_placeholder" ...>" element in web page
  var element = document.getElementById('demo_placeholder');
  // Add an ST mode 0 screen called 'demo' to it.
  demoScreen = new AtariScreen(0, element, 'demo');

  // ... Any screen manipulation goes here ...

  // Display screen.
  demoScreen.Display();
  ```
  
---

##Methods

###SetMode(newmode)

Set graphics mode of AtariScreen object

* mode = ST(E) graphics mode (integer 0-2)
  Modes supported are:
  * 0: St low res- 320 x 200, 16 colours
  * 1: St med res- 640 x 200, 4 colours
  * 2: St hi res- 640 x 400, monochrome

By default, the screen memory is cleared and the default palette for each mode is set.

###Display()

Display current AtariScreen buffer according to the stored bitmap data and colour palette.

###SetPaletteValue(colour, value)

Set colour palette register.

* color = index of colour register
* value = ST(E) hex colour value (0xRGB)

###SetPalette(newpalette)

Set colour values for a whole palette

* newpalette = Uint16Array of palette values

###ExtractDegasElite(data)

Extract Degas Elite data from an ArrayBuffer to AtariScreen object screen memory and palette

* data = Degas Elite file in an ArrayBuffer object

This can process any .P?? format Degas Elite file. By default, it sets the graphics mode according to the file header, and sets the screen palette to the values in the picture file. (This will be reflected the next time the "Display" method is called.)

###ExtractPalette(dv, position)

Extract a palette from a DataView of an ArrayBuffer, and set the AtariScreen palette accordingly.

* dv = DataView of ArrayBuffer containing palette information
* position = position in ArrayBuffer

###ExtractPlanarScreen(dv, position)

Extract uncompressed planar screen data from a DataView of an ArrayBuffer, to the AtariScreen screen memory.

* dv = DataView of ArrayBuffer containing planar screen data
* position = position in ArrayBuffer

###ExtractRLEData(dv, position)

Extract RLE compressed screen data from a DataView of an ArrayBuffer, to the AtariScreen screen memory. This is the type of compression used in Degas Elite compressed files. It's also used in other files eg the IFF format, from where it originated.

* dv = DataView of ArrayBuffer containing compressed bitmap information
* position = position in ArrayBuffer

###StartCycle(cycle_index, start_animation)

Initialise colour cycling

* cycle_id = index of colour cycling animation (0-3)
* start_animation (optional) = true if starting animation interrupt (default is false)

###StartCycleAnimation(cycle_index)

Start colour cycling animation interrupt

* cycle_id = index of colour cycling animation (0-3)

###GetNextCycle(cycle_index)

Execute next step of colour cycling

* cycle_id = index of colour cycling animation (0-3)

###StopCycle(cycle_index)

Stop colour cycling. If the animation interrupt is running, this will be stopped.

* cycle_id = index of colour cycling animation (0-3)

---

##Properties

###screen_memory

The screen memory of the AtariScreen object, in an array of 16000 Uint16 values

###palette

The palette of the AtariScreen.

###cycles

Colour cycling information. This is an array of up to 4 objects, each with the following properties:

* left_colour - starting colour index of the animation
* right_colour - ending colour index of the animation
* direction - direction of the animation (-1 = left, 0 = off, 1 = right)
* delay - delay of the animation in 1/1000ths of second

###scale

Whether to automatically scale the AtariScreen image or not.

###canvas

_Read only_ The HTML5 canvas element used by the AtariScreen object

###mode

_Read only_ The current screen mode of AtariScreen object

###planes

_Read only_ The number of bitmap planes used.

###width

_Read only_ The width of the AtariScreen.

###height

_Read only_ The height of the AtariScreen.

###ready

_Read only_ Whether the screen is ready for drawing or not.

