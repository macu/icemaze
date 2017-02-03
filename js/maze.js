import Dexie from 'dexie';

const db = new Dexie('mazes');
db.version(1).stores({
	cells: "[maze+x+y], maze, ground, block"
});
db.open().catch(err => {
	console.error("Couldn't open database", err);
});

export default class Maze {

	constructor(width, height, saveName) {
		this.grid = [];
		this.width = Math.round(width);
		this.height = Math.round(height);

		if (saveName) {
			this.saveName = saveName;
			this._restoreMaze(saveName);
		}
	}

	_save(x, y, cell) {
		if (!this.saveName) {
			return;
		}
		cell.maze = this.saveName;
		cell.x = x < 0 ? this.width+(x%this.width) : x%this.width;
		cell.y = y < 0 ? this.height+(y%this.height) : y%this.height;
		db.cells.put(cell);
	}

	_delete(cell) {
		if (!this.saveName) {
			return;
		}
		db.cells.delete([cell.maze, cell.x, cell.y]);
	}

	_restoreMaze(saveName, restoredCallback) {
		let grid = this.grid;
		let cells = db.cells.where('maze').equals(saveName).each(cell => {
			let row = grid[cell.y];
			if (!row) {
				grid[cell.y] = row = [];
				row.cellCount = 0;
			}
			if (!row[cell.x]) {
				row.cellCount++;
			}
			row[cell.x] = cell;
		}).then(function() {
			if (this.mazeView) this.mazeView.reload();
		}.bind(this)).catch(err => {
			console.error('Failed to restore maze', err);
		});
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
		this._save(x, y, r.cell);
		return r;
	}

	clear(x, y) {
		x = x < 0 ? this.width+(x%this.width) : x%this.width;
		y = y < 0 ? this.height+(y%this.height) : y%this.height;
		let row = this.grid[y], cell = row ? row[x] : null;
		if (cell) {
			this._delete(cell);
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
