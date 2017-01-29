import $ from 'jquery';
import Hammer from 'hammerjs';
import CanvasView from './render';
import Maze from './maze';

let $canvas = $('canvas'), canvas = $canvas[0];
let maze = new Maze(100, 100);
// maze.randomScatter('block');
let view = new CanvasView(canvas);
window.view = view;

$.notify.addStyle('plain', {
	html: '<div><span data-notify-text/></div>',
	classes: {
		base: {
			'white-space': 'nowrap',
			'background-color': 'lightblue',
			'padding': '5px',
			'text-align': 'right',
		},
		error: {},
		success: {},
		info: {},
		warning: {},
	},
});
$.notify.defaults({style: 'plain'});

let hammer = new Hammer.Manager($canvas[0], {
	recognizers: [
		[Hammer.Pan],
		[Hammer.Tap],
		[Hammer.Tap, { event: 'doubletap', taps: 2 }, ['tap']],
		[Hammer.Press],
		[Hammer.Pinch],
	]
});
let lastPan;
hammer.on('panstart panmove', function(e) {
	if (e.type === 'panstart') {
		lastPan = {x: 0, y: 0};
	}
	console.log(e.type, e);
	view.freePan(e.deltaX - lastPan.x, e.deltaY - lastPan.y);
	lastPan.x = e.deltaX;
	lastPan.y = e.deltaY;
});
hammer.on('panend', function(e) {
	$.notify(e.type);
	view.panCenter();
});
let lastScale;
hammer.on('pinchstart pinchmove', function(e) {
	if (e.type === 'pinchstart') {
		lastScale = 1;
	}
	view.freeZoom(e.scale - lastScale);
	lsatScale = e.scale;
});
hammer.on('tap', function(e) {
	$.notify(e.type);
	let {x, y} = view.getTileCoords(e.center);
	$.notify('tap ('+x+', '+y+')');
	console.log('tap', x, y);
});
hammer.on('doubletap', function(e) {
	console.log(e.type, arguments);
});
hammer.on('press', function(e) {
	console.log(e.type, arguments);
});

Mousetrap.bind('up', function() { view.panUp(); });
Mousetrap.bind('right', function() { view.panRight(); });
Mousetrap.bind('down', function() { view.panDown(); });
Mousetrap.bind('left', function() { view.panLeft(); });
Mousetrap.bind('enter', function() { view.panCenter(); });

$(window).on('mousewheel', function(e) {
	view.freeZoom(e.deltaY < 0 ? 1.1 : 0.9);
});

function resizeCanvas() {
	var w = $canvas.outerWidth(), h = $canvas.outerHeight(); // copy actual size
	$canvas.attr({width: w, height: h}); // set width and height to actual size
	view.requireRedraw();
}
resizeCanvas();
var resizeTimeout;
$(window).on('resize', function() {
	if (resizeTimeout) {
		clearTimeout(resizeTimeout);
	}
	resizeTimeout = setTimeout(function() {
		resizeTimeout = null;
		resizeCanvas();
	}, 100);
});


console.log('icemaze loaded!');
