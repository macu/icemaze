import $ from 'jquery';
import Dexie from 'dexie';

export const db = new Dexie('tile-editor');
db.version( 1 ).stores({
	palette: "++id,order,color",
	history: "++id,color",
});
db.open().catch(err => {
	console.error("Couldn't open database", err);
});

export default class TileEditor {
	constructor(saveName) {
		let $grid = $('<div class="sprite-grid"/>');
		for (let y = 1; y <= 12; y++) {
			let $row = $('<div class="row"/>').appendTo(this.$grid);
			for (let x = 1; x <= 12; x++) {
				let $col = $('<div class="col"/>').appendTo($row);
			}
		}

	}
}
