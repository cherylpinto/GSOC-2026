// game.js — Main game controller

define([
	"activity/canvas",
	"activity/line",
	"activity/modes/drawMode",
	"activity/modes/numberMode",
	"activity/modes/captureMode",
	"activity/templates"
], function (canvas, line, drawMode, numberMode, captureMode, templates) {
	"use strict";

	function Game(canvasEl) {
		var self = this;
		this.lineManager = new line.LineManager();
		this.renderer = new canvas.CanvasRenderer(canvasEl, this.lineManager);

		this.undoStack = [];
		this.redoStack = [];

		this.drawMode = new drawMode.DrawMode(this.renderer);
		this.numberMode = new numberMode.NumberMode(this.renderer);
		this.captureMode = new captureMode.CaptureMode(this.renderer);
		this.activeMode = null;
		this.currentModeName = null;
		this.states = {};
		this.onStateChanged = null;

		// Wire click to active mode
		this.renderer.onDotClick = function (dot) {
			var changed = false;
			if (self.activeMode && self.activeMode.onDotClick) {
				changed = self.activeMode.onDotClick(dot);
			}
			if (changed) self.saveState(false);
		};

		this.setMode("draw");
		this.saveState(true); // Initial empty state, don't broadcast
	}

	Game.prototype.setMode = function (modeName) {
		if (this.currentModeName && this.renderer) {
			this.states = this.states || {};
			this.states[this.currentModeName] = this.renderer.toJSON();
		}

		if (this.activeMode) this.activeMode.deactivate();
		switch (modeName) {
			case "number": this.activeMode = this.numberMode; break;
			case "capture": this.activeMode = this.captureMode; break;
			default: this.activeMode = this.drawMode; break;
		}

		this.currentModeName = modeName;
		
		this.states = this.states || {};
		this.renderer.clearAll();
		if (this.states[modeName]) {
			this.renderer.fromJSON(this.states[modeName]);
		}

		this.activeMode.activate();
	};

	Game.prototype.setColor = function (color) {
		if (this.drawMode) this.drawMode.setColor(color);
		if (this.numberMode) this.numberMode.color = color;
		if (this.captureMode) this.captureMode.setColor(color);
	};

	Game.prototype.clear = function (isRemote) {
		this.renderer.clearAll();
		if (this.activeMode) {
                        if (this.activeMode.clear) this.activeMode.clear();
			this.activeMode.deactivate();
			this.activeMode.activate();
		}
		this.saveState(isRemote);
	};

	Game.prototype.saveState = function (isRemote) {
		var stateJSON = this.toJSON();
		this.undoStack.push(JSON.stringify(stateJSON));
		this.redoStack = [];
		if (!isRemote && this.onStateChanged) {
			this.onStateChanged(stateJSON);
		}
	};

	Game.prototype.undo = function (isRemote) {
		if (this.undoStack.length > 1) { // Always keep initial state
			var currentState = this.undoStack.pop();
			this.redoStack.push(currentState);
			var previousState = this.undoStack[this.undoStack.length - 1];
			var stateObj = JSON.parse(previousState);
			this.fromJSON(stateObj);
			if (!isRemote && this.onStateChanged) {
				this.onStateChanged(stateObj);
			}
		}
	};

	Game.prototype.redo = function (isRemote) {
		if (this.redoStack.length > 0) {
			var nextState = this.redoStack.pop();
			this.undoStack.push(nextState);
			var stateObj = JSON.parse(nextState);
			this.fromJSON(stateObj);
			if (!isRemote && this.onStateChanged) {
				this.onStateChanged(stateObj);
			}
		}
	};

	Game.prototype.toJSON = function () {
		this.states = this.states || {};
                this.states[this.currentModeName] = this.renderer.toJSON();
				
                var modesData = {
                        number: this.numberMode && this.numberMode.getState ? this.numberMode.getState() : null
                };

                return {
                        mode: this.currentModeName,
                        states: this.states,
                        modesData: modesData,
                        customTemplates: templates.categories["Custom"] || {}
                };
        };

        Game.prototype.fromJSON = function (data) {
                if (data.customTemplates) {
                        for (var k in data.customTemplates) {
                                if (data.customTemplates.hasOwnProperty(k)) {
                                        templates.addCustomTemplate(k, data.customTemplates[k].parts);
                                }
                        }
                }

                this.states = data.states || {};
                if (data.canvas && !data.states) {
                        this.states[data.mode || 'draw'] = data.canvas;
                }

                if (data.modesData && data.modesData.number) {
                        if (this.numberMode && this.numberMode.setState) {
                                this.numberMode.setState(data.modesData.number);
                        }
                }
		var mode = data.mode || "draw";
		this.currentModeName = null; // force reload state
		this.setMode(mode);
	};

	return { Game: Game };
});


