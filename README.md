#AtariScreen.js

##A Javascript and HTML5 library for emulating the bit plane screen of an Atari 16/24 bit computer.

###Current version: v0.4 (2014-02-21)

##Updates

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

* AtariScreen.mini.js - minified version of AtariScreen. This is best version to use for websites.
* AtariScreen.js - the full source code for AtariScreen. Use this if you're wanting to hack around with the code.
* readme.html - this file!
* extras/demo.js - source code for the demo at the bottom of this page
* extras/main.css - CSS file for this page
* extras/demo_pictures - various pictures in Degas Elite format for the demo.

##Usage

Include AtariScreen in the <head> element of your web page:

  `<script src="AtariScreen.mini.js" language="Javascript" type="text/javascript"></script>`

In your javascript code, instantiate an AtariScreen object, passing in the screen mode, an HTML element to attach the screen to, and an ID name for the object.

  `// Locate "<div id="demo_placeholder" ...>" element in web page`
  `var element = document.getElementById('demo_placeholder');`
  `// Add an ST mode 0 screen called 'demo' to it.`
  `demoScreen = new AtariScreen(0, element, 'demo');`

  `// ... Any screen manipulation goes here ...`

  `// Display screen.`
  `demoScreen.Display();`
  

  

