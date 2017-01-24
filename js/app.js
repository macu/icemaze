import $ from 'jquery';
import Hammer from 'hammerjs';

var $canvas = $('canvas'), canvas = $canvas[0];
var tileSize = 21, maxTileSize = 41, minTileSize = 9, tileSizeStep = 4;
var frameMs = 1000 / 60;

var hammer = new Hammer($canvas[0]);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
hammer.get('pan').set({ enable: false });
hammer.on('swipeup swiperight swipedown swipeleft', function(e) {
	console.log(e.type, arguments);
});
hammer.on('tap doubletap', function(e) {
	console.log(e.type, arguments);
});
hammer.on('press', function(e) {
	console.log(e.type, arguments);
});

Mousetrap.bind('up', function() { console.log('up', arguments); });
Mousetrap.bind('down', function() { console.log('down', arguments); });
Mousetrap.bind('left', function() { console.log('left', arguments); });
Mousetrap.bind('right', function() { console.log('right', arguments); });

var redrawRequired;
function requireRedraw() {
	if (redrawRequired) {
		return;
	}
	redrawRequired = true;
	if (window.requestAnimationFrame) {
		window.requestAnimationFrame(redraw);
	} else {
		var nextFrame = frameMs - ((new Date()).getTime() - lastRedrawTime);
		setTimeout(redraw, nextFrame > 0 ? nextFrame : 0);
	}
}

var lastRedrawTime, runtime = 0;
function redraw() {
	if (++runtime > 10000) {
		$canvas.remove();
		return;
	}
	redrawRequired = false;
	lastRedrawTime = (new Date()).getTime();
	//console.log(lastRedrawTime);
	drawGrid();
	requireRedraw();
}

function drawGrid() {
	var w = canvas.width, h = canvas.height, c2d = canvas.getContext('2d');

	c2d.clearRect(0, 0, w, h);

	c2d.lineWidth = 1;
	c2d.strokeStyle = 'blue';
	c2d.strokeRect(0, 0, w, h);

	c2d.beginPath();
	for (var x = ((w-tileSize)/2)%tileSize; x < w; x += tileSize) {
		c2d.moveTo(x, 0);
		c2d.lineTo(x, h);
	}
	for (var y = ((h-tileSize)/2)%tileSize; y < h; y += tileSize) {
		c2d.moveTo(0, y);
		c2d.lineTo(w, y);
	}
	c2d.closePath();
	c2d.lineWidth = 1;
	c2d.strokeStyle = 'rgba(0,0,0,.2)';
	c2d.stroke();
}

var ignoreZoomTimeout;
$(window).on('mousewheel', function(e) {
	if (ignoreZoomTimeout) {
		return;
	}
	ignoreZoomTimeout = setTimeout(function() {
		ignoreZoomTimeout = null;
	}, 100);
	if (e.deltaY > 0 && tileSize+tileSizeStep <= maxTileSize) {
		tileSize += tileSizeStep;
		requireRedraw();
	} else if (e.deltaY < 0 && tileSize-tileSizeStep >= minTileSize) {
		tileSize -= tileSizeStep;
		requireRedraw();
	}
});

function resizeCanvas() {
	var w = $canvas.outerWidth(), h = $canvas.outerHeight(); // copy actual size
	$canvas.attr({width: w, height: h}); // set width and height to actual size
	requireRedraw();
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
