// modes/numberMode.js — Number sequence mode
// Child connects dots in sequential numerical order. Auto-fills enclosed shape when finished.

define(["activity/fill", "activity/grid", "activity/templates"], function (fill, grid, templates) {
	"use strict";

	function bresenhamDots(r1, c1, r2, c2) {
		var points = [];
		var dr = Math.abs(r2 - r1), dc = Math.abs(c2 - c1);
		var sr = r1 < r2 ? 1 : -1, sc = c1 < c2 ? 1 : -1;
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

	function NumberMode(canvasRenderer) {
		this.renderer = canvasRenderer;
		this.active = false;
		this.parts = [];          // array of sequences for multi-part shapes
		this.currentPartIndex = 0;
		this.sequence = [];       // current active part sequence
		this.currentIndex = 0;    // which index the user is expected to click Next
		this.color = "#FF851B";   // Default number mode color
		this.previousPath = null; // tracking for auto-fill
	}

	NumberMode.prototype.activate = function () {
		this.active = true;
		this.renderer.numberLabels = this.sequence;
		this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
	};

	NumberMode.prototype.deactivate = function () {
		this.active = false;
		this.renderer.numberLabels = [];
		this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
	};

	NumberMode.prototype.getState = function () {
		return {
			isAuthoring: this.isAuthoring,
			parts: this.parts,
			currentPartIndex: this.currentPartIndex,
			currentIndex: this.currentIndex,
			sequence: this.sequence,
			sequenceOpen: this.sequence ? this.sequence.open : undefined,
			previousPath: this.previousPath
		};
	};

	NumberMode.prototype.setState = function (state) {
		if (!state) return;
		this.isAuthoring = state.isAuthoring;
		this.parts = state.parts || [];
		this.currentPartIndex = state.currentPartIndex || 0;
		this.currentIndex = state.currentIndex || 0;
		this.sequence = state.sequence || [];
		if (state.hasOwnProperty("sequenceOpen")) {
			this.sequence.open = state.sequenceOpen;
		}
		this.previousPath = state.previousPath || null;
		
		if (this.active) {
			this.renderer.numberLabels = this.sequence;
			this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
		}
	};

	NumberMode.prototype.clear = function () {
		if (this.isAuthoring) {
			this.sequence = [];
			this.currentIndex = 0;
			this.previousPath = null;
		} else {
			this.currentPartIndex = 0;
			this.sequence = this.parts && this.parts.length > 0 ? this.parts[0] : [];
			this.currentIndex = 0;
			this.previousPath = null;
		}
	};

	NumberMode.prototype.startAuthoring = function () {
		this.isAuthoring = true;
		this.renderer.clearAll();
		this.sequence = [];
		this.parts = [];
		this.currentIndex = 0;
		this.renderer.numberLabels = this.sequence;
		
		document.getElementById("save-authoring").style.display = "block";
		this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
	};

	NumberMode.prototype.finishAuthoring = function () {
		if (this.sequence.length < 3) return null;
		
		// Map back to relative coords to center
		var centerRow = Math.floor(this.renderer.grid.rows / 2);
		var centerCol = Math.floor(this.renderer.grid.cols / 2);
		
		// Determine if the user manually closed the shape
		var first = this.sequence[0];
		var last = this.sequence[this.sequence.length - 1];
		var isClosed = (first.row === last.row && first.col === last.col);
		
		if (isClosed) {
			// Remove the redundant last dot because open=false handles connection automatically
			this.sequence.pop();
		}
		
		var customPart = { dots: [], open: !isClosed };
		for (var i = 0; i < this.sequence.length; i++) {
			customPart.dots.push({
				r: this.sequence[i].row - centerRow,
				c: this.sequence[i].col - centerCol,
				label: (i + 1).toString()
			});
		}
		
		this.isAuthoring = false;
		document.getElementById("save-authoring").style.display = "none";
		return [customPart];
	};

	NumberMode.prototype.loadTemplate = function (templateName) {
		if (!this.renderer.grid) return;
		this.isAuthoring = false;
		document.getElementById("save-authoring").style.display = "none";
		this.renderer.clearAll();

		var centerRow = Math.floor(this.renderer.grid.rows / 2);
		var centerCol = Math.floor(this.renderer.grid.cols / 2);
		
		var rawParts = templates.getTemplate(templateName, centerRow, centerCol);
		var flatSequence = [];
		var labelIdx = 1;
		if (rawParts) {
			for (var i = 0; i < rawParts.length; i++) {
				for (var j = 0; j < rawParts[i].length; j++) {
					var rawDot = rawParts[i][j];
					flatSequence.push({
						row: rawDot.row,
						col: rawDot.col,
						label: (labelIdx++).toString()
					});
				}
			}
			if (rawParts.length > 0) flatSequence.open = rawParts[rawParts.length - 1].open;
		}

		this.parts = [flatSequence];
		this.currentPartIndex = 0;
		this.sequence = flatSequence;
		this.currentIndex = 0;
		this.previousPath = null;
		
		if (this.active) {
			this.renderer.numberLabels = this.sequence;
			this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
		}
	};

	NumberMode.prototype.onDotClick = function (dot) {
		if (!this.active) return false;
		
		if (this.isAuthoring) {
			// Avoid immediate duplicates
			if (this.sequence.length > 0) {
				var last = this.sequence[this.sequence.length - 1];
				if (last.row === dot.row && last.col === dot.col) return false;
				
				// Draw connection line
				var p1 = grid.getDot(last.row, last.col, this.renderer.grid);
				var p2 = grid.getDot(dot.row, dot.col, this.renderer.grid);
				if (p1 && p2) {
					this.renderer.lineManager.addLine(p1, p2, this.color, true);
				}
			} else {
				this.renderer.selectedDot = dot;
			}
			
			this.sequence.push({
				row: dot.row,
				col: dot.col,
				label: (this.sequence.length + 1).toString()
			});
			
			this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
			return true;
		}

		if (this.sequence.length === 0 || this.currentIndex >= this.sequence.length) return false;

		var expected = this.sequence[this.currentIndex];

		// Check if user clicked the expected dot
		if (dot.row === expected.row && dot.col === expected.col) {
			
			if (this.currentIndex === 0) {
				// First dot selected
				this.renderer.selectedDot = dot;
				this.previousPath = null;
			} else {
				// Second or later dot: connect from previous directly (no Bresenham)
				var prevExpected = this.sequence[this.currentIndex - 1];

				var p1 = grid.getDot(prevExpected.row, prevExpected.col, this.renderer.grid);
				var p2 = grid.getDot(expected.row, expected.col, this.renderer.grid);

				if (p1 && p2) {
					// Add line directly (force=true to ignore adjacency)
					this.renderer.lineManager.addLine(p1, p2, this.color, true);

					// Build up path for final polygon fill
					if (!this.previousPath) this.previousPath = [];
					if (this.previousPath.length === 0) {
						this.previousPath.push(p1);
					}
					this.previousPath.push(p2);
				}
			}

			this.currentIndex++;

			if (this.currentIndex >= this.sequence.length) {
				var isOpen = !!this.sequence.open;
				
				if (!isOpen) {
					// Auto-close: connect the last dot to the first dot
					var firstExpected = this.sequence[0];
					var lastExpected = this.sequence[this.sequence.length - 1];
					var pFirst = grid.getDot(firstExpected.row, firstExpected.col, this.renderer.grid);
					var pLast = grid.getDot(lastExpected.row, lastExpected.col, this.renderer.grid);

					if (pFirst && pLast) {
						this.renderer.lineManager.addLine(pLast, pFirst, this.color, true);
						if (this.previousPath) this.previousPath.push(pFirst);
					}

					// Auto-fill polygon!
					if (this.previousPath && this.previousPath.length >= 3) {
						var vertices = [];
						for (var v = 0; v < this.previousPath.length; v++) {
							vertices.push({ row: this.previousPath[v].row, col: this.previousPath[v].col, x: this.previousPath[v].x, y: this.previousPath[v].y });
						}
						this.renderer.filledPolygons.push({
							vertices: vertices,
							color: this.color
						});
					}
				}

				// Move to next part of the template, if any
				this.currentPartIndex++;
				if (this.currentPartIndex < this.parts.length) {
					this.sequence = this.parts[this.currentPartIndex];
					this.currentIndex = 0;
					this.previousPath = null;
					this.renderer.numberLabels = this.sequence;
					this.renderer.selectedDot = null;
				} else {
                                        // Completed all parts of the template
                                        this.renderer.numberLabels = [];
                                        this.renderer.selectedDot = null;
}
			} else {
				// Not finished yet, keep chaining
				this.renderer.selectedDot = dot;
			}
			
			this.renderer.activeLabelIndex = this.currentIndex;
                this.renderer.render();
			return true;
		}

		return false;
	};

	return { NumberMode: NumberMode };
});



