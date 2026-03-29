// modes/captureMode.js — Territory capture mode
// Strategic territory capture mechanics on the dot grid.

define([], function () {
	"use strict";

	var STEPS_PS = 4.0;
	var MS_PER_STEP = 1000 / STEPS_PS;
	var BASE_R = 1;
	var GAME_DURATION_MS = 90 * 1000;

	var PALETTE = [
		{ head: '#005696', fill: '#00A0FF' }, 
		{ head: '#6b0a08', fill: '#b52a1a' },
		{ head: '#094a1c', fill: '#1a8c40' },
		{ head: '#380860', fill: '#7020b0' },
		{ head: '#5c1e00', fill: '#b04010' },
	];

	function CaptureMode(canvasRenderer) {
		this.canvasRenderer = canvasRenderer;
		this.canvas = canvasRenderer.el;
		this.ctx = canvasRenderer.ctx;
		this.active = false;
		
		this.cols = 0;
		this.rows = 0;
		this.spacing = 0;
		this.offX = 0;
		this.offY = 0;

		this.terr = null;
		this.players = [];
		this.localIdx = 0;
		this.localColor = null;

		this.running = false;
		this.gameOver = false;
		this.waitStart = true;
		this.gameStartT = 0;
		this.timeLeftMs = GAME_DURATION_MS;
		this.winReason = '';

		this.nextDc = 0;
		this.nextDr = 0;
		this.dirPending = false;

		this._onKey = null;
		this._onPtr = null;
		this._origRender = null;
		this.rafId = null;
		this.lastT = 0;

		this._loop = this._loop.bind(this);
	}

	CaptureMode.prototype.activate = function () {
		this.active = true;
		
		this._origRender = this.canvasRenderer.render;
		this.canvasRenderer.render = function() {};

		this._resize();
		this._resetState();
		this._bindInput();

		this.running = true;
		this.gameOver = false;
		this.waitStart = true;
		this.lastT = performance.now();
		this.rafId = requestAnimationFrame(this._loop);
	};

	CaptureMode.prototype.deactivate = function () {
		this.active = false;
		this.running = false;
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		this._unbindInput();

		if (this._origRender) {
			this.canvasRenderer.render = this._origRender;
			this._origRender = null;
		}
		this.canvasRenderer.render();
	};

	CaptureMode.prototype.onDotClick = function (dot) {
		// Handled via pointer events in _bindInput, but need this to satisfy game.js hook
		return false;
	};

	CaptureMode.prototype.setColor = function (color) {
		this.localColor = color;
		if (this.players[this.localIdx]) {
			this._applyColor(this.players[this.localIdx], color);
		}
	};

	CaptureMode.prototype._resize = function () {
		var g = this.canvasRenderer.grid;
		if (!g) return;
		this.cols = g.cols;
		this.rows = g.rows;
		this.spacing = g.spacing;
		this.offX = g.offsetX;
		this.offY = g.offsetY;
	};

	CaptureMode.prototype._resetState = function () {
		this.terr = new Uint8Array(this.cols * this.rows);
		this.players = [];
		
		// Spawn positions
		var mc = Math.floor(this.cols / 2), mr = Math.floor(this.rows / 2);
		var spawns = [
			{ gc: BASE_R + 1,       gr: mr,                 dc:  1, dr:  0 },
			{ gc: this.cols - BASE_R - 2, gr: mr,           dc: -1, dr:  0 },
			{ gc: mc,               gr: BASE_R + 1,         dc:  0, dr:  1 },
			{ gc: mc,               gr: this.rows - BASE_R - 2, dc:  0, dr: -1 }
		];

		// Player 0 (Human)
		var p0 = this._makePlayer(0, false, spawns[0]);
		this._paintBase(p0);
		this.players.push(p0);
		if (this.localColor) this._applyColor(p0, this.localColor);

		// Player 1 (AI)
		var p1 = this._makePlayer(1, true, spawns[1]);
		this._paintBase(p1);
		this.players.push(p1);

		this.nextDc = 0;
		this.nextDr = 0;
		this.dirPending = false;
		this.timeLeftMs = GAME_DURATION_MS;
		this.winReason = '';
	};

	CaptureMode.prototype._makePlayer = function (idx, isAI, spawn) {
		var pal = PALETTE[idx % PALETTE.length];
		return {
			index: idx,
			head: pal.head,
			fill: pal.fill,
			isAI: isAI,
			gc: spawn.gc, gr: spawn.gr,
			dc: isAI ? spawn.dc : 0,
			dr: isAI ? spawn.dr : 0,
			trail: [],
			trailSet: {},
			outside: false,
			alive: true,
			ai: isAI ? { state: 'IDLE', idleTimer: 0, phase: 0, outDir: { dc: 0, dr: 0 }, latDir: { dc: 0, dr: 0 }, outLeft: 0, latLeft: 0 } : null
		};
	};

	CaptureMode.prototype._applyColor = function (p, color) {
		if (typeof color === 'object' && color.stroke) {
			p.head = color.stroke;
			p.fill = color.fill;
		} else if (typeof color === 'string') {
			var hex = color.length === 7 ? color : '#005696';
			var r = parseInt(hex.slice(1, 3), 16) || 0;
			var g = parseInt(hex.slice(3, 5), 16) || 86;
			var b = parseInt(hex.slice(5, 7), 16) || 150;
			p.head = hex;
			p.fill = 'rgb(' + Math.round(r * 0.78 + 255 * 0.22) + ',' + Math.round(g * 0.78 + 255 * 0.22) + ',' + Math.round(b * 0.78 + 255 * 0.22) + ')';
		}
	};

	CaptureMode.prototype._paintBase = function (p) {
		for (var dr = -BASE_R; dr <= BASE_R; dr++) {
			for (var dc = -BASE_R; dc <= BASE_R; dc++) {
				var gc = p.gc + dc, gr = p.gr + dr;
				if (gc >= 0 && gc < this.cols && gr >= 0 && gr < this.rows) {
					this.terr[gc + gr * this.cols] = p.index + 1;
				}
			}
		}
	};

	CaptureMode.prototype._owner = function (gc, gr) {
		if (gc < 0 || gc >= this.cols || gr < 0 || gr >= this.rows) return -1;
		return this.terr[gc + gr * this.cols] - 1;
	};

	CaptureMode.prototype._score = function (p) {
		var n = 0;
		for (var i = 0; i < this.terr.length; i++) if (this.terr[i] === p.index + 1) n++;
		return n;
	};

	CaptureMode.prototype._killPlayer = function (p, reason) {
		if (!p.alive) return;
		p.alive = false;
		p.trail = [];
		p.trailSet = {};
		p.outside = false;
		for (var i = 0; i < this.terr.length; i++) {
			if (this.terr[i] === p.index + 1) this.terr[i] = 0;
		}
		this.winReason = reason || '';
	};

	CaptureMode.prototype._capture = function (p) {
		if (p.trail.length < 3) return;

		var barrier = new Uint8Array(this.cols * this.rows);
		for (var i = 0; i < p.trail.length; i++) {
			var t = p.trail[i];
			barrier[t.gc + t.gr * this.cols] = 1;
		}
		for (var bi = 0; bi < this.terr.length; bi++) {
			if (this.terr[bi] === p.index + 1) barrier[bi] = 1;
		}

		var vis = new Uint8Array(this.cols * this.rows);
		var q = [], qi = 0;
		function enq(gc, gr, cols, rows) {
			if (gc < 0 || gc >= cols || gr < 0 || gr >= rows) return;
			var k = gc + gr * cols;
			if (vis[k] || barrier[k]) return;
			vis[k] = 1; q.push(gc, gr);
		}
		for (var c = 0; c < this.cols; c++) { enq(c, 0, this.cols, this.rows); enq(c, this.rows - 1, this.cols, this.rows); }
		for (var r = 0; r < this.rows; r++) { enq(0, r, this.cols, this.rows); enq(this.cols - 1, r, this.cols, this.rows); }
		while (qi < q.length) {
			var gc2 = q[qi++], gr2 = q[qi++];
			enq(gc2 - 1, gr2, this.cols, this.rows); enq(gc2 + 1, gr2, this.cols, this.rows);
			enq(gc2, gr2 - 1, this.cols, this.rows); enq(gc2, gr2 + 1, this.cols, this.rows);
		}

		for (var bi2 = 0; bi2 < this.terr.length; bi2++) {
			if (!vis[bi2] && !barrier[bi2]) {
				var prev = this.terr[bi2] - 1;
				if (prev >= 0 && prev !== p.index && this.players[prev]) {
					var ep = this.players[prev];
					var col = bi2 % this.cols, row = Math.floor(bi2 / this.cols);
					var key = col + ',' + row;
					if (ep.trailSet[key]) {
						ep.trail = ep.trail.filter(function(t) { return t.gc !== col || t.gr !== row; });
						delete ep.trailSet[key];
					}
				}
				this.terr[bi2] = p.index + 1;
			}
		}
		for (var ti = 0; ti < p.trail.length; ti++) {
			var tc = p.trail[ti];
			this.terr[tc.gc + tc.gr * this.cols] = p.index + 1;
		}
	};

	CaptureMode.prototype._bindInput = function () {
		var self = this;
		this._onKey = function(e) {
			var dc = 0, dr = 0, ok = true;
			switch(e.key) {
				case 'ArrowUp':   case 'w': case 'W': dr = -1; break;
				case 'ArrowDown': case 's': case 'S': dr = 1; break;
				case 'ArrowLeft': case 'a': case 'A': dc = -1; break;
				case 'ArrowRight':case 'd': case 'D': dc = 1; break;
				default: ok = false;
			}
			if (!ok) return;
			e.preventDefault();
			if (self.waitStart) { self.waitStart = false; self.gameStartT = performance.now(); }
			self.nextDc = dc; self.nextDr = dr; self.dirPending = true;
		};
		var steer = function(px, py, isStart) {
			if (!self.players[self.localIdx]) return;
			var p = self.players[self.localIdx];
			var dx = px - (self.offX + p.gc * self.spacing);
			var dy = py - (self.offY + p.gr * self.spacing);
			if (Math.abs(dx) > Math.abs(dy)) { self.nextDc = dx > 0 ? 1 : -1; self.nextDr = 0; }
			else { self.nextDc = 0; self.nextDr = dy > 0 ? 1 : -1; }
			self.dirPending = true;
			if (isStart && self.waitStart) { self.waitStart = false; self.gameStartT = performance.now(); }
		};
		this._onPtr = function(e) {
			if (e.target !== self.canvas) return;
			var r = self.canvas.getBoundingClientRect();
			steer(e.clientX - r.left, e.clientY - r.top, e.type === 'pointerdown');
		};
		window.addEventListener('keydown', this._onKey);
		this.canvas.addEventListener('pointerdown', this._onPtr);
		this.canvas.addEventListener('pointermove', this._onPtr);
	};

	CaptureMode.prototype._unbindInput = function () {
		if (this._onKey) window.removeEventListener('keydown', this._onKey);
		if (this.canvas && this._onPtr) {
			this.canvas.removeEventListener('pointerdown', this._onPtr);
			this.canvas.removeEventListener('pointermove', this._onPtr);
		}
	};

	CaptureMode.prototype._loop = function (now) {
		if (!this.running) return;
		this.rafId = requestAnimationFrame(this._loop);

		if (this.waitStart || this.gameOver) { this._render(); return; }

		this.timeLeftMs = Math.max(0, GAME_DURATION_MS - (now - this.gameStartT));
		if (this.timeLeftMs === 0) {
			this.gameOver = true;
			this.winReason = "Time's up!";
			this._render();
			return;
		}

		var dt = now - this.lastT;
		if (dt >= MS_PER_STEP) {
			var steps = Math.min(3, Math.floor(dt / MS_PER_STEP));
			this.lastT = now - (dt % MS_PER_STEP);
			for (var s = 0; s < steps; s++) this._step();
		}
		this._render();
	};

	CaptureMode.prototype._step = function () {
		var self = this;
		
		var prevPos = {};
		this.players.forEach(function(p) {
			if (p.alive) prevPos[p.index] = { gc: p.gc, gr: p.gr };
		});

		this.players.forEach(function(p) {
			if (!p.alive) return;
			if (!p.isAI) {
				if (self.dirPending) {
					self.dirPending = false;
					if (!(p.dc !== 0 || p.dr !== 0) || self.nextDc !== -p.dc || self.nextDr !== -p.dr) {
						p.dc = self.nextDc; p.dr = self.nextDr;
					}
				}
				self._movePlayer(p);
			} else {
				self._aiDecide(p);
				self._movePlayer(p);
			}
		});

		// Check head-to-head collisions
		for (var i = 0; i < this.players.length; i++) {
			for (var j = i + 1; j < this.players.length; j++) {
				var p1 = this.players[i];
				var p2 = this.players[j];
				if (!p1.alive || !p2.alive) continue;

				var sameSpot = (p1.gc === p2.gc && p1.gr === p2.gr);
				var crossed = (
					p1.gc === prevPos[p2.index].gc && p1.gr === prevPos[p2.index].gr &&
					p2.gc === prevPos[p1.index].gc && p2.gr === prevPos[p1.index].gr
				);

				if (sameSpot || crossed) {
					var inOwn1 = self._owner(p1.gc, p1.gr) === p1.index;
					var inOwn2 = self._owner(p2.gc, p2.gr) === p2.index;
					
					if (inOwn1 && !inOwn2) {
						self._killPlayer(p2, p2.isAI ? 'AI crashed into your base!' : 'You crashed into the AI base!');
					} else if (inOwn2 && !inOwn1) {
						self._killPlayer(p1, p1.isAI ? 'AI crashed into your base!' : 'You crashed into the AI base!');
					} else {
						self._killPlayer(p1, 'Head-on collision!');
						self._killPlayer(p2, 'Head-on collision!');
					}
				}
			}
		}

		this._checkGameOver();
	};

	CaptureMode.prototype._movePlayer = function (p) {
		if (!p.alive || (p.dc === 0 && p.dr === 0)) return;
		var ngc = p.gc + p.dc, ngr = p.gr + p.dr;
		if (ngc < 0 || ngc >= this.cols || ngr < 0 || ngr >= this.rows) return;

		var nkey = ngc + ',' + ngr;
		if (p.outside && p.trailSet[nkey]) {
			this._killPlayer(p, p.isAI ? 'AI hit its own trail!' : 'You hit your own trail!');
			return;
		}

		for (var ei = 0; ei < this.players.length; ei++) {
			var ep = this.players[ei];
			if (!ep.alive || ep.index === p.index) continue;
			if (ep.trailSet[nkey]) {
				this._killPlayer(ep, ep.isAI ? 'You cut the AI\'s trail!' : 'AI cut your trail!');
			}
		}

		if (!p.alive) return;

		p.gc = ngc; p.gr = ngr;
		var inOwn = this._owner(p.gc, p.gr) === p.index;

		if (!p.outside && !inOwn) {
			p.outside = true;
			p.trail = [{ gc: p.gc, gr: p.gr }];
			p.trailSet = {}; p.trailSet[p.gc + ',' + p.gr] = true;
		} else if (p.outside && !inOwn) {
			if (!p.trailSet[nkey]) {
				p.trail.push({ gc: p.gc, gr: p.gr });
				p.trailSet[p.gc + ',' + p.gr] = true;
			}
		} else if (p.outside && inOwn) {
			this._capture(p);
			p.trail = []; p.trailSet = {}; p.outside = false;
		}
	};

	CaptureMode.prototype._checkGameOver = function () {
		var total = this.cols * this.rows;
		var alive = this.players.filter(function(p) { return p.alive; });
		if (alive.length < this.players.length) {
			this.gameOver = true; return;
		}
		for (var i = 0; i < this.players.length; i++) {
			var p = this.players[i];
			if (this._score(p) >= total) {
				this.gameOver = true;
				this.winReason = (p.index === this.localIdx ? 'You' : 'AI') + ' captured 100%!';
				return;
			}
		}
	};

	CaptureMode.prototype._nearestOwn = function (gc, gr, pidx) {
		for (var rad = 0; rad <= 28; rad++) {
			for (var dr = -rad; dr <= rad; dr++) {
				for (var dc = -rad; dc <= rad; dc++) {
					if (Math.abs(dc) !== rad && Math.abs(dr) !== rad) continue;
					var c = gc + dc, r = gr + dr;
					if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue;
					if (this._owner(c, r) === pidx) return Math.abs(dc) + Math.abs(dr);
				}
			}
		}
		return 9999;
	};

	CaptureMode.prototype._aiDecide = function (p) {
		var ai = p.ai;
		var human = this.players[this.localIdx];
		if (human && human.alive && human.outside && human.trail.length > 2) {
			var DIRS4 = [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }];
			for (var hi = 0; hi < DIRS4.length; hi++) {
				var hd = DIRS4[hi];
				if ((p.dc !== 0 || p.dr !== 0) && hd.dc === -p.dc && hd.dr === -p.dr) continue;
				var hnc = p.gc + hd.dc, hnr = p.gr + hd.dr;
				if (hnc < 0 || hnc >= this.cols || hnr < 0 || hnr >= this.rows) continue;
				if (human.trailSet[hnc + ',' + hnr]) {
					p.dc = hd.dc; p.dr = hd.dr;
					return;
				}
			}
		}

		if (ai.state === 'IDLE') {
			ai.idleTimer--;
			if (ai.idleTimer > 0) return;
			var DIRS = [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }];
			for(var i=DIRS.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=DIRS[i];DIRS[i]=DIRS[j];DIRS[j]=t;}
			var chosen = null;
			var bestUnclaimed = -1;
			for (var i = 0; i < DIRS.length; i++) {
				var d = DIRS[i];
				if ((p.dc !== 0 || p.dr !== 0) && d.dc === -p.dc && d.dr === -p.dr) continue;
				var unclaimed = 0;
				for (var step = 1; step <= 8; step++) {
					var probe = p.gc + d.dc * step, probr = p.gr + d.dr * step;
					if (probe < 0 || probe >= this.cols || probr < 0 || probr >= this.rows) break;
					if (this._owner(probe, probr) !== p.index) unclaimed++;
				}
				if (unclaimed > bestUnclaimed) { bestUnclaimed = unclaimed; chosen = d; }
			}
			if (!chosen) chosen = DIRS[0];
			var latOpts = [{ dc: -chosen.dr, dr: chosen.dc }, { dc: chosen.dr, dr: -chosen.dc }];
			ai.outDir = chosen; ai.latDir = latOpts[Math.random() < 0.5 ? 0 : 1];
			ai.outLeft = 6 + Math.floor(Math.random() * 8);
			ai.latLeft = 4 + Math.floor(Math.random() * 6);
			ai.phase = 0; ai.state = 'EXPAND';
			return;
		}

		if (ai.state === 'EXPAND') {
			var maxTrail = Math.floor(Math.min(this.cols, this.rows) * 0.4);
			if (p.trail.length >= maxTrail) { ai.state = 'RETURN'; return; }
			var dir;
			if (ai.phase === 0) {
				dir = ai.outDir; ai.outLeft--;
				if (ai.outLeft <= 0) ai.phase = 1;
			} else {
				dir = ai.latDir; ai.latLeft--;
				if (ai.latLeft <= 0) { ai.state = 'RETURN'; return; }
			}
			var nc = p.gc + dir.dc, nr = p.gr + dir.dr;
			if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows || p.trailSet[nc + ',' + nr]) {
				ai.state = 'RETURN'; return;
			}
			p.dc = dir.dc; p.dr = dir.dr;
			return;
		}

		if (ai.state === 'RETURN') {
			if (!p.outside) { ai.state = 'IDLE'; ai.idleTimer = 0; p.dc = 0; p.dr = 0; return; }
			var RDIRS = [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }];
			var bestD = Infinity, bestDir2 = null;
			for (var ri = 0; ri < RDIRS.length; ri++) {
				var rd = RDIRS[ri];
				if ((p.dc !== 0 || p.dr !== 0) && rd.dc === -p.dc && rd.dr === -p.dr) continue;
				var rnc = p.gc + rd.dc, rnr = p.gr + rd.dr;
				if (rnc < 0 || rnc >= this.cols || rnr < 0 || rnr >= this.rows) continue;
				if (p.trailSet[rnc + ',' + rnr]) continue;
				var dist = this._nearestOwn(rnc, rnr, p.index);
				if (dist < bestD) { bestD = dist; bestDir2 = rd; }
			}
			if (bestDir2) { p.dc = bestDir2.dc; p.dr = bestDir2.dr; }
			else { p.dc = -p.dc; p.dr = -p.dr; }
		}
	};

	CaptureMode.prototype._render = function () {
		var ctx = this.ctx;
		var W = this.canvas.width;
		var H = this.canvas.height;
		var SP = this.spacing;

		// 1. Background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, W, H);

		// 2. Territory tiles
		for (var gr = 0; gr < this.rows; gr++) {
			for (var gc = 0; gc < this.cols; gc++) {
				var own = this.terr[gc + gr * this.cols] - 1;
				if (own < 0 || own >= this.players.length) continue;
				ctx.fillStyle = this.players[own].fill;
				var tx = this.offX + gc * SP - SP * 0.5;
				var ty = this.offY + gr * SP - SP * 0.5;
				ctx.fillRect(tx, ty, SP + 1, SP + 1);
			}
		}

		// 3. Grid dots (Match standard canvas style)
		ctx.fillStyle = "#999"; // Standard ConnectTheDots style
		for (var drow = 0; drow < this.rows; drow++) {
			for (var dcol = 0; dcol < this.cols; dcol++) {
				var dx = this.offX + dcol * SP;
				var dy = this.offY + drow * SP;
				ctx.beginPath();
				ctx.arc(dx, dy, 4, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// 4. Trails
		var self = this;
		this.players.forEach(function(p) {
			if (!p.alive || p.trail.length < 1) return;
			ctx.strokeStyle = p.head;
			ctx.lineWidth = 6;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			
			var t0x = self.offX + p.trail[0].gc * SP;
			var t0y = self.offY + p.trail[0].gr * SP;

			if (p.trail.length >= 2) {
				var t1 = p.trail[1];
				var outDc = t1.gc - p.trail[0].gc, outDr = t1.gr - p.trail[0].gr;
				var len = Math.sqrt(outDc * outDc + outDr * outDr) || 1;
				outDc /= len; outDr /= len;
				ctx.moveTo(t0x - outDc * SP * 0.5, t0y - outDr * SP * 0.5);
			} else {
				var backDc = -(p.dc || 0), backDr = -(p.dr || 0);
				ctx.moveTo(t0x + backDc * SP * 0.5, t0y + backDr * SP * 0.5);
			}

			ctx.lineTo(t0x, t0y);
			for (var i = 1; i < p.trail.length; i++) {
				ctx.lineTo(self.offX + p.trail[i].gc * SP, self.offY + p.trail[i].gr * SP);
			}
			ctx.lineTo(self.offX + p.gc * SP, self.offY + p.gr * SP);
			ctx.stroke();
		});

		// 5. Player heads
		this.players.forEach(function(p) {
			if (!p.alive) return;
			var cx = self.offX + p.gc * SP;
			var cy = self.offY + p.gr * SP;
			var r = 12;

			if (p.index === self.localIdx) {
				ctx.strokeStyle = '#555';
				ctx.lineWidth = 2;
				ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
			}
			ctx.fillStyle = p.head;
			ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
			ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
		});

		this._drawScoreboard(ctx, W, H);
		
		if (this.waitStart) {
			this._drawStartPrompt(ctx, W, H);
		} else if (this.gameOver) {
			this._drawGameOver(ctx, W, H);
		}
	};

	CaptureMode.prototype._drawScoreboard = function (ctx, W, H) {
		var total = this.cols * this.rows;
		if (!total) return;
		var pad = 14, lh = 28, bw = 170, bh = pad * 2 + 20 + lh * this.players.length + 8;
		var bx = W - bw - 15, by = 15;

		ctx.save();
		ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
		ctx.strokeStyle = '#c0c0c0';
		ctx.lineWidth = 1.5;
		// Sugarizer style rounded rect
		ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 10) : ctx.rect(bx, by, bw, bh);
		ctx.fill(); ctx.stroke();

		var secsLeft = Math.ceil(this.timeLeftMs / 1000);
		ctx.fillStyle = '#555';
		ctx.font = 'bold 13px Arial';
		ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
		ctx.fillText('TERRITORY', bx + pad, by + pad + 6);

		ctx.fillStyle = secsLeft <= 10 ? '#c0392b' : '#333';
		ctx.textAlign = 'right';
		var m = Math.floor(secsLeft / 60), s = secsLeft % 60;
		ctx.fillText(this.waitStart ? '1:30' : (m + ':' + (s < 10 ? '0' : '') + s), bx + bw - pad, by + pad + 6);

		var self = this;
		this.players.forEach(function(p, i) {
			var pct = Math.round(self._score(p) / total * 100);
			var y = by + pad + 25 + lh * i;
			ctx.globalAlpha = p.alive ? 1 : 0.4;

			// Player Sugarizer icon dot
			var dotX = bx + pad + 8, dotY = y + 8;
			ctx.fillStyle = p.fill;
			ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI * 2); ctx.fill();
			ctx.strokeStyle = p.head;
			ctx.lineWidth = 2.5; ctx.stroke();

			var barX = bx + pad + 24, barW = bw - pad * 2 - 24 - 40;
			
			// Background bar track
			ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
			ctx.beginPath(); ctx.roundRect ? ctx.roundRect(barX, y + 4, barW, 8, 4) : ctx.rect(barX, y + 4, barW, 8); ctx.fill();

			// Foreground progress bar
			if (pct > 0) {
				var fillW = Math.max(8, barW * pct / 100); // 8 is min size to round correctly
				ctx.fillStyle = p.fill;
				ctx.beginPath(); ctx.roundRect ? ctx.roundRect(barX, y + 4, fillW, 8, 4) : ctx.rect(barX, y + 4, fillW, 8); ctx.fill();
			}

			var lbl = p.isAI ? 'AI' : 'You';
			if (!p.alive) lbl += ' ✕';
			ctx.fillStyle = '#333';
			ctx.font = 'bold 12px Arial';
			ctx.textAlign = 'right';
			ctx.fillText(lbl + ' ' + pct + '%', bx + bw - pad, y + 8);
			ctx.globalAlpha = 1;
		});

		var ty = by + bh - 10;
		var frac = this.waitStart ? 1 : Math.max(0, this.timeLeftMs / GAME_DURATION_MS);
		ctx.fillStyle = secsLeft <= 10 ? '#c0392b' : '#a0a0a0';
		ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx + pad, ty, (bw - pad * 2) * frac, 4, 3) : ctx.rect(bx + pad, ty, (bw - pad * 2) * frac, 4); ctx.fill();
		ctx.restore();
	};

	CaptureMode.prototype._drawStartPrompt = function (ctx, W, H) {
		ctx.save();
		var msg = 'Press arrow keys or swipe to start';
		ctx.font = 'bold 16px Arial';
		var tw = ctx.measureText(msg).width;
		var pw = tw + 40, ph = 46, px = (W - pw) / 2, py = H / 2 - ph / 2;

		ctx.fillStyle = '#282828';
		ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, pw, ph, 23) : ctx.rect(px, py, pw, ph);
		ctx.fill();

		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText(msg, W / 2, py + ph / 2);
		ctx.restore();
	};

	CaptureMode.prototype._drawGameOver = function (ctx, W, H) {
		var alive = this.players.filter(function(p) { return p.alive; });
		var winner;
		var self = this;
		if (alive.length === 1) {
			winner = alive[0];
		} else {
			winner = this.players.reduce(function(b, p) { return self._score(p) > self._score(b) ? p : b; }, this.players[0]);
		}

		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillRect(0, 0, W, H);

		var cw = Math.min(W * 0.6, 400), ch = 180, cx = (W - cw) / 2, cy = (H - ch) / 2;
		ctx.fillStyle = '#ffffff';
		ctx.strokeStyle = winner.head;
		ctx.lineWidth = 4;
		ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx, cy, cw, ch, 12) : ctx.rect(cx, cy, cw, ch);
		ctx.fill(); ctx.stroke();

		var lbl = winner.index === this.localIdx ? 'You Win!' : 'AI Wins!';
		ctx.fillStyle = winner.head;
		ctx.font = 'bold 36px Arial';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText(lbl, W / 2, cy + 50);

		if (this.winReason) {
			ctx.fillStyle = '#555';
			ctx.font = '14px Arial';
			ctx.fillText(this.winReason, W / 2, cy + 90);
		}

		var pct = Math.round(this._score(winner) / (this.cols * this.rows) * 100);
		ctx.fillStyle = '#333';
		ctx.font = 'bold 16px Arial';
		ctx.fillText(pct + '% of the board captured', W / 2, cy + 120);

		ctx.fillStyle = '#888';
		ctx.font = '14px Arial';
		ctx.fillText('Switch mode to restart', W / 2, cy + 150);
	};

	return {
		CaptureMode: CaptureMode
	};
});
