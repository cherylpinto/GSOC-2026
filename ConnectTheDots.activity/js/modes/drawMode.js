// modes/drawMode.js — Click-click drawing with Bresenham decomposition
// Click dot A, click dot B → auto-decomposes into adjacent steps via Bresenham.
// Lines always pass through intermediate dots. Polygon fills on cycle detection.

define(["activity/fill", "activity/grid"], function (fill, grid) {
	"use strict";

	/**
	 * Bresenham's line on the dot grid.
	 * Returns array of {row, col} from (r1,c1) to (r2,c2) inclusive.
	 */
	function bresenhamDots(r1, c1, r2, c2) {
		var points = [];
		var dr = Math.abs(r2 - r1);
		var dc = Math.abs(c2 - c1);
		var sr = r1 < r2 ? 1 : -1;
		var sc = c1 < c2 ? 1 : -1;
		var err = dc - dr;
		var r = r1, c = c1;

		while (true) {
			points.push({ row: r, col: c });
			if (r === r2 && c === c2) break;
			var e2 = 2 * err;
			if (e2 > -dr) { err -= dr; c += sc; }
			if (e2 < dc) { err += dc; r += sr; }
		}
		return points;
	}

	function DrawMode(canvasRenderer) {
		this.renderer = canvasRenderer;
		this.selectedDot = null;
		this.color = "#333333";
		this.active = false;
	}

	DrawMode.prototype.activate = function () {
		this.active = true;
		this.selectedDot = null;
	};

	DrawMode.prototype.deactivate = function () {
		this.active = false;
		this.selectedDot = null;
		this.renderer.selectedDot = null;
		this.renderer.render();
	};

	DrawMode.prototype.onDotClick = function (dot) {
		if (!this.active) return;

		// First click — select
		if (!this.selectedDot) {
			this.selectedDot = dot;
			this.renderer.selectedDot = dot;
			this.renderer.render();
			return;
		}

		// Same dot — deselect
		if (this.selectedDot.row === dot.row && this.selectedDot.col === dot.col) {
			this.selectedDot = null;
			this.renderer.selectedDot = null;
			this.renderer.render();
			return;
		}

		// Get Bresenham path from selected dot to clicked dot
		var pathDots = bresenhamDots(
			this.selectedDot.row, this.selectedDot.col,
			dot.row, dot.col
		);

		// Resolve full dot objects (with x, y) from the grid
		var resolvedPath = [];
		for (var i = 0; i < pathDots.length; i++) {
			var d = grid.getDot(pathDots[i].row, pathDots[i].col, this.renderer.grid);
			if (d) resolvedPath.push(d);
		}

		if (resolvedPath.length < 2) return;

		// Check for cycle BEFORE adding lines (from first to last dot)
		var firstDot = resolvedPath[0];
		var lastDot = resolvedPath[resolvedPath.length - 1];
		var existingPath = fill.findShortestPath(this.renderer.lineManager, firstDot, lastDot);

		// Add all intermediate lines
		var anyAdded = false;
		for (var j = 0; j < resolvedPath.length - 1; j++) {
			var added = this.renderer.lineManager.addLine(resolvedPath[j], resolvedPath[j + 1], this.color);
			if (added) anyAdded = true;
		}

		// If cycle detected, form polygon and fill
		if (anyAdded && existingPath) {
			// Polygon = existing path (A→B) + new path reversed (B→A)
			var vertices = [];
			for (var k = 0; k < existingPath.length; k++) {
				vertices.push({ row: existingPath[k].row, col: existingPath[k].col, x: existingPath[k].x, y: existingPath[k].y });
			}
			// Add new path dots in reverse (skip last since it equals existingPath end)
			for (var m = resolvedPath.length - 2; m >= 1; m--) {
				vertices.push({ row: resolvedPath[m].row, col: resolvedPath[m].col, x: resolvedPath[m].x, y: resolvedPath[m].y });
			}

			if (vertices.length >= 3) {
				this.renderer.filledPolygons.push({
					vertices: vertices,
					color: this.color
				});
			}

			// Shape complete — deselect
			this.selectedDot = null;
			this.renderer.selectedDot = null;
		} else {
			// No cycle — chain to clicked dot
			this.selectedDot = lastDot;
			this.renderer.selectedDot = lastDot;
		}

		this.renderer.render();
		return anyAdded;
	};

	DrawMode.prototype.setColor = function (color) {
		this.color = color;
	};

	return { DrawMode: DrawMode };
});
