<script>
	import { scaleLinear } from 'd3';
	import { grid } from '$lib/data/worldtilegrid.js';

	import { seek, update, createParticle } from '$lib/utils/pixiParticle.js';

	import * as PIXI from 'pixi.js';
	import { Stats } from 'pixi-stats';

	export let goalTargets = [];

	$: console.log(grid);

	const MARGIN = 20;
	let RADIUS = 3;
	const INDICATORS = 249;

	const BOXDIMS = { w: 28, h: 28 };

	let sortmode = 'levels';
	let layout = 'geo';

	let canvas, ctx;

	let nodes;
	let frame = 0;

	let w, h;

	let xScale = scaleLinear().domain([0, 29]);
	let yScale = scaleLinear().domain([0, 22]);

	let isSetup = false;

	let particleContainer;
	let countryLevels;

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

		if (layout === 'geo') {
			let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
			RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);
			console.log(RADIUS);

			grid.forEach((country) => {
				const countryOffset = new PIXI.Point(xScale(country.x), yScale(country.y));

				const cnodes = nodes
					.filter((d) => d.country === country.iso3c)
					.sort(sortmode === 'goals' ? sortByNone : sortByLevel);
				cnodes.forEach((d, i) => {
					if (d.type === 'indicator') {
						d.target.x = Math.floor(i % nodesPerLine) * RADIUS + countryOffset.x;
						d.target.y = Math.floor(i / nodesPerLine) * RADIUS + countryOffset.y;

						d.scaleTarget = RADIUS;
					} else {
						d.target.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
						d.target.y = countryOffset.y;
					}
				});
			});

			nodes
				.filter((d) => d.type === 'goallabel')
				.forEach((d) => {
					//d.target.x = 5 * RADIUS * d.sdgGoal + 50;
					d.target.y = -20;
				});
		} else if (layout === 'goals') {
			const iw = w - 10;
			const ih = h - 10;

			countryLevels.sort((a, b) => b.value - a.value);

			grid.forEach((country, i) => {
				RADIUS = 10;
				// const countryOffset = new PIXI.Point(0, 10 + (i * ih) / grid.length);

				let yVal =
					sortmode === 'goals' ? i : countryLevels.findIndex((d) => d.country === country.iso3c);

				const countryOffset = new PIXI.Point(50, 40 + yVal * 12);

				const cnodes = nodes.filter((d) => d.country === country.iso3c).sort(sortByNone);

				for (let goal = 1; goal <= 17; goal++) {
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

								d.scaleTarget = RADIUS;
							}
						});
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
					d.target.x = 4 * RADIUS * d.sdgGoal + 50;
					d.target.y = 20;
				});
		}

		particleContainer.update();

		console.log(nodes);
	}

	async function setup() {
		w = 1280; //window.innerWidth;
		h = 800; // window.innerHeight;

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
			backgroundColor: '#f6f5f3',
			antialias: true,
			clearBeforeRender: true
		});

		const stats = new Stats(renderer);

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
			graphics.rect(0, 0, width, height);
			graphics.fill(color);

			// Generate a texture from the graphics
			return renderer.generateTexture(graphics);
		}

		xScale.range([MARGIN, w - MARGIN * 2]);
		yScale.range([MARGIN, h - MARGIN * 2]);

		nodes = [];

		const tex = PIXI.Texture.WHITE; //createColoredTexture(0xffffff, RADIUS, RADIUS);

		let indicatorNum = {};
		for (let goal = 1; goal <= 17; goal++) {
			indicatorNum[goal] = 2 + Math.floor(Math.random() * 2);
		}
		console.log(indicatorNum);

		grid.forEach((d) => {
			const countryLevel = Math.floor(Math.random() * 5);
			for (let goal = 1; goal <= 17; goal++) {
				let indicount = 0;
				/*const targets = goalTargets.filter((d) => +d.goal === goal);

				targets.forEach((target, targetCount) => {
					for (let i = 0; i < target.indicators; i++) {*/
				while (indicount < indicatorNum[goal]) {
					let p = createParticle(w / 2, h / 2, w / 2, h / 2, false, 'indicator');

					p.sdgGoal = goal;
					p.sdgTarget = 1; // target.target;
					p.sdgTargetCount = indicount; //targetCount;
					p.sdgIndicator = 1; //i;

					p.country = d.iso3c;
					p.count = 0; // Math.random() * 100;
					p.level = Math.max(0, Math.min(4, countryLevel + Math.floor(Math.random() * 4) - 2));

					p.view = new PIXI.Particle({
						texture: tex,
						x: Math.random() * w,
						y: Math.random() * h,
						scaleX: RADIUS,
						scaleY: RADIUS,
						tint: colorFromLevel(p.level)
					});
					p.scaleTarget = RADIUS;
					particleContainer.addParticle(p.view);

					nodes.push(p);
					indicount++;
				}
			}
			//});
			//}
		});

		const textStyle = new PIXI.TextStyle({
			fontFamily: 'Arial',
			fontSize: 12,
			fontWeight: 'regular'
		});

		grid.forEach((d) => {
			let labelparticle = createParticle(
				w / 2,
				h / 2,
				Math.floor(xScale(d.x)),
				Math.floor(yScale(d.y)),
				false,
				'label'
			);
			labelparticle.country = d.iso3c;
			labelparticle.count = 0; // Math.random() * 100;

			labelparticle.view = new PIXI.Text({
				text: d.iso3c,
				style: textStyle
			});
			labelparticle.view.anchor = new PIXI.Point(0.5, 0.5);
			spriteContainer.addChild(labelparticle.view);
			nodes.push(labelparticle);
		});

		for (let goal = 1; goal <= 17; goal++) {
			let goalparticle = createParticle(w / 2, -20, -50, -50, false, 'goallabel');
			goalparticle.count = 0;
			goalparticle.sdgGoal = goal;

			goalparticle.view = new PIXI.Text({
				text: `SDG ${goal}`,
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

		// layout nodes:
		layoutNodes(nodes);

		/*
		const testVec = createParticle(0, 0, 100, 100, true);
		console.log(testVec);
		seek(testVec, testVec.target);
		console.log(testVec);
		update(testVec);
		console.log(testVec);
		update(testVec);
		console.log(testVec);
    

		const vec = vector(0, 0, 'lol', true);
		console.log(vec);
		vec.add(vector(100, 100));
		console.log(vec);
    */

		function render() {
			let isDirty = false;

			nodes.forEach((node) => {
				//if (node.type === 'indicator') {
				seek(node, node.target);

				update(node);

				//node.position.v.x += Math.random() * 5 - 2.5;
				//node.position.v.y += Math.random() * 5 - 2.5;

				// transfer position to pixi.js:

				if (node.type === 'indicator') {
					if (node.scaleTarget !== node.view.scaleX) {
						let diff = node.scaleTarget - node.view.scaleX;
						diff *= 0.01;
						if (Math.abs(diff) < 0.001) {
							diff = node.scaleTarget - node.view.scaleX;
						}

						node.view.scaleX += diff;
						node.view.scaleY += diff;

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

			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);

		function _render() {
			// Clear canvas
			ctx.fillStyle = '#f6f5f3';
			ctx.fillRect(0, 0, w, h);

			grid.forEach((country) => {
				ctx.fillStyle = '#999';
				ctx.strokeStyle = '#333';

				//ctx.fillRect(0, 0, BOXDIMS.w, BOXDIMS.h);
				// ctx.strokeRect(0, 0, BOXDIMS.w, BOXDIMS.h);

				nodes
					.filter((d) => d.id === country.iso3c)
					.forEach((node) => {
						if (node.count < frame) {
							seek(node, node.target);

							update(node);
						}

						if (node.type === 'indicator') {
							ctx.fillStyle = colorFromLevel(node.level);
							ctx.fillRect(node.position.v.x, node.position.v.y, RADIUS - 0.5, RADIUS - 0.5);
						} else if (node.type === 'label') {
							ctx.font = 'bold 14px Open Sans, sans-serif';
							ctx.textAlign = 'center';
							ctx.fillStyle = '#000';

							ctx.fillText(country.iso3c, node.position.v.x, node.position.v.y);
						}
						/*ctx.beginPath();
						ctx.arc(node.x + RADIUS / 2, node.y + RADIUS / 2, RADIUS / 2 - 0.5, 0, 2 * Math.PI);
						ctx.fill();*/
					});
			});

			frame++;

			//requestAnimationFrame(render);
		}

		//requestAnimationFrame(render);

		isSetup = true;
	}

	$: if (canvas && goalTargets.length > 0 && !isSetup) {
		setup();
	}

	function sort() {
		if (sortmode === 'goals') {
			sortmode = 'levels';
		} else {
			sortmode = 'goals';
		}
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
</script>

<canvas bind:this={canvas} />

<div class="button-panel">
	<button on:click={sort}>toggle sort mode</button>
	<button on:click={changeLayout}>toggle {layout}</button>
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
		top: 130px;
	}
</style>
