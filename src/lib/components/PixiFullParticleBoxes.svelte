<script>
	import { scaleLinear } from 'd3';
	import { grid } from '$lib/data/worldtilegrid.js';

	import { seek, update, createParticle } from '$lib/utils/pixiParticle.svelte.js';

	import * as PIXI from 'pixi.js';
	import { Stats } from 'pixi-stats';

	export let goalTargets = [];

	$: console.log(grid);

	const MARGIN = 20;
	let RADIUS = 3;
	const INDICATORS = 249;

	const BOXDIMS = { w: 60, h: 60 };

	let sortmode = 'goals';
	let layout = 'geo';

	let canvas, ctx;

	let nodes;
	let frame = 0;

	let w, h;

	let xScale = scaleLinear().domain([0, 29]);
	let yScale = scaleLinear().domain([0, 22]);

	let isSetup = false;

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
		if (layout === 'geo') {
			let nodesPerLine = Math.ceil(Math.sqrt(INDICATORS));
			RADIUS = BOXDIMS.w / nodesPerLine;
			grid.forEach((country) => {
				const countryOffset = new PIXI.Point(
					Math.floor(xScale(country.x)) + 0.5,
					Math.floor(yScale(country.y)) + 0.5
				);

				const cnodes = nodes
					.filter((d) => d.country === country.iso3c)
					.sort(sortmode === 'goals' ? sortByNone : sortByLevel);
				cnodes.forEach((d, i) => {
					d.target.x = (i % nodesPerLine) * RADIUS + countryOffset.x;
					d.target.y = Math.floor(i / nodesPerLine) * RADIUS + countryOffset.y;
				});
			});
		} else if (layout === 'goals') {
			const iw = w - 100;
			const ih = h - 100;

			grid.forEach((country, i) => {
				const countryOffset = new PIXI.Point(0, 50 + (i * ih) / grid.length);

				const cnodes = nodes.filter((d) => d.country === country.iso3c).sort(sortByNone);

				cnodes.forEach((d, i) => {
					d.target.x = d.sdgGoal * (iw / 17) + d.sdgTargetCount * RADIUS + countryOffset.x;
					d.target.y = countryOffset.y + d.sdgIndicator * RADIUS;
				});
			});
		}
		console.log(nodes);
	}

	async function setup() {
		w = window.innerWidth;
		h = window.innerHeight;

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
			height: h - 30,
			backgroundColor: '#f6f5f3',
			antialias: false,
			clearBeforeRender: true
		});

		const stats = new Stats(renderer);

		const container = new PIXI.ParticleContainer({
			// this is the default, but we show it here for clarity
			dynamicProperties: {
				position: true, // Allow dynamic position changes (default)
				scale: false, // Static scale for extra performance
				rotation: false, // Static rotation
				color: false
			},
			roundPixels: true
		});

		const con2 = new PIXI.Container();
		/*const test = new Sprite({
			texture: createColoredTexture(0xff0000, 100, 100),
			position: new Point(300, 300)
		});
		con2.addChild(test);*/

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

		grid.forEach((d) => {
			let indicount = 0;

			const countryLevel = Math.floor(Math.random() * 5);
			for (let goal = 1; goal <= 17; goal++) {
				if (indicount < INDICATORS) {
					const targets = goalTargets.filter((d) => +d.goal === goal);

					targets.forEach((target, targetCount) => {
						for (let i = 0; i < target.indicators; i++) {
							let p = createParticle(w / 2, h / 2, w / 2, h / 2, false, 'indicator');

							p.sdgGoal = goal;
							p.sdgTarget = target.target;
							p.sdgTargetCount = targetCount;
							p.sdgIndicator = i;

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
							container.addParticle(p.view);

							/*
				const g = new Graphics();
				g.rect(0, 0, RADIUS, RADIUS);
				g.fill(colorFromLevel(p.level));
*/

							/*const g = new PIXI.Sprite({ texture: createColoredTexture(colorFromLevel(p.level)) });
						g.width = RADIUS * 1.3 - 1;
						g.height = RADIUS * 1.3 - 1;
						//g.tint = colorFromLevel(p.level);

						con2.addChild(g);

						p.view = g;
*/
							nodes.push(p);
						}
					});
					indicount++;
				}
			}
		});

		grid.forEach((d) => {
			let labelparticle = createParticle(
				w / 2,
				h / 2,
				Math.floor(xScale(d.x)) + 0.5,
				Math.floor(yScale(d.y)) + 0.5,
				false,
				'label'
			);
			labelparticle.id = d.iso3c;
			labelparticle.count = 0; // Math.random() * 100;
			nodes.push(labelparticle);
		});

		const countryNodes = {};
		grid.forEach((d) => {
			countryNodes[d.iso3c] = nodes.filter((dd) => dd.country === d.iso3c);
		});

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
			grid.forEach((country) => {
				countryNodes[country.iso3c].forEach((node) => {
					if (node.type === 'indicator') {
						seek(node, node.target);

						update(node);
						//node.position.v.x += Math.random() * 5 - 2.5;
						//node.position.v.y += Math.random() * 5 - 2.5;

						// transfer position to pixi.js:

						// particle mode:
						node.view.x = node.position.x;
						node.view.y = node.position.y;

						// sprite mode:
						/*node.view.position.x = node.position.x;
						node.view.position.y = node.position.y;*/
					}
				});
			});

			renderer.render(container);

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

<button on:click={sort}>toggle sort mode</button>
<button on:click={changeLayout}>toggle {layout}</button>

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
</style>
