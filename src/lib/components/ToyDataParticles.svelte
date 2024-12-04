<script>
	import { scaleLinear, extent } from 'd3';
	import { grid } from '$lib/data/worldtilegrid.js';

	import { seek, update, createParticle } from '$lib/utils/pixiParticle.js';

	import * as PIXI from 'pixi.js';
	import { Stats } from 'pixi-stats';

	export let goalTargets = [];

	$: console.log(grid);

	const MARGIN = { x: 20, y: 120 };
	let RADIUS = 3;
	const INDICATORS = 249;

	const BASE_SPEED = 25; //ms => 40fps
	const FOCUS_GOAL = 9;

	const BOXDIMS = { w: 28, h: 28 };

	let sortmode = 'goals';
	let layout = 'intro';

	let canvas, ctx;

	let nodes;
	let frame = 0;

	let w, h;

	let xScale = scaleLinear().domain([0, 29]);
	let yScale = scaleLinear().domain([0, 22]);

	let scatterXScale = scaleLinear().domain([0, 1]);
	let scatterYScale = scaleLinear().domain([1, 0]);

	let barXScale = scaleLinear().domain([0, 1]);
	let valuePPScale = scaleLinear().domain([0, 1]);

	let isSetup = false;

	let particleContainer;
	let countryLevels;
	let introlabel;

	let ticker;

	function colorFromLevel(level) {
		const col = new PIXI.Color([0xf75781, 0xfda696, 0xfbe9aa, 0x60d1c3, 0x009ee9][level]);
		return col.toBgrNumber();
	}

	function sortByLevel(a, b) {
		return b.level - a.level;
	}

	function sortByNone(a, b) {
		return 0;
	}

	function layoutNodes(nodes) {
		frame = 0;

		let indicatorCount = nodes.filter((d) => d.country === grid[0].iso3c).length;
		console.log(indicatorCount);

		if (layout === 'intro') {
			nodes.forEach((d) => {
				if (d.type === 'indicator') {
					d.target.x = w * 0.4 - 35;
					d.target.y = h * 0.4 - 25;

					d.scaleTarget.x = 50;
					d.scaleTarget.y = 50;
				} else {
					d.target.x = d.homepoint.x;
					d.target.y = d.homepoint.y;
				}
			});
		} else if (layout === 'geo' && sortmode !== 'barchart') {
			let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
			RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);
			console.log(RADIUS);

			grid.forEach((country) => {
				const countryOffset = new PIXI.Point(xScale(country.x), yScale(country.y));

				if (sortmode === 'goals' || sortmode === 'levels') {
					const cnodes = nodes
						.filter((d) => d.country === country.iso3c)
						.sort(sortmode === 'goals' ? sortByNone : sortByLevel);
					cnodes.forEach((d, i) => {
						if (d.type === 'indicator') {
							d.target.x = Math.floor(i % nodesPerLine) * RADIUS + countryOffset.x;
							d.target.y = Math.floor(i / nodesPerLine) * RADIUS + countryOffset.y;

							d.scaleTarget.x = d.scaleTarget.y = RADIUS;
						} else {
							d.target.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
							d.target.y = countryOffset.y;
						}
					});
				} else if (sortmode === 'focus') {
					// focus mode
					const cnodes = nodes.filter((d) => d.country === country.iso3c);

					cnodes.forEach((node) => {
						if (node.type === 'indicator') {
							node.target.x = node.homepoint.x;
							node.target.y = node.homepoint.y;
						}
					});

					// keep the focus nodes:
					cnodes
						.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
						.forEach((d, i) => {
							d.target.x = countryOffset.x;
							d.target.y = countryOffset.y;

							d.scaleTarget.x = d.scaleTarget.y = BOXDIMS.w;
						});

					// labels
					cnodes
						.filter((d) => d.type === 'label')
						.forEach((d, i) => {
							d.target.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
							d.target.y = countryOffset.y;
						});
				} else if (sortmode === 'absoluteprogress') {
					// focus mode
					const cnodes = nodes.filter((d) => d.country === country.iso3c);

					cnodes.forEach((node) => {
						if (node.type === 'indicator') {
							node.target.x = node.homepoint.x;
							node.target.y = node.homepoint.y;
						}
					});

					// keep the focus nodes:
					cnodes
						.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
						.forEach((d, i) => {
							d.target.x =
								countryOffset.x + BOXDIMS.w / 2 - (BOXDIMS.w * valuePPScale(d.valuePP)) / 2;
							d.target.y =
								countryOffset.y + BOXDIMS.h / 2 - (BOXDIMS.w * valuePPScale(d.valuePP)) / 2;

							d.scaleTarget.x = d.scaleTarget.y = BOXDIMS.w * (valuePPScale(d.valuePP) * 0.8 + 0.2);
						});

					// labels
					cnodes
						.filter((d) => d.type === 'label')
						.forEach((d, i) => {
							d.target.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
							d.target.y = countryOffset.y;
						});
				} else if (sortmode === 'scatterplot') {
					const cnodes = nodes.filter((d) => d.country === country.iso3c);

					if (cnodes.length > 0) {
						cnodes.forEach((node) => {
							if (node.type === 'indicator') {
								node.target.x = node.homepoint.x;
								node.target.y = node.homepoint.y;
							}
						});

						RADIUS = BOXDIMS.w / 3;

						// keep the focus nodes:
						let cnode = cnodes.find((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL);

						if (cnode) {
							cnode.target.x = scatterXScale(cnode.valueAbs);
							cnode.target.y = scatterYScale(cnode.valuePP);

							cnode.scaleTarget.x = cnode.scaleTarget.y = RADIUS;

							// labels
							cnodes
								.filter((d) => d.type === 'label')
								.forEach((d, i) => {
									d.target.x = cnode.target.x + 5;
									d.target.y = cnode.target.y - 5;
								});
						}
					}
				}
			});

			nodes
				.filter((d) => d.type === 'goallabel')
				.forEach((d) => {
					//d.target.x = 5 * RADIUS * d.sdgGoal + 50;
					d.target.y = d.homepoint.y;
				});
		} else if (layout === 'goals' || sortmode === 'barchart') {
			countryLevels.sort((a, b) => b.value - a.value);

			grid
				.sort((a, b) =>
					sortmode !== 'barchart'
						? a.iso3c.localeCompare(b.iso3c)
						: (nodes.find(
								(d) => d.country === b.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
							)?.valueAbsIndex ?? -1) -
							(nodes.find(
								(d) => d.country === a.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
							)?.valueAbsIndex ?? -1)
				)
				.forEach((country, i) => {
					RADIUS = 10;
					// const countryOffset = new PIXI.Point(0, 10 + (i * ih) / grid.length);

					let yVal =
						sortmode === 'goals' || sortmode === 'barchart'
							? i
							: countryLevels.findIndex((d) => d.country === country.iso3c);

					const countryOffset = new PIXI.Point(50, MARGIN.y + yVal * 12);

					const cnodes = nodes.filter((d) => d.country === country.iso3c).sort(sortByNone);

					for (let goal = 1; goal <= 17; goal++) {
						if (sortmode !== 'barchart') {
							cnodes
								.filter((d) => d.sdgGoal === goal)
								.sort((a, b) => {
									if (sortmode === 'goals') {
										return 0;
									} else {
										return b.level - a.level;
									}
								})
								.forEach((d, i) => {
									if (d.type === 'indicator') {
										d.target.x = d.sdgGoal * (4 * RADIUS) + i * RADIUS + countryOffset.x;
										d.target.y = countryOffset.y; // + d.sdgIndicator * RADIUS;

										d.scaleTarget.x = d.scaleTarget.y = RADIUS;
									}
								});
						} else {
							if (sortmode === 'barchart') {
								const cnodes = nodes.filter((d) => d.country === country.iso3c);

								cnodes.forEach((node) => {
									if (node.type === 'indicator') {
										node.target.x = node.homepoint.x;
										node.target.y = node.homepoint.y;
									}
								});

								RADIUS = BOXDIMS.w / 6;

								// keep the focus nodes:
								cnodes
									.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
									.forEach((d, i) => {
										d.target.x = countryOffset.x;
										d.target.y = countryOffset.y;

										d.scaleTarget.x = barXScale(d.valueAbs);
										d.scaleTarget.y = RADIUS;
									});
							}
						}
					}

					cnodes
						.filter((d) => d.type === 'label')
						.forEach((d) => {
							d.target.x = countryOffset.x;
							d.target.y = countryOffset.y;
						});
				});

			nodes
				.filter((d) => d.type === 'goallabel')
				.forEach((d) => {
					d.homepoint.x = d.target.x = 4 * RADIUS * d.sdgGoal + 50;
					d.target.y = sortmode === 'barchart' ? -20 : MARGIN.y - 20;
				});
		}

		particleContainer.update();

		if (layout === 'intro') {
			introlabel.alpha = 1;
		} else {
			introlabel.alpha = 0;
		}

		console.log(nodes);
	}

	async function setup() {
		w = 1280; //window.innerWidth;
		h = 1200; // window.innerHeight;

		// init pixi.js:
		/*const app = new Application();
		await app.init({
			canvas,
			width: w,
			height: h,
			antialias: false,
			backgroundColor: '#f6f5f3'
		});*/
		const renderer = await PIXI.autoDetectRenderer({
			canvas,
			width: w,
			height: 2500,
			autoDensity: true,
			resolution: window.devicePixelRatio,
			backgroundAlpha: 0,
			//backgroundColor: '#384075',
			antialias: true,
			clearBeforeRender: true
		});

		const stats = new Stats(renderer);

		ticker = PIXI.Ticker.shared;
		ticker.autoStart = false;
		ticker.stop();

		const baseContainer = new PIXI.Container();

		particleContainer = new PIXI.ParticleContainer({
			// this is the default, but we show it here for clarity
			dynamicProperties: {
				position: true, // Allow dynamic position changes (default)
				scale: true, // Static scale for extra performance
				rotation: false, // Static rotation
				color: false
			}
		});

		const spriteContainer = new PIXI.Container();

		baseContainer.addChild(particleContainer);
		baseContainer.addChild(spriteContainer);

		function createColoredTexture(color, width = 10, height = 10) {
			const graphics = new PIXI.Graphics();

			// Draw a filled rectangle with the desired color
			//graphics.rect(0, 0, width, height);
			//graphics.fill(color);
			// Draw a filled circle with the desired color
			graphics.ellipse(width / 2, height / 2, width, height);
			graphics.fill(color);

			// Generate a texture from the graphics
			return renderer.generateTexture(graphics);
		}

		xScale.range([MARGIN.x, w - MARGIN.x * 2]);
		yScale.range([MARGIN.y, h - MARGIN.y * 2]);

		// extract FOCUS_GOAL data domain:
		const focusAbsDomain = extent(
			goalTargets.filter((d) => d.goal === FOCUS_GOAL).map((d) => d.value)
		);
		const focusPPDomain = extent(
			goalTargets.filter((d) => d.goal === FOCUS_GOAL).map((d) => d.diff)
		);

		scatterXScale.domain(focusAbsDomain).range([MARGIN.x, w - MARGIN.x * 2]);
		scatterYScale.domain(focusPPDomain).range([MARGIN.y, h - MARGIN.y * 2]);

		barXScale.domain(focusAbsDomain).range([MARGIN.x, w * 0.6 - MARGIN.x * 2]);
		valuePPScale.domain(focusPPDomain).range([0, 1]);

		nodes = [];

		const tex = PIXI.Texture.WHITE; //createColoredTexture(0xffffff, 1, 1);

		let totalIndicatorNum = goalTargets.length;
		console.log(totalIndicatorNum);

		let overallCount = 0;

		grid.forEach((d) => {
			for (let goal = 1; goal <= 17; goal++) {
				/*const targets = goalTargets.filter((d) => +d.goal === goal);

				targets.forEach((target, targetCount) => {
					for (let i = 0; i < target.indicators; i++) {*/
				let filteredGTs = goalTargets.filter((dd) => dd.iso3c === d.iso3c && dd.goal === goal);

				// console.log(`${d.iso3c} x ${goal} => ${filteredGTs.length}`);
				filteredGTs.forEach((indicator, ii) => {
					let p = createParticle(
						w * 0.4 - 35,
						h * 0.4 - 25,
						w * 0.4 - 35,
						h * 0.4 - 25,
						false,
						'indicator'
					);

					p.sdgGoal = goal;
					p.sdgTargetCount = ii; //targetCount;
					p.sdgIndicator = 1; //i;

					p.country = d.iso3c;
					/*p.valuePP = Math.random() * 0.8 + 0.2;
					let scaledPP = (1 / 0.8) * (p.valuePP - 0.2);

					p.valueAbs =
						(Math.random() * (Math.cos(Math.PI + Math.PI * scaledPP) + 1)) / 2 +
						Math.random() * Math.sin(scaledPP * Math.PI) * 0.5;
					p.level = Math.max(0, Math.min(4, countryLevel + Math.floor(Math.random() * 4) - 2));
					p.valuePP = Math.random() * 0.2 + p.level / 5;*/

					p.level = indicator.level;
					p.valueAbs = indicator.value ?? 0;
					p.valuePP = indicator.diff ?? 0;

					p.homepoint = new PIXI.Point((w * overallCount) / totalIndicatorNum, -50);

					p.view = new PIXI.Particle({
						texture: tex,
						scaleX: RADIUS,
						scaleY: RADIUS,
						tint: colorFromLevel(p.level)
					});
					p.scaleTarget = new PIXI.Point(RADIUS, RADIUS);
					particleContainer.addParticle(p.view);

					nodes.push(p);
					overallCount++;
				});
			}
			//});
			//}
		});

		nodes
			.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
			.sort((a, b) => a?.valueAbs - b?.valueAbs)
			.forEach((d, i) => {
				d.valueAbsIndex = i;
			});

		const textStyle = new PIXI.TextStyle({
			fontFamily: 'Open Sans',
			fontSize: 12,
			fontWeight: 'bold',
			fill: 0xffffff,
			stroke: { color: 0x384075, width: 3 }
		});

		grid.forEach((d, i) => {
			let labelparticle = createParticle(
				(w * i) / grid.length,
				-50,
				Math.floor(xScale(d.x)),
				Math.floor(yScale(d.y)),
				false,
				'label'
			);
			labelparticle.country = d.iso3c;
			labelparticle.homepoint = new PIXI.Point((w * i) / grid.length, -50);

			labelparticle.view = new PIXI.Text({
				text: d.iso3c,
				style: textStyle
			});
			labelparticle.view.anchor = new PIXI.Point(0.5, 0.5);
			spriteContainer.addChild(labelparticle.view);
			nodes.push(labelparticle);
		});

		for (let goal = 1; goal <= 17; goal++) {
			let goalparticle = createParticle(-50, -50, -50, -50, false, 'goallabel');
			goalparticle.homepoint = new PIXI.Point(-50, -50);
			goalparticle.sdgGoal = goal;

			goalparticle.view = new PIXI.Text({
				text: `${goal}`,
				style: textStyle
			});
			//goalparticle.view.anchor = new PIXI.Point(0.5, 0.5);
			spriteContainer.addChild(goalparticle.view);
			nodes.push(goalparticle);
		}

		const countryNodes = {};
		grid.forEach((d) => {
			countryNodes[d.iso3c] = nodes.filter((dd) => dd.country === d.iso3c);
		});

		countryLevels = [];
		grid.forEach((country) => {
			countryLevels.push({
				country: country.iso3c,
				value: countryNodes[country.iso3c].reduce((acc, val) => (val.level ?? 0) + acc, 0)
			});
		});
		console.log(countryLevels);

		introlabel = new PIXI.Text({
			text: '1 indicator X 1 country',
			style: {
				fontFamily: 'Open Sans',
				fontSize: 28,
				fontWeight: '600',
				fill: 0xffffff,
				stroke: { color: 0x384075, width: 3 }
			}
		});
		introlabel.position.x = w * 0.4 + 50;
		introlabel.position.y = h * 0.4 - 15;
		spriteContainer.addChild(introlabel);

		// layout nodes:
		layoutNodes(nodes);

		function render() {
			let isDirty = false;
			let speed = ticker.deltaMS / BASE_SPEED;

			nodes.forEach((node) => {
				//if (node.type === 'indicator') {
				seek(node, node.target, speed);

				update(node, speed);

				//node.position.v.x += Math.random() * 5 - 2.5;
				//node.position.v.y += Math.random() * 5 - 2.5;

				// transfer position to pixi.js:

				if (node.type === 'indicator') {
					if (node.scaleTarget.x !== node.view.scaleX || node.scaleTarget.y !== node.view.scaleY) {
						let diffX = node.scaleTarget.x - node.view.scaleX;
						diffX *= 0.1 * speed;
						if (Math.abs(diffX) < 0.001) {
							diffX = node.scaleTarget.x - node.view.scaleX;
						}

						node.view.scaleX += diffX;

						let diffY = node.scaleTarget.y - node.view.scaleY;
						diffY *= 0.1 * speed;
						if (Math.abs(diffY) < 0.001) {
							diffY = node.scaleTarget.y - node.view.scaleY;
						}

						node.view.scaleY += diffY;

						isDirty = true;
					}

					// particle mode:
					node.view.x = node.position.x;
					node.view.y = node.position.y;
				} else {
					// sprite mode:
					node.view.position.x = node.position.x;
					node.view.position.y = node.position.y;
				}
				//}
			});

			if (isDirty) {
				particleContainer.update();
			}

			renderer.render(baseContainer);
		}

		ticker.add(render);
		ticker.start();

		isSetup = true;
	}

	$: if (canvas && goalTargets.length > 0 && !isSetup) {
		setup();
	}

	function sort() {
		if (sortmode === 'goals') {
			sortmode = 'levels';
		} else if (sortmode === 'levels') {
			sortmode = 'focus';
		} else if (sortmode === 'focus') {
			sortmode = 'absoluteprogress';
		} else if (sortmode === 'absoluteprogress') {
			sortmode = 'scatterplot';
		} else if (sortmode === 'scatterplot') {
			sortmode = 'barchart';
		} else if (sortmode === 'barchart') {
			sortmode = 'goals';
		}
		console.log(sortmode);
		layoutNodes(nodes);
	}

	function changeLayout() {
		if (layout === 'geo') {
			layout = 'goals';
		} else {
			layout = 'geo';
		}
		layoutNodes(nodes);
	}

	let modeIndex = 0;
	let modes = [
		{ layout: 'intro', sortmode: 'goals' },
		{ layout: 'geo', sortmode: 'goals' },
		{ layout: 'geo', sortmode: 'levels' },
		{ layout: 'goals', sortmode: 'goals' },
		{ layout: 'goals', sortmode: 'levels' },
		{ layout: 'geo', sortmode: 'levels' },
		{ layout: 'geo', sortmode: 'focus' },
		{ layout: 'geo', sortmode: 'absoluteprogress' },
		{ layout: 'geo', sortmode: 'scatterplot' },
		{ layout: 'geo', sortmode: 'barchart' }
	];

	function back() {
		step(-1);
	}
	function forward() {
		step(1);
	}

	function step(dir) {
		modeIndex += dir;
		if (modeIndex >= modes.length) {
			modeIndex = 0;
		}
		if (modeIndex < 0) {
			modeIndex = modes.length - 1;
		}

		layout = modes[modeIndex].layout;
		sortmode = modes[modeIndex].sortmode;
		layoutNodes(nodes);
	}
</script>

<canvas bind:this={canvas} />

<div class="button-panel">
	<button on:click={back}>&lt;</button>
	<button on:click={forward}>&gt;</button>
</div>

<style>
	:global(div#stats) {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 500;
		width: max(200px, 10vw, 10vh);
		height: max(100px, 6vh, 6vw);
		opacity: 0.8;
		user-select: none;
	}

	.button-panel {
		position: absolute;
		right: 0;
		top: 160px;
		z-index: 501;
	}
</style>
