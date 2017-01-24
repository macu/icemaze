import $ from 'jquery';
import Hammer from 'hammerjs';
import CanvasView from './render';
import Maze from './maze';

var $canvas = $('canvas'), canvas = $canvas[0];
var view = new CanvasView(canvas);

var hammer = new Hammer($canvas[0]);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
hammer.get('pan').set({ enable: false });
hammer.on('swipeup swiperight swipedown swipeleft', function(e) {
	console.log(e.type, arguments);
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

Mousetrap.bind('up', function() { console.log('up', arguments); });
Mousetrap.bind('down', function() { console.log('down', arguments); });
Mousetrap.bind('left', function() { console.log('left', arguments); });
Mousetrap.bind('right', function() { console.log('right', arguments); });

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
