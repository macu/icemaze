export default class Maze {

	constructor(width, height) {
		this.grid = [];
		this.width = Math.round(width);
		this.height = Math.round(height);
	}

	get(x, y, prop, create = false) {
		x = x < 0 ? this.width+(x%this.width) : x%this.width;
		y = y < 0 ? this.height+(y%this.height) : y%this.height;
		if (create) {
			let created = false;
			let row = this.grid[y];
			if (!row) {
				this.grid[y] = row = [];
				row.cellCount = 0;
			}
			let cell = row[x];
			if (cell) {
				return prop ? cell[prop] : {cell};
			}
			row[x] = cell = {};
			row.cellCount++;
			return prop ? cell[prop] : {cell, created: true};
		}
		let row = this.grid[y] || [];
		let cell = row[x], safeCell = cell || {};
		return prop ? safeCell[prop] : {cell: safeCell, fake: !cell};
	}

	toggle(x, y, prop, state) {
		let r = this.get(x, y, null, true);
		r.cell[prop] = state === undefined ? !r.cell[prop] : state;
		return r;
	}

	clear(x, y) {
		x = x < 0 ? this.width+(x%this.width) : x%this.width;
		y = y < 0 ? this.height+(y%this.height) : y%this.height;
		let row = this.grid[y];
		if (row && row[x]) {
			if (x >= 0) {
				row.splice(x, 1);
			} else {
				row[x] = undefined;
			}
			row.cellCount--;
			if (row.cellCount === 0) {
				if (y >= 0) {
					this.grid.splice(y, 1);
				} else {
					this.grid[y] = undefined;
				}
			}
			return true; // something got deleted
		}
		return false; // nothing was there
	}

	// randomCover(prop) {
	// 	// TODO ensure prop is applied to at least one cell in every row and column
	//
	// 	let arr = new Array(this.width);
	//
	// 	let x = 0, y = 0;
	// 	while (x < this.width && y < this.height) {
	// 		if (x < this.width && y < this.height) {
	//
	// 		}
	// 	}
	//
	// }

}
