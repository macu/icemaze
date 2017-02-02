import $ from 'jquery';
import Hammer from 'hammerjs';
import CanvasView from './canvasview';
import Maze from './maze';

let $canvas = $('canvas'), canvas = $canvas[0];
let maze = new Maze(100, 100);
console.log(maze.toggle(0, 0, 'block'));
// maze.randomScatter('block');
let cv = new CanvasView(canvas, maze);

// for debugging
window.maze = maze;
window.canvasView = cv;
window.mazeView = cv.mazeView;

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
	cv.freePan(e.deltaX - lastPan.x, e.deltaY - lastPan.y);
	lastPan.x = e.deltaX;
	lastPan.y = e.deltaY;
});
hammer.on('panend', function(e) {
	console.log('pan', cv.getVisibleRect());
});
let scaleStartTileSize;
hammer.on('pinchstart pinchmove pinchend', function(e) {
	if (e.type === 'pinchstart') {
		scaleStartTileSize = cv.tileSize;
	}
	cv.freeZoom(e.center, scaleStartTileSize * e.scale);
	if (e.type === 'pinchend') {
		console.log('zoom', cv.tileSize);
	}
});
hammer.on('tap', function(e) {
	let {x, y} = cv.getTileCoords(e.center);
	$.notify('tap ' + x + ', ' + y);
	console.log('tap', x, y);
	cv.mazeView.toggle(x, y, 'block');
	cv.requireRedraw();
});
hammer.on('doubletap', function(e) {
	let {x, y} = cv.getTileCoords(e.center);
	$.notify('doubletap ' + x + ', ' + y);
	console.log('doubletap', x, y);
	cv.mazeView.toggle(x, y, 'ground');
	cv.requireRedraw();
});
hammer.on('press', function(e) {
	console.log(e.type, arguments);
});

// TODO make directions invert user-configurable
Mousetrap.bind('up', function() { cv.panDown(); });
Mousetrap.bind('right', function() { cv.panLeft(); });
Mousetrap.bind('down', function() { cv.panUp(); });
Mousetrap.bind('left', function() { cv.panRight(); });

// TODO make direction invert user-configurable
$(window).on('mousewheel', function(e) {
	cv.freeZoom({x: e.clientX, y: e.clientY}, cv.tileSize * (e.deltaY > 0 ? 1.1 : 0.9));
	console.log('zoom', cv.tileSize);
});

function resizeCanvas() {
	var w = $canvas.outerWidth(), h = $canvas.outerHeight(); // copy actual size
	$canvas.attr({width: w, height: h}); // set width and height to actual size
	cv.mazeView.refocus(cv.getVisibleRect());
	cv.requireRedraw();
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
