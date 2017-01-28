export default class Maze {

	constructor(width, height) {
		this.grid = [];
		this.width = Math.round(width);
		this.height = Math.round(height);
	}

	get(x, y, prop) {
		x = x < 0 ? this.width+(x%this.width) : x%this.width;
		y = y < 0 ? this.height+(y%this.height) : y%this.height;
		let row = this.grid[y] || (this.grid[y].cellCount=0, this.grid[y] = []);
		let cell = row[x] || (row.cellCount++, row[x] = {});
		return prop ? cell[prop] : cell;
	}

	toggle(x, y, prop, state) {
		let cell = this.get(x, y);
		return (cell[prop] = (state === undefined ? !cell[prop] : state));
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
		}
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
