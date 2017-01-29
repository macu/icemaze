import $ from 'jquery';
import logo from './logo';

const minTileSize = 9;
const maxTileSize = 61;
const frameMillis = 1000 / 60;
const zoomAnimMillis = 1000 / 4;
const panAnimPerTileMillis = 1000 / 10;
const debug = false;

export default class CanvasView {
	constructor(canvas) {
		this.canvas = canvas;
		this.targetX = 0; // current pan target center tile
		this.targetY = 0;
		this.panX = 0; // current actual pan point in tile coordinates
		this.panY = 0;
		this.tileSize = 21;
		this.redrawRequired = false;
		this.lastRedrawTime = 0;
		this.preDrawCallbacks = [];
		this.postDrawCallbacks = [];
		this.requireRedraw();
	}

	// returns tile coordinates corresponding to given canvas coordinates
	getTileCoords({x: canvasX, y: canvasY}) {
		return {
			x: Math.round(((canvasX - this.canvas.width/2) + (this.panX*this.tileSize)) / this.tileSize),
			y: Math.round(((this.canvas.height/2 - canvasY) + (this.panY*this.tileSize)) / this.tileSize),
		};
	}

	// returns canvas coordinates of top-left corner of specified tile
	getCanvasCoords({x: tileX, y: tileY}) {
		return {
			x: (((tileX * this.tileSize) - (this.panX*this.tileSize)) + this.canvas.width/2) - this.tileSize/2,
			y: -(((tileY * this.tileSize) - (this.panY*this.tileSize)) - this.canvas.height/2) - this.tileSize/2,
		};
	}

	// returns the viewport rect {x, y, w, h} in tile coordinates
	getVisibleRect() {
		let bottomLeft = this.getTileCoords({x: 0, y: this.canvas.height});
		return {
			x: bottomLeft.x,
			y: bottomLeft.y,
			w: Math.ceil(this.canvas.width / this.tileSize),
			h: Math.ceil(this.canvas.height / this.tileSize),
		};
	}

	fillTile(point, fillStyle = 'blue') {
		let {x, y} = this.getCanvasCoords(point);
		let c2d = this.canvas.getContext('2d');
		c2d.fillStyle = fillStyle;
		c2d.fillRect(x, y, this.tileSize, this.tileSize);
	}

	zoom(factor) {
		this.zoomTo(this.tileSize * factor);
	}

	freeZoom(factor, isTileSize) {
		let targetTileSize = Math.round(isTileSize ? factor : this.tileSize * factor);
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

		this.tileSize = targetTileSize;
		this.requireRedraw();
	}

	// set running zoom to new target
	zoomTo(targetTileSize, finishedCallback) {
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

		// remove existing zoom step function
		this.preDrawCallbacks = this.preDrawCallbacks.filter(function(fn) {
			return !fn.zoomStepper;
		});

		if (targetTileSize === this.tileSize) {
			if (typeof finishedCallback === 'function') {
				finishedCallback();
			}
			return;
		}

		// build new step function
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
				if (typeof finishedCallback === 'function') {
					finishedCallback();
				}
			}
		}).bind(this);
		stepFunction.zoomStepper = true;
		this.requireRedraw(stepFunction);
	}

	panUp(n = 1) {
		this.panTo({y: this.targetY + Math.round(n)});
	}

	panRight(n = 1) {
		this.panTo({x: this.targetX + Math.round(n)});
	}

	panDown(n = 1) {
		this.panTo({y: this.targetY - Math.round(n)});
	}

	panLeft(n = 1) {
		this.panTo({x: this.targetX - Math.round(n)});
	}

	freePan(canvasDiffX, canvasDiffY) {
		let diffX = canvasDiffX / this.tileSize;
		let diffY = canvasDiffY / this.tileSize;
		this.panX -= diffX;
		this.panY += diffY;
		this.targetX -= diffX;
		this.targetY += diffY;
		this.requireRedraw();
	}

	// set running pan to nearest point
	panCenter() {
		this.panTo({x: this.panX, y: this.panY});
	}

	// set running pan to new target
	panTo({x = this.targetX, y = this.targetY}, finishedCallback) {
		this.targetX = Math.round(x);
		this.targetY = Math.round(y);

		// remove existing panning step function
		this.preDrawCallbacks = this.preDrawCallbacks.filter(function(fn) {
			return !fn.panStepper;
		});

		if (this.targetX === this.panX && this.targetY === this.panY) {
			if (typeof finishedCallback === 'function') {
				finishedCallback();
			}
			return;
		}

		// build new step function
		let initialX = this.panX, initialY = this.panY;
		let diffX = this.targetX - initialX, diffY = this.targetY - initialY;
		let hypotenuse = Math.sqrt(diffX*diffX + diffY*diffY);
		let animMillis = hypotenuse * panAnimPerTileMillis;
		let animStartMillis = (new Date()).getTime();
		let stepFunction = (function() {
			var percent = (this.lastRedrawTime - animStartMillis) / animMillis;
			if (percent < 0) {
				percent = 0;
			}
			if (percent < 1) {
				this.panX = initialX + (percent * diffX);
				this.panY = initialY + (percent * diffY);
				this.requireRedraw(stepFunction);
			} else {
				this.panX = this.targetX;
				this.panY = this.targetY;
				console.log('pan center', this.panX, this.panY);
				this.requireRedraw();
				if (typeof finishedCallback === 'function') {
					finishedCallback();
				}
			}
		}).bind(this);
		stepFunction.panStepper = true;
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
			// redraw already pending
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
		this.redrawRequired = false;
		this.lastRedrawTime = (new Date()).getTime();

		let preDrawCallbacks = this.preDrawCallbacks;
		this.preDrawCallbacks = [];
		preDrawCallbacks.forEach(function(cb){ cb(); });

		this.drawGrid();
		logo.draw(this.canvas);
		this.fillTile({x: 0, y: 0});

		let postDrawCallbacks = this.postDrawCallbacks;
		this.postDrawCallbacks = [];
		postDrawCallbacks.forEach(function(cb){ cb(); });
	}

	drawGrid() {
		let w = this.canvas.width, h = this.canvas.height, tileSize = this.tileSize;
		let c2d = this.canvas.getContext('2d');

		c2d.clearRect(0, 0, w, h);

		if (debug) {
			c2d.lineWidth = 1;
			c2d.strokeStyle = 'green';
			c2d.strokeRect(0, 0, w, h);
		}

		c2d.beginPath();
		let x = ((w-tileSize)/2)%tileSize - tileSize*(this.panX%1);
		for (; x < w; x += tileSize) {
			c2d.moveTo(x, 0);
			c2d.lineTo(x, h);
		}
		let y = ((h-tileSize)/2)%tileSize + tileSize*(this.panY%1);
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
