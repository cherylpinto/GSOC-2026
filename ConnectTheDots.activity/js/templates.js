define([], function () {
	"use strict";

	var categories = {
		"Shapes": {
			"square": {
				parts: [
					{
						dots: [
							{ r: -2, c: -2, label: "1" },
							{ r: -2, c: 2, label: "2" },
							{ r: 2, c: 2, label: "3" },
							{ r: 2, c: -2, label: "4" }
						]
					}
				]
			},
			"triangle": {
				parts: [
					{
						dots: [
							{ r: 3, c: -3, label: "1" },
							{ r: -3, c: 0, label: "2" },
							{ r: 3, c: 3, label: "3" }
						]
					}
				]
			},
			"diamond": {
				parts: [
					{
						dots: [
							{ r: -4, c: 0, label: "1" },
							{ r: 0, c: 3, label: "2" },
							{ r: 4, c: 0, label: "3" },
							{ r: 0, c: -3, label: "4" }
						]
					}
				]
			},
			"pentagon": {
				parts: [
					{
						dots: [
							{ r: -4, c: 0, label: "1" },
							{ r: -1, c: 4, label: "2" },
							{ r: 3, c: 3, label: "3" },
							{ r: 3, c: -3, label: "4" },
							{ r: -1, c: -4, label: "5" }
						]
					}
				]
			},
			"hexagon": {
				parts: [
					{
						dots: [
							{ r: -4, c: 0, label: "1" },
							{ r: -2, c: 3, label: "2" },
							{ r: 2, c: 3, label: "3" },
							{ r: 4, c: 0, label: "4" },
							{ r: 2, c: -3, label: "5" },
							{ r: -2, c: -3, label: "6" }
						]
					}
				]
			},
			"star": {
				parts: [
					{
						dots: [
							{ r: -4, c: 0, label: "1" },
							{ r: 3, c: 3, label: "2" },
							{ r: -1, c: -4, label: "3" },
							{ r: -1, c: 4, label: "4" },
							{ r: 3, c: -3, label: "5" }
						]
					}
				]
			},
			"heart": {
				parts: [
					{
						dots: [
							{ r: -2, c: 0, label: "1" },
							{ r: -4, c: -2, label: "2" },
							{ r: -3, c: -4, label: "3" },
							{ r: 0, c: -3, label: "4" },
							{ r: 4, c: 0, label: "5" },
							{ r: 0, c: 3, label: "6" },
							{ r: -3, c: 4, label: "7" },
							{ r: -4, c: 2, label: "8" }
						]
					}
				]
			},
			"crown": {
				parts: [
					{
						dots: [
							{ r: 3, c: -4, label: "1" },
							{ r: -2, c: -3, label: "2" },
							{ r: 1, c: -1, label: "3" },
							{ r: -3, c: 0, label: "4" },
							{ r: 1, c: 1, label: "5" },
							{ r: -2, c: 3, label: "6" },
							{ r: 3, c: 4, label: "7" }
						]
					}
				]
			},
			"house": {
				parts: [
					{
						dots: [
							{ r: 3, c: -4, label: "1" },   
							{ r: -1, c: -4, label: "2" },  
							{ r: -1, c: -5, label: "3" },  
							{ r: -4, c: 0, label: "4" },   
							{ r: -1, c: 5, label: "5" },   
							{ r: -1, c: 4, label: "6" }, 
							{ r: 3, c: 4, label: "7" }     
						]
					}
				]
			},
			"boat": {
				parts: [
					{
						dots: [
							{ r: 2, c: -5, label: "1" },
							{ r: 4, c: -3, label: "2" },
							{ r: 4, c: 3, label: "3" },
							{ r: 2, c: 5, label: "4" }
						]
					},
					{
						dots: [
							{ r: -4, c: -1, label: "1" },
							{ r: 2, c: -1, label: "2" },
							{ r: 2, c: -4, label: "3" }
						]
					}
				]
			},
			"tree": {
				parts: [
					{
						dots: [
							{ r: -4, c: 0, label: "1" },
							{ r: -1, c: -2, label: "2" },
							{ r: -1, c: -1, label: "3" },
							{ r: 2, c: -3, label: "4" },
							{ r: 2, c: -1, label: "5" },
							{ r: 5, c: -1, label: "6" },
							{ r: 5, c: 1, label: "7" },
							{ r: 2, c: 1, label: "8" },
							{ r: 2, c: 3, label: "9" },
							{ r: -1, c: 1, label: "10" },
							{ r: -1, c: 2, label: "11" }
						]
					}
				]
			}
		},
		"Animals": {
			                        "fish": {
                                parts: [
                                        {
                                                dots: [
                                                        { r: 3, c: 1, label: "1" },
                                                        { r: 0, c: 4, label: "2" },
                                                        { r: -3, c: 1, label: "3" },
                                                        { r: -1, c: -2, label: "4" },
                                                        { r: -3, c: -5, label: "5" },
                                                        { r: 3, c: -5, label: "6" },
                                                        { r: 1, c: -2, label: "7" }
                                                ]
                                        }
                                ]
                        },
				"bird": {
				parts: [
					{
						dots: [
							{ r: -3, c: -5, label: "1" },
							{ r: -5, c: -3, label: "2" },
							{ r: -4, c: -1, label: "3" },
							{ r: -2, c: 2, label: "4" },
							{ r: -3, c: 5, label: "5" },
							{ r: -1, c: 5, label: "6" },
							{ r: 1, c: 2, label: "7" },
							{ r: 3, c: 1, label: "8" },
							{ r: 3, c: -2, label: "9" },
							{ r: 0, c: -4, label: "10" },
							{ r: -2, c: -4, label: "11" }
						]
					}
				]
			},

			"dog": {
				parts: [
					{
						dots: [
							{ r: -2, c: -5, label: "1" },
							{ r: -3, c: -4, label: "2" },
							{ r: -4, c: -2, label: "3" },
							{ r: -4, c: 0, label: "4" },
							{ r: -2, c: 0, label: "5" },
							{ r: -2, c: 3, label: "6" },
							{ r: -4, c: 4, label: "7" },
							{ r: -1, c: 4, label: "8" },
							{ r: 4, c: 4, label: "9" },
							{ r: 4, c: 3, label: "10" },
							{ r: 1, c: 2, label: "11" },
							{ r: 1, c: -1, label: "12" },
							{ r: 4, c: -1, label: "13" },
							{ r: 4, c: -2, label: "14" },
							{ r: 1, c: -3, label: "15" },
							{ r: -1, c: -4, label: "16" }
						]
					}
				]
			},

			            "butterfly": {
                parts: [
                    { dots: [
                        { r: -4, c: 0, label: "1" },
                        { r: -7, c: -1, label: "2" },
                        { r: -4, c: -1, label: "3" },
                        { r: -5, c: -4, label: "4" },
                        { r: -5, c: -6, label: "5" },
                        { r: -2, c: -7, label: "6" },
                        { r: -1, c: -5, label: "7" },
                        { r: 0, c: -2, label: "8" },
                        { r: 1, c: -5, label: "9" },
                        { r: 3, c: -6, label: "10" },
                        { r: 5, c: -4, label: "11" },
                        { r: 4, c: -1, label: "12" },
                        { r: 2, c: 0, label: "13" },
                        { r: 4, c: 1, label: "14" },
                        { r: 5, c: 4, label: "15" },
                        { r: 3, c: 6, label: "16" },
                        { r: 1, c: 5, label: "17" },
                        { r: 0, c: 2, label: "18" },
                        { r: -1, c: 5, label: "19" },
                        { r: -2, c: 7, label: "20" },
                        { r: -5, c: 6, label: "21" },
                        { r: -5, c: 4, label: "22" },
                        { r: -4, c: 1, label: "23" },
                        { r: -7, c: 1, label: "24" }
                    ]}
                ]
            },
            "cat": {
				parts: [
					{
						dots: [
							{ r: -4, c: -2, label: "1" },
							{ r: -3, c: 0, label: "2" },
							{ r: -4, c: 2, label: "3" },
							{ r: -2, c: 2, label: "4" },
							{ r: -1, c: 1, label: "5" },
							{ r: 2, c: 2, label: "6" },
							{ r: 0, c: 4, label: "7" },
							{ r: 4, c: 3, label: "8" },
							{ r: 4, c: -1, label: "9" },
							{ r: 4, c: -3, label: "10" },
							{ r: 2, c: -2, label: "11" },
							{ r: -1, c: -1, label: "12" },
							{ r: -2, c: -2, label: "13" }
						]
					}
				]
			}
		},
		"Letters": {
			"A": {
				parts: [
					{
						dots: [
							{ r: 4, c: -4, label: "1" },
							{ r: -3, c: 0, label: "2" },
							{ r: 4, c: 4, label: "3" }
						], open: true
					},
					{
						dots: [
							{ r: 1, c: -2, label: "1" },
							{ r: 1, c: 2, label: "2" }
						], open: true
					}
				]
			},
			"B": {
				parts: [
					{
						dots: [
							{ r: -4, c: -3, label: "1" },
							{ r: 4, c: -3, label: "2" }
						], open: true
					},
					{
						dots: [
							{ r: -4, c: -3, label: "1" },
							{ r: -4, c: 2, label: "2" },
							{ r: -2, c: 4, label: "3" },
							{ r: 0, c: 2, label: "4" },
							{ r: 0, c: -3, label: "5" }
						], open: true
					},
					{
						dots: [
							{ r: 0, c: -3, label: "1" },
							{ r: 0, c: 3, label: "2" },
							{ r: 2, c: 5, label: "3" },
							{ r: 4, c: 3, label: "4" },
							{ r: 4, c: -3, label: "5" }
						], open: true
					}
				]
			},
			"C": {
				parts: [
					{
						dots: [
							{ r: -3, c: 4, label: "1" },
							{ r: -4, c: 2, label: "2" },
							{ r: -4, c: -2, label: "3" },
							{ r: -2, c: -4, label: "4" },
							{ r: 2, c: -4, label: "5" },
							{ r: 4, c: -2, label: "6" },
							{ r: 4, c: 2, label: "7" },
							{ r: 3, c: 4, label: "8" }
						], open: true
					}
				]
			},
			"E": {
				parts: [
					{
						dots: [
							{ r: -4, c: 3, label: "1" },
							{ r: -4, c: -2, label: "2" },
							{ r: 4, c: -2, label: "3" },
							{ r: 4, c: 3, label: "4" }
						], open: true
					},
					{
						dots: [
							{ r: 0, c: -2, label: "1" },
							{ r: 0, c: 2, label: "2" }
						], open: true
					}
				]
			},
			"F": {
				parts: [
					{
						dots: [
							{ r: 4, c: -3, label: "1" },
							{ r: -4, c: -3, label: "2" },
							{ r: -4, c: 4, label: "3" }
						], open: true
					},
					{
						dots: [
							{ r: 0, c: -3, label: "1" },
							{ r: 0, c: 2, label: "2" }
						], open: true
					}
				]
			},
			"H": {
				parts: [
					{
						dots: [
							{ r: -4, c: -3, label: "1" },
							{ r: 4, c: -3, label: "2" }
						], open: true
					},
					{
						dots: [
							{ r: -4, c: 3, label: "1" },
							{ r: 4, c: 3, label: "2" }
						], open: true
					},
					{
						dots: [
							{ r: 0, c: -3, label: "1" },
							{ r: 0, c: 3, label: "2" }
						], open: true
					}
				]
			},
			"M": {
				parts: [
					{
						dots: [
							{ r: 4, c: -4, label: "1" },
							{ r: -4, c: -4, label: "2" },
							{ r: 0, c: 0, label: "3" },
							{ r: -4, c: 4, label: "4" },
							{ r: 4, c: 4, label: "5" }
						], open: true
					}
				]
			},
			"O": {
				parts: [
					{
						dots: [
							{ r: -4, c: -2, label: "1" },
							{ r: -4, c: 2, label: "2" },
							{ r: -2, c: 4, label: "3" },
							{ r: 2, c: 4, label: "4" },
							{ r: 4, c: 2, label: "5" },
							{ r: 4, c: -2, label: "6" },
							{ r: 2, c: -4, label: "7" },
							{ r: -2, c: -4, label: "8" }
						]
					} // false open = closes
				]
			},
			"S": {
				parts: [
					{
						dots: [
							{ r: -4, c: 4, label: "1" },
							{ r: -4, c: -2, label: "2" },
							{ r: -2, c: -4, label: "3" },
							{ r: 0, c: -2, label: "4" },
							{ r: 0, c: 2, label: "5" },
							{ r: 2, c: 4, label: "6" },
							{ r: 4, c: 2, label: "7" },
							{ r: 4, c: -4, label: "8" }
						], open: true
					}
				]
			},
			"Z": {
				parts: [
					{
						dots: [
							{ r: -3, c: -3, label: "1" },
							{ r: -3, c: 3, label: "2" },
							{ r: 3, c: -3, label: "3" },
							{ r: 3, c: 3, label: "4" }
						], open: true
					}
				]
			}
		},
		"Numbers": {
			"0": {
				parts: [
					{
						dots: [
							{ r: -4, c: -2, label: "1" },
							{ r: -4, c: 2, label: "2" },
							{ r: -2, c: 4, label: "3" },
							{ r: 2, c: 4, label: "4" },
							{ r: 4, c: 2, label: "5" },
							{ r: 4, c: -2, label: "6" },
							{ r: 2, c: -4, label: "7" },
							{ r: -2, c: -4, label: "8" }
						]
					}
				]
			},
			"1": {
				parts: [
					{
						dots: [
							{ r: -2, c: -1, label: "1" },
							{ r: -3, c: 0, label: "2" },
							{ r: 3, c: 0, label: "3" }
						], open: true
					},
					{
						dots: [
							{ r: 3, c: -2, label: "1" },
							{ r: 3, c: 2, label: "2" }
						], open: true
					}
				]
			},
			"2": {
				parts: [
					{
						dots: [
							{ r: -2, c: -3, label: "1" },
							{ r: -4, c: 0, label: "2" },
							{ r: -2, c: 3, label: "3" },
							{ r: 0, c: 1, label: "4" },
							{ r: 4, c: -3, label: "5" },
							{ r: 4, c: 3, label: "6" }
						], open: true
					}
				]
			},
			"3": {
				parts: [
					{
						dots: [
							{ r: -4, c: -3, label: "1" },
							{ r: -4, c: 2, label: "2" },
							{ r: -2, c: 4, label: "3" },
							{ r: 0, c: 1, label: "4" },
							{ r: 2, c: 4, label: "5" },
							{ r: 4, c: 2, label: "6" },
							{ r: 4, c: -3, label: "7" }
						], open: true
					}
				]
			},
			"4": {
				parts: [
					{
						dots: [
							{ r: -4, c: -3, label: "1" },
							{ r: 1, c: -3, label: "2" },
							{ r: 1, c: 3, label: "3" }
						], open: true
					},
					{
						dots: [
							{ r: -2, c: 2, label: "1" },
							{ r: 4, c: 2, label: "2" }
						], open: true
					}
				]
			},
			"5": {
				parts: [
					{
						dots: [
							{ r: -4, c: 3, label: "1" },
							{ r: -4, c: -3, label: "2" },
							{ r: -1, c: -3, label: "3" },
							{ r: -1, c: 0, label: "4" },
							{ r: 0, c: 3, label: "5" },
							{ r: 3, c: 3, label: "6" },
							{ r: 4, c: 0, label: "7" },
							{ r: 3, c: -3, label: "8" }
						], open: true
					}
				]
			},
			"6": {
				parts: [
					{
						dots: [
							{ r: -4, c: 3, label: "1" },
							{ r: -4, c: -1, label: "2" },
							{ r: -2, c: -3, label: "3" },
							{ r: 2, c: -3, label: "4" },
							{ r: 4, c: -1, label: "5" },
							{ r: 4, c: 2, label: "6" },
							{ r: 2, c: 4, label: "7" },
							{ r: 0, c: 2, label: "8" },
							{ r: 0, c: -3, label: "9" }
						], open: true
					}
				]
			},
			"7": {
				parts: [
					{
						dots: [
							{ r: -4, c: -3, label: "1" },
							{ r: -4, c: 3, label: "2" },
							{ r: 4, c: -1, label: "3" }
						], open: true
					}
				]
			},
			"8": {
				parts: [
					{
						dots: [
							{ r: -4, c: -2, label: "1" },
							{ r: -4, c: 2, label: "2" },
							{ r: 0, c: 2, label: "3" },
							{ r: 0, c: -2, label: "4" }
						]
					},
					{
						dots: [
							{ r: 0, c: -3, label: "1" },
							{ r: 0, c: 3, label: "2" },
							{ r: 4, c: 3, label: "3" },
							{ r: 4, c: -3, label: "4" }
						]
					}
				]
			},
			"9": {
				parts: [
					{
						dots: [
							{ r: 4, c: -3, label: "1" },
							{ r: 4, c: 1, label: "2" },
							{ r: 2, c: 3, label: "3" },
							{ r: -2, c: 3, label: "4" },
							{ r: -4, c: 1, label: "5" },
							{ r: -4, c: -2, label: "6" },
							{ r: -2, c: -4, label: "7" },
							{ r: 0, c: -2, label: "8" },
							{ r: 0, c: 3, label: "9" }
						], open: true
					}
				]
			}
		}
	};

	// Flatten for lookup
	var allTemplates = {};
	for (var cat in categories) {
		if (categories.hasOwnProperty(cat)) {
			for (var tpl in categories[cat]) {
				if (categories[cat].hasOwnProperty(tpl)) {
					allTemplates[tpl] = categories[cat][tpl].parts;
				}
			}
		}
	}

	function getTemplate(name, centerRow, centerCol) {
		var shapeParts = allTemplates[name];
		if (!shapeParts) return null;

		var parts = [];
		for (var p = 0; p < shapeParts.length; p++) {
			var partDef = shapeParts[p];
			var dots = partDef.dots || partDef;
			var sequence = [];
			for (var i = 0; i < dots.length; i++) {
				sequence.push({
					row: centerRow + dots[i].r,
					col: centerCol + dots[i].c,
					label: dots[i].label
				});
			}
			sequence.open = !!partDef.open;
			parts.push(sequence);
		}
		return parts;
	}

	function addCustomTemplate(name, parts) {
		if (!categories["Custom"]) {
			categories["Custom"] = {};
		}
		categories["Custom"][name] = { parts: parts };
		allTemplates[name] = parts;
	}

	return {
		getTemplate: getTemplate,
		addCustomTemplate: addCustomTemplate,
		categories: categories,
		list: Object.keys(allTemplates)
	};
});






