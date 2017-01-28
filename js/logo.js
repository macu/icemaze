const width = 120;
const height = 50;
const x = width/2, y = height/2;
const font = '24px serif';
const debug = false;

class Logo {

	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;

		let c2d = this.canvas.getContext('2d');
		c2d.textBaseline = 'middle';
		c2d.textAlign = 'center';
		c2d.font = font;

		c2d.shadowColor = "#0077FF";
		c2d.shadowOffsetX = 0;
		c2d.shadowOffsetY = 0;
		c2d.shadowBlur = 7;
		c2d.strokeStyle = '#33FFFF';
		c2d.strokeText('IceMaze', x, y);

		c2d.fillStyle = 'white';
		c2d.fillText('IceMaze', x, y);

		if (debug) {
			c2d.strokeStyle = 'green';
			c2d.strokeRect(0, 0, width, height);
		}
	}

	draw(targetCanvas) {
		targetCanvas.getContext('2d').drawImage(this.canvas, 0, targetCanvas.height - height);
	}

}

export default new Logo();
