function AtariScreen(a,b,c){this.canvas=b.appendChild(document.createElement("canvas"));this.canvas.id=c;this.canvas.width=640;this.canvas.height=400;this.screen_memory=new Uint16Array(16E3);this.cycles=[];this.mode=this.SetMode(a)}
AtariScreen.prototype.SetMode=function(a){a="undefined"===typeof a?0:a;a=0>a||2<a?0:a;switch(a){case 0:this.planes=4;this.scaleY=this.scaleX=2;this.width=320;this.height=200;this.SetPalette(new Uint16Array([4095,3840,240,4080,15,3855,255,1365,819,3891,1011,4083,831,3903,1023,0]));break;case 1:this.planes=2;this.scaleX=1;this.scaleY=2;this.width=640;this.height=200;this.SetPalette(new Uint16Array([4095,3840,240,0]));break;case 2:this.scaleY=this.scaleX=this.planes=1,this.width=640,this.height=400,
this.SetPalette(new Uint16Array([0,4095]))}return this.mode=a};
AtariScreen.prototype.Display=function(){var a=this.canvas.getContext("2d");a.setTransform(1,0,0,1,0,0);a.scale(this.scaleX,this.scaleY);a.fillStyle=this.canvas_palette[0];a.fillRect(0,0,this.width,this.height);var b=this.planes,c=this.screen_memory.length/b,d=this.width,g=0,n=0,h,f,e,k,l,m=Array(b);for(h=0;h<c;h++){e=h*b;for(f=0;f<b;f++)m[f]=this.screen_memory[e+f];for(f=15;-1<f;--f){l=0;k=1<<f;for(e=0;e<b;e++)m[e]&k&&(l+=1<<e);0<l&&(a.fillStyle=this.canvas_palette[l],a.fillRect(g,n,1,1));g++;g>=
d&&(g=0,n++)}}};AtariScreen.prototype.SetPalette=function(a){this.palette=a;this.canvas_palette=Array(a.length);for(var b=0;b<a.length;b++)this.SetPaletteValue(b,a[b])};AtariScreen.prototype.SetPaletteValue=function(a,b){var c=(((b&1792)>>7)+((b&2048)>>11)).toString(16),d=(((b&112)>>3)+((b&128)>>7)).toString(16),g=(((b&7)<<1)+((b&8)>>3)).toString(16);this.canvas_palette[a]="#"+c+c+d+d+g+g};
AtariScreen.prototype.ExtractDegasElite=function(a){var b=new DataView(a),c=b.getUint16(0);this.SetMode(c&255);this.ExtractPalette(b,2);c=0<(c&32768)?this.ExtractRLEData(b,34):this.ExtractPlanarScreen(b,34);if(32==a.byteLength-c)for(this.cycles=[],a=0;4>a;a++){var d={};d.left_colour=b.getUint16(c+2*a);d.right_colour=b.getUint16(c+2*a+8);d.direction=b.getUint16(c+2*a+16);d.delay=Math.round(1E3*(128-b.getUint16(c+2*a+24))/60);this.cycles.push(d)}};
AtariScreen.prototype.ExtractPalette=function(a,b){for(var c=this.palette.length,d=new Uint16Array(c),g=0;g<c;g++)d[g]=a.getUint16(b),b+=2;this.SetPalette(d)};AtariScreen.prototype.ExtractPlanarScreen=function(a,b){for(var c=this.screen_memory.length,d=0;d<c;d++)this.screen_memory[d]=a.getUint16(b),b+=2;return b};
AtariScreen.prototype.ExtractRLEData=function(a,b){var c=this.height,d=this.planes,g=160/d,n=g/2,h,f,e,k,l,m,r;h=new ArrayBuffer(160);var p=new DataView(h),q=0;for(h=0;h<c;h++){for(f=k=0;f<d;f++)for(l=0;l<g;)if(m=a.getUint8(b++),0<(m&128))for(r=256-m+1,m=a.getUint8(b++),e=0;e<r;e++)p.setUint8(k++,m),l++;else for(m++,e=0;e<m;e++)p.setUint8(k++,a.getUint8(b++)),l++;for(f=k=0;f<n;f++){for(e=0;e<d;e++)this.screen_memory[q+e]=p.getUint16(k+e*g);k+=2;q+=d}}return b};