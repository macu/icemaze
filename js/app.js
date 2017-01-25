import $ from 'jquery';
import Hammer from 'hammerjs';
import CanvasView from './render';
import Maze from './maze';

var $canvas = $('canvas'), canvas = $canvas[0];
var view = new CanvasView(canvas);
window.canvasview = view;

var hammer = new Hammer($canvas[0]);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
hammer.get('pan').set({ enable: false });
hammer.on('swipeup swiperight swipedown swipeleft', function(e) {
	switch (e.type) {
		case 'swipeup': view.panUp(); break;
		case 'swiperight': view.panRight(); break;
		case 'swipedown': view.panDown(); break;
		case 'swipeleft': view.panLeft(); break;
	}
});
hammer.on('tap', function(e) {
	console.log(e.type, e.center);
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

$(window).on('mousewheel', function(e) {
	if (e.deltaY > 0) {
		view.zoomIn();
	} else if (e.deltaY) {
		view.zoomOut();
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
