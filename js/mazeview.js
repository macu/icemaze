import Maze from './maze';

// TODO make sparse

// linked list sparse array of visible cells for drawing and panning
export default class MazeView {
	constructor(maze, {x, y, w, h}) {
		if (x%1) { throw "x must be an integer"; }
		if (y%1) { throw "y must be an integer"; }
		if (w <= 0 || w%1) { throw "width must be an integer > 0"; }
		if (h <= 0 || h%1) { throw "height must be an integer > 0"; }

		maze.mazeView = this; // backreference hack so maze can call up

		this.maze = maze;
		this.width = 1;
		this.height = 1;
		this.firstRow = {
			y: 0,
			nextRow: null,
			firstCol: {
				x: 0,
				nextCol: null,
				cell: maze.get(0, 0).cell,
			},
		};

		this.refocus({x, y, w, h});
	}

	refocus({x: newX, y: newY, w: newW, h: newH}) {
		if (newX === this.firstRow.firstCol.x && newY === this.firstRow.y &&
			newW === this.width && newH === this.height) {
			return;
		}
		if (newX%1 || newY%1) { throw "x and y must be integers"; }
		if (newW <= 0 || newH <= 0 || newW%1 || newH%1) { throw "w and h must be integers > 0"; }

		let oldX = this.firstRow.firstCol.x;
		let oldW = this.width;
		let oldY = this.firstRow.y;
		let oldH = this.height;

		this.width = newW;
		this.height = newH;

		let firstRow;
		if (newY >= oldY && newY < oldY + oldH) {
			firstRow = this.firstRow; // grab existing first row
			while (firstRow.y !== newY) firstRow = firstRow.nextRow; // drop rows below
		} else {
			firstRow = {y: newY, firstCol: {x: newX}}; // create first row
		}
		let row = firstRow;
		for (let y = newY; y < newY + newH; y++) {
			let firstCol;
			if (y >= oldY && y < oldY + oldH && newX >= oldX && newX < oldX + oldW) {
				firstCol = row.firstCol; // grab existing first col
				while (firstCol.x !== newX) firstCol = firstCol.nextCol; // drop cols left
			} else {
				firstCol = {x: newX}; // create first col
			}
			let col = firstCol;
			for (let x = newX; x < newX + newW; x++) {
				if (!col.cell) {
					col.cell = this.maze.get(x, y).cell;
				}
				if (x + 1 < newX + newW) {
					if (!col.nextCol) {
						if (row.firstCol.x === x + 1) {
							col.nextCol = row.firstCol; // join cols right
						} else {
							col.nextCol = {x: x + 1}; // add col right
						}
					}
					col = col.nextCol; // advance col
				} else {
					col.nextCol = null; // last col
					row.firstCol = firstCol;
				}
			}
			if (y + 1 < newY + newH) {
				if (!row.nextRow) {
					if (this.firstRow.y === y + 1) {
						row.nextRow = this.firstRow; // join rows above
					} else {
						row.nextRow = {y: y + 1, firstCol: {x: newX}}; // add row above
					}
				}
				row = row.nextRow; // advance row
			} else {
				row.nextRow = null; // last row
				this.firstRow = firstRow;
			}
		}
	}

	reload() {
		let row = this.firstRow;
		while (row) {
			let col = row.firstCol;
			while (col) {
				col.cell = this.maze.get(col.x, row.y).cell;
				col = col.nextCol;
			}
			row = row.nextRow;
		}
		if (this.canvasView) this.canvasView.requireRedraw();
	}

	get(x, y, prop) {
		return maze.get(x, y, prop);
	}

	getCol(x, y) {
		let row = this.firstRow;
		while (row.y !== y) row = row.nextRow;
		let col = row.firstCol;
		while (col.x !== x) col = col.nextCol;
		return col;
	}

	toggle(x, y, prop, state) {
		let r = this.maze.toggle(x, y, prop, state);
		if (r.created) {
			this.getCol(x, y).cell = r.cell;
		}
		return r;
	}

	clear(x, y) {
		if (this.maze.clear(x, y)) {
			this.getCol(x, y).cell = null;
		}
	}

	// calls drawing function with (x, y, cell) for each visible cell with properties
	drawTiles(drawingFunction) {
		let row = this.firstRow;
		do {
			let col = row.firstCol;
			do {
				if (col.cell) {
					drawingFunction(col.x, row.y, col.cell);
				}
			} while ((col = col.nextCol));
		} while ((row = row.nextRow));
	}
}
