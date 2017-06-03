
export const colorInput = (function() {
	let i = document.createElement("input");
	i.setAttribute("type", "color");
	return i.type !== "text";
})();
