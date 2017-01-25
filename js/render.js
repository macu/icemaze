import $ from 'jquery';

const minTileSize = 9;
const maxTileSize = 61;
const frameMillis = 1000 / 60;
const zoomAnimMillis = 1000 / 4;
const panAnimPerTileMillis = 1000 / 10;

export default class CanvasView {
	constructor(canvas) {
		this.canvas = canvas;
		this.panX = 0;
		this.panY = 0;
		this.tileSize = 21;
		this.debugRuntime = 0;
		this.redrawRequired = false;
		this.lastRedrawTime = 0;
		this.preDrawCallbacks = [];
		this.postDrawCallbacks = [];
		this.requireRedraw();
	}

	zoomIn() {
		this.zoomTo(this.tileSize + (this.tileSize / 4)); // +25%
	}

	zoomOut() {
		this.zoomTo(this.tileSize - (this.tileSize / 4)); // -25%
	}

	zoomTo(targetTileSize) {
		if (this.zoomInProgress) {
			// TODO interrupt and zoom to new target
			return;
		}
		targetTileSize = Math.round(targetTileSize);
		if (targetTileSize % 2 === 0) {
			// scene is centered on tile center;
			// use odd number for target tile size so final view is pixel perfect
			targetTileSize += 1;
		}
		if (targetTileSize < minTileSize) {
			targetTileSize = minTileSize;
		} else if (targetTileSize > maxTileSize) {
			targetTileSize = maxTileSize;
		}
		if (targetTileSize === this.tileSize) {
			return;
		}
		this.zoomInProgress = true;

		let initialTileSize = this.tileSize;
		let difference = targetTileSize - initialTileSize;
		let animStartMillis = (new Date()).getTime();
		let stepFunction = (function() {
			var percent = (this.lastRedrawTime - animStartMillis) / zoomAnimMillis;
			if (percent < 0) { percent = 0; }
			else if (percent > 1) { percent = 1; }
			this.tileSize = initialTileSize + (percent * difference);
			if (percent < 1) {
				this.requireRedraw(stepFunction);
			} else {
				console.log('tile size', this.tileSize);
				this.zoomInProgress = false;
				this.requireRedraw();
			}
		}).bind(this);
		this.requireRedraw(stepFunction);
	}

	panUp() {
		this.panTo({x: this.panX, y: this.panY - 1});
	}

	panRight() {
		this.panTo({x: this.panX + 1, y: this.panY});
	}

	panDown() {
		this.panTo({x: this.panX, y: this.panY + 1});
	}

	panLeft() {
		this.panTo({x: this.panX - 1, y: this.panY});
	}

	panTo({x: targetX, y: targetY}) {
		if (this.panInProgress) {
			// TODO interrupt and pan to new target
			return;
		}
		targetX = Math.round(targetX);
		targetY = Math.round(targetY);
		if (targetX === this.panX && targetY === this.panY) {
			return;
		}
		this.panInProgress = true;

		let initialX = this.panX, initialY = this.panY;
		let diffX = targetX - initialX, diffY = targetY - initialY;
		let hypotenuse = Math.sqrt(diffX*diffX + diffY*diffY);
		let animMillis = hypotenuse * panAnimPerTileMillis;
		let animStartMillis = (new Date()).getTime();
		let stepFunction = (function() {
			var percent = (this.lastRedrawTime - animStartMillis) / animMillis;
			if (percent < 0) { percent = 0; }
			else if (percent > 1) { percent = 1; }
			this.panX = initialX + (percent * diffX);
			this.panY = initialY + (percent * diffY);
			if (percent < 1) {
				this.requireRedraw(stepFunction);
			} else {
				console.log('pan center', this.panX, this.panY);
				this.panInProgress = false;
				this.requireRedraw();
			}
		}).bind(this);
		this.requireRedraw(stepFunction);
	}

	requireRedraw(preDrawCallback, postDrawCallback) {
		if (typeof preDrawCallback === 'function') {
			this.preDrawCallbacks.push(preDrawCallback);
		}
		if (typeof postDrawCallback === 'function') {
			this.postDrawCallbacks.push(postDrawCallback);
		}
		if (this.redrawRequired) {
			return;
		}
		this.redrawRequired = true;
		if (window.requestAnimationFrame) {
			window.requestAnimationFrame(this.redraw.bind(this));
		} else {
			let nextFrame = frameMillis - ((new Date()).getTime() - this.lastRedrawTime);
			window.setTimeout(this.redraw.bind(this), nextFrame > 0 ? nextFrame : 0);
		}
	}

	redraw() {
		if (++this.debugRuntime > 10000) {
			$(this.canvas).remove();
			return;
		}

		this.redrawRequired = false;
		this.lastRedrawTime = (new Date()).getTime();

		let preDrawCallbacks = this.preDrawCallbacks;
		this.preDrawCallbacks = [];
		preDrawCallbacks.forEach(function(cb){ cb(); });

		this.drawGrid();

		let postDrawCallbacks = this.postDrawCallbacks;
		this.postDrawCallbacks = [];
		postDrawCallbacks.forEach(function(cb){ cb(); });
	}

	drawGrid() {
		let w = this.canvas.width, h = this.canvas.height, tileSize = this.tileSize;
		let c2d = this.canvas.getContext('2d');

		c2d.clearRect(0, 0, w, h);

		c2d.lineWidth = 1;
		c2d.strokeStyle = 'blue';
		c2d.strokeRect(0, 0, w, h);

		c2d.beginPath();
		let x = ((w-tileSize)/2)%tileSize - tileSize*(this.panX%1);
		for (; x < w; x += tileSize) {
			c2d.moveTo(x, 0);
			c2d.lineTo(x, h);
		}
		let y = ((h-tileSize)/2)%tileSize - tileSize*(this.panY%1)
		for (; y < h; y += tileSize) {
			c2d.moveTo(0, y);
			c2d.lineTo(w, y);
		}
		c2d.closePath();
		c2d.lineWidth = 1;
		c2d.strokeStyle = 'rgba(0,0,0,.2)';
		c2d.stroke();
	}
}
