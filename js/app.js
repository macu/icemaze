import $ from 'jquery';
import Hammer from 'hammerjs';
import CanvasView from './canvasview';
import {Maze, db} from './maze';

let $canvas = $('canvas'), canvas = $canvas[0];
let maze = new Maze('a'); // local-graticule
let cv = new CanvasView(canvas, maze);

// for debugging
window.Maze = Maze;
window.maze = maze;
window.mazeDb = db;
window.canvasView = cv;
window.mazeView = cv.mazeView;
window.loadMaze = function(m) {
	window.maze = cv.mazeView.maze = maze = m;
	m.mazeView = cv.mazeView;
	cv.mazeView.reloadAll();
};

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
});
hammer.on('tap', function(e) {
	let {x, y} = cv.getTileCoords(e.center);
	console.log(e.type, x, y);
	maze.toggle(x, y, 'ground');
});
hammer.on('doubletap', function(e) {
	let {x, y} = cv.getTileCoords(e.center);
	console.log(e.type, x, y);
	maze.toggle(x, y, 'block');
});
hammer.on('press', function(e) {
	let {x, y} = cv.getTileCoords(e.center);
	console.log(e.type, x, y);
	// TODO highlight tile, display color picker near highlighted tile
	let {x: ccX, y: ccY} = cv.getCanvasCoords({x, y});
	let $input = $('<input type="text"/>')
		.css({
			position: 'fixed',
			top: ccY,
			left: ccX,
			boxSizing: 'border-box',
			width: cv.tileSize,
			height: cv.tileSize,
		})
		.appendTo('body')
		.spectrum({
			flat: true,
			preferredFormat: "rgb",
			showInput: true,
			allowEmpty: true,
			showPalette: true,
			showSelectionPalette: true,
			hideAfterPaletteSelect: true,
			palette: [],
			localStorageKey: "spectrum." + maze.saveName,
		})
		.on('hide.spectrum', function() {
			console.log('hide color picker');
			$input.remove();
		})
		.on('change', function() {
			var rgb = $input.spectrum("get").toRgb();
			console.log('change color', x, y, rgb);
			$input.remove();
			maze.toggle(x, y, 'color', rgb);
		})
		.click();
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
