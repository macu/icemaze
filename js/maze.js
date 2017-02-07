import Dexie from 'dexie';

export const db = new Dexie('mazes');
db.version( 1 ).stores({
	cells: "[maze+x+y], maze, ground, block"
});
db.open().catch(err => {
	console.error("Couldn't open database", err);
});

export class Maze {
	constructor(saveName, width=100, height=100) {
		if (width <= 0 || height <= 0 || width%1 || height%1) {
			throw "width and height must be positive integers";
		}
		this.grid = [];
		this.width = Math.round(width);
		this.height = Math.round(height);

		if (saveName) {
			this.saveName = saveName;
			this._restoreMaze(saveName);
		}
	}

	_persist(x, y, cell) {
		if (!this.saveName) {
			return;
		}
		cell.maze = this.saveName;
		cell.x = x;
		cell.y = y;
		db.cells.put(cell);
	}

	_delete(cell) {
		if (!this.saveName) {
			return;
		}
		db.cells.delete([cell.maze, cell.x, cell.y]);
	}

	_restoreMaze(saveName) {
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
			console.log('Restored maze', saveName);
			if (this.mazeView) {
				this.mazeView.reloadAll();
			}
		}.bind(this)).catch(err => {
			console.error('Failed to restore maze', err);
		});
	}

	_wrap(x, y) {
		if (x%1 || y%1) { throw "x and y must be integers"; }
		x = x < 0 ? this.width+(x%this.width) : x%this.width;
		y = y < 0 ? this.height+(y%this.height) : y%this.height;
		return [x, y];
	}

	get(x, y, prop, create = false) {
		[x, y] = this._wrap(x, y);
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
		[x, y] = this._wrap(x, y);
		let r = this.get(x, y, null, true);
		r.cell[prop] = state === undefined ? !r.cell[prop] : state;
		this._persist(x, y, r.cell);
		if (this.mazeView) {
			this.mazeView.reload(x, y, r.cell);
		}
		return r;
	}

	clear(x, y) {
		[x, y] = this._wrap(x, y);
		let row = this.grid[y], cell = row ? row[x] : null;
		if (cell) {
			this._delete(cell);
			// don't splice to delete because it shifts subsequent indices down
			row[x] = undefined;
			row.cellCount--;
			if (row.cellCount === 0) {
				this.grid[y] = undefined;
			}
			if (this.mazeView) {
				this.mazeView.reload(x, y, null);
			}
			return true; // something got deleted
		}
		return false; // nothing was there
	}
}

export default Maze;
