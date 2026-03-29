// activity.js — Sugarizer entry point for Connect the Dots
// Sets up SugarWeb activity, toolbar events, Journal save/load

define([
	"sugar-web/activity/activity",
	"sugar-web/env",
	"sugar-web/datastore",
	"activity/game",
	"activity/templates",
	"sugar-web/graphics/presencepalette",
	"sugar-web/graphics/palette",
	"humane"
], function (activity, env, datastore, game, templates, presencepalette, palette, humane) {

	// DOM ready
	requirejs(["domReady!"], function (doc) {

		// Initialize Sugarizer activity
		activity.setup();

		var currentGame = null;

		// Get environment
		env.getEnvironment(function (err, environment) {

			// Create game
			var canvasEl = document.getElementById("dot-canvas");
			currentGame = new game.Game(canvasEl);

			// Load from Journal
			if (environment.objectId) {
				activity.getDatastoreObject().loadAsText(function (error, metadata, data) {
					if (error == null && data != null) {
						try {
							var parsed = JSON.parse(data);
							currentGame.fromJSON(parsed);
							if (parsed.mode) { 
								setActiveButton(parsed.mode); 
								var saveBtn = document.getElementById("save-image-button");
								if (parsed.mode !== "draw") {
									if (networkBtn) networkBtn.style.display = "none";
									if (saveBtn) saveBtn.style.display = "none";
								}
							}
						} catch (e) {
							console.log("Error loading saved data:", e);
						}
					}
				});
			}

			// --- Mode buttons ---
			var modeButtons = {
				"draw": document.getElementById("mode-draw-button"),
				"number": document.getElementById("mode-number-button"),
				"capture": document.getElementById("mode-capture-button")
			};

			function setActiveButton(modeName) {
				for (var key in modeButtons) {
					if (modeButtons.hasOwnProperty(key)) {
						modeButtons[key].classList.remove("active");
					}
				}
				if (modeButtons[modeName]) {
					modeButtons[modeName].classList.add("active");
				}
			}

			// Default: Draw mode active
			setActiveButton("draw");
			currentGame.setMode("draw");

			// Network Palette
			var networkBtn = document.getElementById("network-button");
			var presence = null;
			var isHost = false;

			var onNetworkDataReceived = function(msg) {
				if (presence.getUserInfo().networkId === msg.user.networkId) {
					return;
				}
				if (msg.content.action === 'syncState') {
					// We only sync the draw mode for now as requested, but Game.fromJSON handles everything safely.
					if (msg.content.state) {
						currentGame.fromJSON(msg.content.state);
						// Prevent pushing this remote state onto our local undo stack
						currentGame.saveState(true);
					}
				} else if (msg.content.action === 'init') {
					if (isHost) {
						// Send our current state to the new user
						presence.sendMessage(presence.getSharedInfo().id, {
							user: presence.getUserInfo(),
							content: {
								action: 'syncState',
								state: currentGame.toJSON()
							}
						});
					}
				}
			};

			var onNetworkUserChanged = function(msg) {
				if (isHost && msg.move === 1) {
					// A new user joined, let's sync our state with them
					presence.sendMessage(presence.getSharedInfo().id, {
						user: presence.getUserInfo(),
						content: {
							action: 'syncState',
							state: currentGame.toJSON()
						}
					});
				}
			};

			var netPalette = new presencepalette.PresencePalette(networkBtn, undefined);
			netPalette.addEventListener('shared', function() {
				netPalette.popDown();
				presence = activity.getPresenceObject(function(error, network) {
					if (error) return;
					network.createSharedActivity('org.sugarlabs.ConnectTheDots', function(groupId) {
						isHost = true;
					});
					network.onDataReceived(onNetworkDataReceived);
					network.onSharedActivityUserChanged(onNetworkUserChanged);
				});
			});

			// If launched from neighborhood
			if (environment.sharedId) {
				presence = activity.getPresenceObject(function(error, network) {
					if (error) return;
					network.joinSharedActivity(environment.sharedId, function() {
						// Wait for init state
						network.sendMessage(environment.sharedId, {
							user: presence.getUserInfo(),
							content: { action: 'init' }
						});
					});
					network.onDataReceived(onNetworkDataReceived);
					network.onSharedActivityUserChanged(onNetworkUserChanged);
				});
			}

			// Hook into local game state changes to propagate them over the network
			currentGame.onStateChanged = function(state) {
				if (presence && presence.getSharedInfo() && presence.getSharedInfo().id) {
					presence.sendMessage(presence.getSharedInfo().id, {
						user: presence.getUserInfo(),
						content: {
							action: 'syncState',
							state: state
						}
					});
				}
			};

			var templatePalette = document.getElementById("template-palette");
			var colorPalette = document.getElementById("color-palette");
			
			// Initialize completely native SugarWeb Palettes
			var numberPaletteObj = new palette.Palette(document.getElementById("mode-number-button"), "Templates");
			numberPaletteObj.getPalette().id = "number-palette";
			var tplWrapper = numberPaletteObj.getPalette().querySelector('.wrapper');
			if (tplWrapper) {
				tplWrapper.style.maxWidth = "400px";
				tplWrapper.style.width = "380px";
			}
			
			templatePalette.classList.remove("tpl-picker", "hidden");
			templatePalette.style.width = "100%";
			numberPaletteObj.setContent([templatePalette]);

			var colorPaletteObj = new palette.Palette(document.getElementById("color-button"), "Colors");
			colorPalette.classList.remove("color-palette", "hidden");
			colorPalette.style.display = "flex";
			colorPalette.style.flexWrap = "wrap";
			colorPalette.style.gap = "6px";
			colorPalette.style.padding = "10px";
			colorPalette.style.width = "175px";
			colorPaletteObj.setContent([colorPalette]);

			function saveImageToJournal() {
				var canvas = document.getElementById("dot-canvas");
				var offscreen = document.createElement("canvas");
				offscreen.width = canvas.width;
				offscreen.height = canvas.height;
				var ctx = offscreen.getContext("2d");
				ctx.fillStyle = "#FDFDFD";
				ctx.fillRect(0, 0, offscreen.width, offscreen.height);
				ctx.drawImage(canvas, 0, 0);

				var inputData = offscreen.toDataURL('image/png', 1);

				var metadata = {
					mimetype: 'image/png',
					title: "Connect the Dots Image",
					activity: "org.olpcfrance.MediaViewerActivity",
					timestamp: new Date().getTime(),
					creation_time: new Date().getTime(),
					file_size: 0
				};

				datastore.create(metadata, function () {
					humane.log("Image saved to Journal");
					console.log("Image saved to Journal successfully.");
				}, inputData);
			}

			for (var modeName in modeButtons) {
				(function (name) {
					if (name === "number") return; // Handled dynamically below
						modeButtons[name].addEventListener("click", function () {
							currentGame.setMode(name);
							setActiveButton(name);

							var saveBtn = document.getElementById("save-image-button");

							// Restrict Network and Capture buttons to Draw mode only
							if (name === "draw") {
								networkBtn.style.display = "";
								if(saveBtn) saveBtn.style.display = "";
							} else {
								networkBtn.style.display = "none";
								if(saveBtn) saveBtn.style.display = "none";
							}
						});
				})(modeName);
			}

			// --- Color palette ---
			var colorBtn = document.getElementById("color-button");
			var swatches = colorPalette.querySelectorAll(".color-swatch");
			
			var tplGrid = document.getElementById("tpl-grid");
			var tplTabs = templatePalette.querySelectorAll(".tpl-tab");
			var numberBtn = document.getElementById("mode-number-button");

			function renderMiniature(canvas, tplData) {
				var ctx = canvas.getContext("2d");
				var w = 40, h = 40;
				canvas.width = w;
				canvas.height = h;
				ctx.clearRect(0, 0, w, h);

				var parts = tplData.parts;
				var allPts = [];
				for (var p = 0; p < parts.length; p++) {
					var dots = parts[p].dots || parts[p];
					for (var i = 0; i < dots.length; i++) allPts.push(dots[i]);
				}
				if (allPts.length === 0) return;

				var minR = allPts[0].r, maxR = allPts[0].r;
				var minC = allPts[0].c, maxC = allPts[0].c;
				for (var a = 1; a < allPts.length; a++) {
					if (allPts[a].r < minR) minR = allPts[a].r;
					if (allPts[a].r > maxR) maxR = allPts[a].r;
					if (allPts[a].c < minC) minC = allPts[a].c;
					if (allPts[a].c > maxC) maxC = allPts[a].c;
				}

				var rangeR = maxR - minR || 1;
				var rangeC = maxC - minC || 1;
				var pad = 5;
				var scale = Math.min((h - pad * 2) / rangeR, (w - pad * 2) / rangeC);
				var offX = (w - rangeC * scale) / 2;
				var offY = (h - rangeR * scale) / 2;

				function toX(c) { return offX + (c - minC) * scale; }
				function toY(r) { return offY + (r - minR) * scale; }

				ctx.strokeStyle = "#FFF";
				ctx.lineWidth = 1.5;
				for (var p2 = 0; p2 < parts.length; p2++) {
					var partDef = parts[p2];
					var seq = partDef.dots || partDef;
					var isOpen = !!partDef.open;
					if (seq.length < 2) continue;
					ctx.beginPath();
					ctx.moveTo(toX(seq[0].c), toY(seq[0].r));
					for (var j = 1; j < seq.length; j++) {
						ctx.lineTo(toX(seq[j].c), toY(seq[j].r));
					}
					if (!isOpen) ctx.lineTo(toX(seq[0].c), toY(seq[0].r));
					ctx.stroke();
				}

				ctx.fillStyle = "#FFF";
				for (var d = 0; d < allPts.length; d++) {
					ctx.beginPath();
					ctx.arc(toX(allPts[d].c), toY(allPts[d].r), 2, 0, Math.PI * 2);
					ctx.fill();
				}
			}

			function populateGrid(categoryName) {
				tplGrid.innerHTML = "";
				
				if (categoryName === "Custom") {
					var createCard = document.createElement("button");
					createCard.className = "tpl-card";
					createCard.innerHTML = "<div style='font-size:36px; line-height:60px; color:#fff;'>+</div><span class='tpl-card-name'>Create New</span>";
					createCard.addEventListener("click", function (e) {
						e.stopPropagation();
						numberPaletteObj.popDown();
						currentGame.numberMode.startAuthoring();
						currentGame.setMode("number");
						setActiveButton("number");
					});
					tplGrid.appendChild(createCard);
				}

				var cat = templates.categories[categoryName];
				if (!cat) return;
				for (var tplName in cat) {
					if (cat.hasOwnProperty(tplName)) {
						var card = document.createElement("button");
						card.className = "tpl-card";
						card.setAttribute("data-template", tplName);

						var miniCanvas = document.createElement("canvas");
						renderMiniature(miniCanvas, cat[tplName]);
						card.appendChild(miniCanvas);

						var label = document.createElement("span");
						label.className = "tpl-card-name";
						label.textContent = tplName;
						card.appendChild(label);

						card.addEventListener("click", (function (name) {
							return function (e) {
								e.stopPropagation();
								currentGame.numberMode.loadTemplate(name);
								numberPaletteObj.popDown(); // Close the native palette correctly

								var allCards = tplGrid.querySelectorAll(".tpl-card");
								for (var m = 0; m < allCards.length; m++) allCards[m].classList.remove("selected");
								this.classList.add("selected");

								currentGame.setMode("number");
								setActiveButton("number");
								currentGame.saveState();
							};
						})(tplName));
						tplGrid.appendChild(card);
					}
				}
			}

			// Default: populate with Shapes
			populateGrid("Shapes");

			// Tab click handlers
			for (var t = 0; t < tplTabs.length; t++) {
				tplTabs[t].addEventListener("click", function (e) {
					e.stopPropagation();
					for (var u = 0; u < tplTabs.length; u++) tplTabs[u].classList.remove("active");
					this.classList.add("active");
					populateGrid(this.getAttribute("data-category"));
				});
			}

			numberBtn.addEventListener("click", function (e) {
				// Prevent stop propagation here because the exact behavior is handled by palette.js clicks
				currentGame.setMode("number");
				setActiveButton("number");
				networkBtn.style.display = "none";
				var saveBtn = document.getElementById("save-image-button");
				if(saveBtn) saveBtn.style.display = "none";
			});

			for (var i = 0; i < swatches.length; i++) {
				swatches[i].addEventListener("click", function (e) {
					e.stopPropagation();
					var color = this.getAttribute("data-color");
					currentGame.setColor(color);
					colorPaletteObj.popDown();

					for (var j = 0; j < swatches.length; j++) {
						swatches[j].classList.remove("selected");
					}
					this.classList.add("selected");
				});
			}

			// --- Undo / Redo ---
			document.getElementById("undo-button").addEventListener("click", function () {
				currentGame.undo();
			});

			document.getElementById("redo-button").addEventListener("click", function () {
				currentGame.redo();
			});

			// --- Clear button ---
			document.getElementById("clear-button").addEventListener("click", function () {
				currentGame.clear();
			});

			// --- Save Custom Authoring Sequence ---
			document.getElementById("save-authoring").addEventListener("click", function () {
				var parts = currentGame.numberMode.finishAuthoring();
				if (parts) {
					var id = "Custom " + (Object.keys(templates.categories["Custom"] || {}).length + 1);
					templates.addCustomTemplate(id, parts);
					populateGrid("Custom");
					currentGame.numberMode.loadTemplate(id); // Instantly try it
					currentGame.saveState();
				} else {
					humane.log("Please click at least 3 dots to create a custom design.");
				}
			});

			// --- Save Image to Journal ---
			document.getElementById("save-image-button").addEventListener("click", saveImageToJournal);

			// --- Save to Journal on Stop ---
			document.getElementById("stop-button").addEventListener("click", function (event) {
				console.log("Saving Connect the Dots...");
				var jsonData = JSON.stringify(currentGame.toJSON());
				activity.getDatastoreObject().setDataAsText(jsonData);
				activity.getDatastoreObject().save(function (error) {
					if (error === null) {
						console.log("Save successful.");
					} else {
						console.log("Save failed.");
					}
				});
			});
		});
	});
});
