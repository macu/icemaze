export default class Maze {

	constructor() {
		this.grid = {};
	}

	get(x, y) {
		return (this.grid[x] || {})[y];
	}

	toggle(x, y) {
		var row = this.grid[x] || (this.grid[x] = {});
		row[y] = !row[y];
		return row[y];
	}

}
