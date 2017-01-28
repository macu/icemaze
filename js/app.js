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
	},
});
$.notify.defaults({style: 'plain'});

let hammer = new Hammer.Manager($canvas[0], {
	recognizers: [
		[Hammer.Swipe],
		[Hammer.Tap],
		[Hammer.Tap, { event: 'doubletap', taps: 2 }, ['tap']],
		[Hammer.Press],
		[Hammer.Pinch],
	]
});
hammer.on('swipeup swiperight swipedown swipeleft', function(e) {
	switch (e.type) {
		case 'swipeup': view.panDown(); break;
		case 'swiperight': view.panLeft(); break;
		case 'swipedown': view.panUp(); break;
		case 'swipeleft': view.panRight(); break;
	}
});
hammer.on('tap', function(e) {
	if (!view.panStop()) {
		let {x, y} = view.getTileCoords(e.center);
		$.notify('tap ('+x+', '+y+')');
		console.log('tap', x, y);
	}
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
Mousetrap.bind('enter', function() { view.panStop(); });

hammer.on('pinchout', function(e) { view.zoom(1.2); });
hammer.on('pinchin', function(e) { view.zoom(0.8); });

$(window).on('mousewheel', function(e) {
	if (e.deltaY > 0) {
		view.zoom(1.2);
	} else if (e.deltaY) {
		view.zoom(0.8);
	}
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
