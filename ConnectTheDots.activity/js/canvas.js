// canvas.js — Rendering and input handling

define(["activity/grid", "activity/fill"], function (grid, fill) {
	"use strict";

	function CanvasRenderer(canvasEl, lineManager) {
		this.el = canvasEl;
		this.ctx = canvasEl.getContext("2d");
		this.lineManager = lineManager;
		this.grid = null;
		this.hoveredDot = null;
		this.selectedDot = null;
		this.filledPolygons = [];
		this.targetCols = 24;
		this.targetRows = 16;
		this.spacing = 0;
		this.onDotClick = null;

		this._bindEvents();
		this.resize();
	}

	CanvasRenderer.prototype.resize = function () {
		var parent = this.el.parentElement;
		this.el.width = parent.clientWidth;
		this.el.height = parent.clientHeight;

		var maxCol = this.targetCols;
		var maxRow = this.targetRows;
		
		if (this.lineManager) {
			var lines = this.lineManager.getAllLines();
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].from.col !== undefined) maxCol = Math.max(maxCol, lines[i].from.col + 1);
				if (lines[i].to.col !== undefined) maxCol = Math.max(maxCol, lines[i].to.col + 1);
				if (lines[i].from.row !== undefined) maxRow = Math.max(maxRow, lines[i].from.row + 1);
				if (lines[i].to.row !== undefined) maxRow = Math.max(maxRow, lines[i].to.row + 1);
			}
		}
		
		if (this.filledPolygons) {
			for (var p = 0; p < this.filledPolygons.length; p++) {
				var poly = this.filledPolygons[p];
				if (poly.vertices) {
					for (var v = 0; v < poly.vertices.length; v++) {
						if (poly.vertices[v].col !== undefined) maxCol = Math.max(maxCol, poly.vertices[v].col + 1);
						if (poly.vertices[v].row !== undefined) maxRow = Math.max(maxRow, poly.vertices[v].row + 1);
					}
				}
			}
		}

		var spacingX = this.el.width / (maxCol + 1);
		var spacingY = this.el.height / (maxRow + 1);
		this.spacing = Math.min(spacingX, spacingY);

		var adaptiveCols = Math.max(maxCol, Math.floor(this.el.width / this.spacing) - 1);
		var adaptiveRows = Math.max(maxRow, Math.floor(this.el.height / this.spacing) - 1);

		this.grid = grid.createGrid(this.el.width, this.el.height, this.spacing, adaptiveCols, adaptiveRows);
		this.render();
	};

	        CanvasRenderer.prototype.render = function () {
                var ctx = this.ctx;
                ctx.clearRect(0, 0, this.el.width, this.el.height);
                this._drawFilledPolygons(ctx);
                this._drawLines(ctx);
                this._drawDots(ctx);
        };

        

	CanvasRenderer.prototype._drawGridGuide = function (ctx) {
		if (!this.grid) return;
		var g = this.grid;
		ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
		ctx.lineWidth = 1;
		for (var r = 0; r < g.rows; r++) {
			var y = g.offsetY + r * g.spacing;
			ctx.beginPath();
			ctx.moveTo(g.offsetX, y);
			ctx.lineTo(g.offsetX + (g.cols - 1) * g.spacing, y);
			ctx.stroke();
		}
		for (var c = 0; c < g.cols; c++) {
			var x = g.offsetX + c * g.spacing;
			ctx.beginPath();
			ctx.moveTo(x, g.offsetY);
			ctx.lineTo(x, g.offsetY + (g.rows - 1) * g.spacing);
			ctx.stroke();
		}
	};

	CanvasRenderer.prototype._drawDots = function (ctx) {
		if (!this.grid) return;
		var g = this.grid;
		var dots = this.grid.dots;
		var hov = this.hoveredDot;
		var sel = this.selectedDot;

		for (var i = 0; i < dots.length; i++) {
			var d = dots[i];

			var isHidden = false;
			for (var p = 0; p < this.filledPolygons.length; p++) {
				var poly = this.filledPolygons[p];
				var dynamicVertices = [];
				
				var isBoundary = false;
				for (var v = 0; v < poly.vertices.length; v++) {
					var pv = poly.vertices[v];
					var vx = pv.col !== undefined ? g.offsetX + pv.col * g.spacing : pv.x;
					var vy = pv.row !== undefined ? g.offsetY + pv.row * g.spacing : pv.y;
					dynamicVertices.push({ x: vx, y: vy });

					if (pv.col !== undefined) {
						if (pv.row === d.row && pv.col === d.col) isBoundary = true;
					} else {
						if (pv.x === d.x && pv.y === d.y) isBoundary = true;
					}
				}
				
				if (isBoundary || fill.pointInPolygon(d.x, d.y, dynamicVertices)) {
					isHidden = true;
					break;
				}
			}

			var isHov = hov && hov.row === d.row && hov.col === d.col;
			var isSel = sel && sel.row === d.row && sel.col === d.col;

			var dotLabel = null;
			if (this.numberLabels && this.numberLabels.length > 0) {
				for (var nl = 0; nl < this.numberLabels.length; nl++) {
					var lbl = this.numberLabels[nl];
					if (lbl.row === d.row && lbl.col === d.col && lbl.label) {
						dotLabel = lbl.label;
						break;
					}
				}
			}

			if (isHidden && !dotLabel) continue;

			if (isSel) {
				ctx.beginPath();
				ctx.arc(d.x, d.y, 15, 0, Math.PI * 2);
				ctx.fillStyle = "rgba(51, 51, 51, 0.25)";
				ctx.fill();

				ctx.beginPath();
				ctx.arc(d.x, d.y, 7, 0, Math.PI * 2);
				ctx.fillStyle = "#333";
				ctx.fill();
			} else if (dotLabel) {
				ctx.beginPath();
				ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
				ctx.fillStyle = "#005696"; 
				ctx.fill();
			} else if (isHov) {
				ctx.beginPath();
				ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
				ctx.fillStyle = "rgba(85, 85, 85, 0.2)";
				ctx.fill();

				ctx.beginPath();
				ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
				ctx.fillStyle = "#555";
				ctx.fill();
			} else {
				ctx.beginPath();
				ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
				ctx.fillStyle = "#999";
				ctx.fill();
			}

			if (dotLabel) {
				ctx.fillStyle = "#fff";
				ctx.font = "bold 12px Arial";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(dotLabel, d.x, d.y);
			}
		}
	};

	CanvasRenderer.prototype._drawLines = function (ctx) {
		if (!this.grid) return;
		var g = this.grid;
		var lines = this.lineManager.getAllLines();
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		for (var i = 0; i < lines.length; i++) {
			var l = lines[i];
			var fromX = l.from.col !== undefined ? g.offsetX + l.from.col * g.spacing : l.from.x;
			var fromY = l.from.row !== undefined ? g.offsetY + l.from.row * g.spacing : l.from.y;
			var toX = l.to.col !== undefined ? g.offsetX + l.to.col * g.spacing : l.to.x;
			var toY = l.to.row !== undefined ? g.offsetY + l.to.row * g.spacing : l.to.y;

			ctx.strokeStyle = l.color;
			ctx.beginPath();
			ctx.moveTo(fromX, fromY);
			ctx.lineTo(toX, toY);
			ctx.stroke();
		}
	};

	CanvasRenderer.prototype._drawFilledPolygons = function (ctx) {
		if (!this.filledPolygons.length || !this.grid) return;
		var g = this.grid;

		var offCanvas = document.createElement("canvas");
		offCanvas.width = this.el.width;
		offCanvas.height = this.el.height;
		var offCtx = offCanvas.getContext("2d");

		for (var i = this.filledPolygons.length - 1; i >= 0; i--) {
			var poly = this.filledPolygons[i];
			if (!poly.vertices || poly.vertices.length < 3) continue;

			offCtx.fillStyle = poly.color;
			offCtx.beginPath();
			
			var firstCol = poly.vertices[0].col;
			var firstRow = poly.vertices[0].row;
			var startX = firstCol !== undefined ? g.offsetX + firstCol * g.spacing : poly.vertices[0].x;
			var startY = firstRow !== undefined ? g.offsetY + firstRow * g.spacing : poly.vertices[0].y;
			
			offCtx.moveTo(startX, startY);
			for (var j = 1; j < poly.vertices.length; j++) {
				var vCol = poly.vertices[j].col;
				var vRow = poly.vertices[j].row;
				var vx = vCol !== undefined ? g.offsetX + vCol * g.spacing : poly.vertices[j].x;
				var vy = vRow !== undefined ? g.offsetY + vRow * g.spacing : poly.vertices[j].y;
				offCtx.lineTo(vx, vy);
			}
			offCtx.closePath();
			offCtx.fill();
		}

		ctx.save();
		ctx.globalAlpha = 1.0;
		ctx.drawImage(offCanvas, 0, 0);
		ctx.restore();
	};

	CanvasRenderer.prototype.clearAll = function () {
		this.lineManager.clear();
		this.filledPolygons = [];
		this.selectedDot = null;

		this.render();
	};

	CanvasRenderer.prototype._bindEvents = function () {
		var self = this;

		this.el.addEventListener("mousemove", function (e) {
			if (!self.grid) return;
			self.hoveredDot = grid.findNearestDot(e.offsetX, e.offsetY, self.grid, 20);
			self.render();
		});

		this.el.addEventListener("click", function (e) {
			if (!self.grid) return;
			var dot = grid.findNearestDot(e.offsetX, e.offsetY, self.grid, 20);
			if (dot && self.onDotClick) self.onDotClick(dot);
		});

		this.el.addEventListener("touchstart", function (e) {
			e.preventDefault();
			if (!self.grid) return;
			var rect = self.el.getBoundingClientRect();
			var t = e.touches[0];
			var dot = grid.findNearestDot(t.clientX - rect.left, t.clientY - rect.top, self.grid, 25);
			if (dot && self.onDotClick) self.onDotClick(dot);
		}, { passive: false });

		window.addEventListener("resize", function () { self.resize(); });
	};

	CanvasRenderer.prototype.toJSON = function () {
		return { lines: this.lineManager.toJSON(), filledPolygons: this.filledPolygons };
	};
	CanvasRenderer.prototype.fromJSON = function (data) {

                if (data.lines) this.lineManager.fromJSON(data.lines);
		if (data.filledPolygons) this.filledPolygons = data.filledPolygons;
		this.render();
	};

	return { CanvasRenderer: CanvasRenderer };
});




