// line.js — Line state management
// Only allows connections between 8-connected adjacent dots (dx<=1, dy<=1).
// For longer connections, the draw mode decomposes via Bresenham.

define([], function () {
	"use strict";

	function LineManager() {
		this.lines = {};
		this.count = 0;
		this.adjacency = {};
	}

	LineManager.prototype._dotKey = function (dot) {
		return dot.row + "," + dot.col;
	};

	LineManager.prototype.key = function (dotA, dotB) {
		var a = this._dotKey(dotA);
		var b = this._dotKey(dotB);
		return a < b ? a + "-" + b : b + "-" + a;
	};

	/** Only allows 8-connected adjacent dots, unless force is true. */
	LineManager.prototype.addLine = function (dotA, dotB, color, force) {
		if (!force) {
			var dr = Math.abs(dotA.row - dotB.row);
			var dc = Math.abs(dotA.col - dotB.col);
			if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) return false;
		} else {
			if (dotA.row === dotB.row && dotA.col === dotB.col) return false;
		}

		var k = this.key(dotA, dotB);
		if (this.lines[k]) return false;

		this.lines[k] = {
			from: { row: dotA.row, col: dotA.col, x: dotA.x, y: dotA.y },
			to: { row: dotB.row, col: dotB.col, x: dotB.x, y: dotB.y },
			color: color || "#333333"
		};
		this.count++;

		var kA = this._dotKey(dotA), kB = this._dotKey(dotB);
		if (!this.adjacency[kA]) this.adjacency[kA] = [];
		if (!this.adjacency[kB]) this.adjacency[kB] = [];
		this.adjacency[kA].push({ row: dotB.row, col: dotB.col, x: dotB.x, y: dotB.y });
		this.adjacency[kB].push({ row: dotA.row, col: dotA.col, x: dotA.x, y: dotA.y });

		return true;
	};

	LineManager.prototype.hasLine = function (dotA, dotB) {
		return !!this.lines[this.key(dotA, dotB)];
	};

	LineManager.prototype.getNeighbors = function (dot) {
		return this.adjacency[this._dotKey(dot)] || [];
	};

	LineManager.prototype.getAllLines = function () {
		var result = [];
		for (var k in this.lines) {
			if (this.lines.hasOwnProperty(k)) result.push(this.lines[k]);
		}
		return result;
	};

	LineManager.prototype.clear = function () {
		this.lines = {};
		this.adjacency = {};
		this.count = 0;
	};

	LineManager.prototype.toJSON = function () { return this.lines; };

	LineManager.prototype.fromJSON = function (data) {
		this.lines = {};
		this.adjacency = {};
		this.count = 0;
		if (!data) return;
		for (var k in data) {
			if (data.hasOwnProperty(k)) {
				var l = data[k];
                                this.addLine(l.from, l.to, l.color, true);

                        }
                }
        };

        return { LineManager: LineManager };
});
