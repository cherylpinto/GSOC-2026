// grid.js — Dot grid calculation module

define([], function () {
	"use strict";

	/**
	 * @param {number} canvasWidth
	 * @param {number} canvasHeight
	 * @param {number} spacing - distance between dots in pixels
	 * @param {number} [fixedCols] - fixed columns limit
	 * @param {number} [fixedRows] - fixed rows limit
	 * @returns {{ dots: Array<{row,col,x,y}>, rows: number, cols: number, spacing: number, offsetX: number, offsetY: number }}
	 */
	function createGrid(canvasWidth, canvasHeight, spacing, fixedCols, fixedRows) {
		spacing = spacing || 50;

		var cols = fixedCols || (Math.floor(canvasWidth / spacing) - 1);
		var rows = fixedRows || (Math.floor(canvasHeight / spacing) - 1);

		// Center the grid
		var offsetX = (canvasWidth - (cols - 1) * spacing) / 2;
		var offsetY = (canvasHeight - (rows - 1) * spacing) / 2;

		var dots = [];
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) {
				dots.push({
					row: r,
					col: c,
					x: offsetX + c * spacing,
					y: offsetY + r * spacing
				});
			}
		}

		return {
			dots: dots,
			rows: rows,
			cols: cols,
			spacing: spacing,
			offsetX: offsetX,
			offsetY: offsetY
		};
	}

	/**
	 * Find the nearest dot to a given position within a snap radius.
	 * @param {number} px
	 * @param {number} py
	 * @param {object} grid - the grid as returned by createGrid
	 * @param {number} snapRadius
	 * @returns {object|null} the nearest dot or null
	 */
	function findNearestDot(px, py, grid, snapRadius) {
		snapRadius = snapRadius || 20;
		var best = null;
		var bestDist = snapRadius * snapRadius;

		for (var i = 0; i < grid.dots.length; i++) {
			var d = grid.dots[i];
			var dx = px - d.x;
			var dy = py - d.y;
			var dist = dx * dx + dy * dy;
			if (dist < bestDist) {
				bestDist = dist;
				best = d;
			}
		}
		return best;
	}

	/**
	 * Get a dot by its row and column.
	 */
	function getDot(row, col, gridObj) {
		for (var i = 0; i < gridObj.dots.length; i++) {
			if (gridObj.dots[i].row === row && gridObj.dots[i].col === col) {
				return gridObj.dots[i];
			}
		}
		return null;
	}

	return {
		createGrid: createGrid,
		findNearestDot: findNearestDot,
		getDot: getDot
	};
});
