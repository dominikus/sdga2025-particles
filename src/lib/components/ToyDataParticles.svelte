<script>
	import { scaleLinear, extent } from 'd3';
	import { grid } from '$lib/data/worldtilegrid.js';

	import { seek, update, createParticle } from '$lib/utils/pixiParticle.svelte.js';
	import { goHome } from '$lib/utils/particleUtils.js';

	import * as PIXI from 'pixi.js';
	import { Stats } from 'pixi-stats';
	import Intro from './Layouts/Intro.svelte';
	import AllIndicatorMap from './Layouts/AllIndicatorMap.svelte';
	import AllIndicatorMatrix from './Layouts/AllIndicatorMatrix.svelte';
	import SVGContainer from './SVGContainer.svelte';
	import ISOCodeLabels from './Layouts/ISOCodeLabels.svelte';

	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';

	let { allIndicators = [] } = $props();

	const PARTICLE_TYPES = {
		INDICATOR: 'indicator',
		LABEL: 'label',
		GOALLABEL: 'goallabel'
	};

	const textStyle = new PIXI.TextStyle({
		fontFamily: 'Open Sans',
		fontSize: 12,
		fontWeight: 'bold',
		fill: 0xffffff,
		stroke: { color: 0x384075, width: 3 }
	});

	// $inspect(grid);

	let RADIUS = 3;

	const BASE_SPEED = 25; //ms => 40fps
	const FOCUS_GOAL = 9;

	const BOXDIMS = { w: 28, h: 28 };

	let sortmode = $state('goals');
	let showLabels = $state(false);

	let modeIndex = $state(0);
	let modes = [
		{ layout: 'intro', sortmode: 'goals', showLabels: false },
		{ layout: 'geo', sortmode: 'goals', showLabels: true },
		{ layout: 'geo', sortmode: 'levels', showLabels: true },
		{ layout: 'goals', sortmode: 'goals', showLabels: true },
		{ layout: 'goals', sortmode: 'levels', showLabels: true },
		{ layout: 'geo', sortmode: 'levels', showLabels: true },
		{ layout: 'geo', sortmode: 'focus', showLabels: true },
		{ layout: 'geo', sortmode: 'absoluteprogress', showLabels: true },
		{ layout: 'geo', sortmode: 'scatterplot', showLabels: true },
		{ layout: 'geo', sortmode: 'barchart', showLabels: true }
	];
	let layout = $derived(modes[modeIndex].layout);

	let canvas;

	let frame = $state(0);

	let w = $state(),
		h = $state();
	let screenW = $state(),
		screenH = $state();

	const MARGIN = { x: 20, y: 120 };
	let xScale = scaleLinear().domain([0, 29]);
	let yScale = scaleLinear().domain([0, 22]);

	let scatterXScale = scaleLinear().domain([0, 1]);
	let scatterYScale = scaleLinear().domain([1, 0]);

	let barXScale = scaleLinear().domain([0, 1]);
	let valuePPScale = scaleLinear().domain([0, 1]);

	let isSetup = $state(false);

	let particleContainer;
	let countryLevels;

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

	async function setup() {
		isSetup = true;

		console.log('setup', nodeState.nodes.length);
		w = 1280; //window.innerWidth;
		h = 2500; // window.innerHeight;

		screenW = 1280;
		screenH = 1200;

		const renderer = await PIXI.autoDetectRenderer({
			canvas,
			width: w,
			height: h,
			autoDensity: true,
			resolution: window.devicePixelRatio,
			backgroundAlpha: 0,
			//backgroundColor: '#384075',
			antialias: true,
			clearBeforeRender: true
		});

		new Stats(renderer);

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

		xScale.range([MARGIN.x, screenW - MARGIN.x * 2]);
		yScale.range([MARGIN.y, screenH - MARGIN.y * 2]);

		const tex = PIXI.Texture.WHITE; //createColoredTexture(0xffffff, 1, 1);

		let totalIndicatorNum = allIndicators.length;

		let overallCount = 0;

		grid.forEach((d, countryIndex) => {
			for (let goal = 1; goal <= 17; goal++) {
				/*const targets = allIndicators.filter((d) => +d.goal === goal);

				targets.forEach((target, targetCount) => {
					for (let i = 0; i < target.indicators; i++) {*/
				let filteredGTs = allIndicators.filter((dd) => dd.iso3c === d.iso3c && dd.goal === goal);

				// console.log(`${d.iso3c} x ${goal} => ${filteredGTs.length}`);
				filteredGTs.forEach((indicator, ii) => {
					let p = createParticle(
						screenW * 0.4 - 35,
						screenH * 0.4 - 25,
						RADIUS,
						RADIUS,
						PARTICLE_TYPES.INDICATOR
					);

					p.sdgGoal = goal;
					p.sdgTargetCount = ii; //targetCount;
					p.sdgIndicator = 1; //i;

					p.country = d.iso3c;

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
					p.scaleX = RADIUS;
					p.scaleY = RADIUS;
					particleContainer.addParticle(p.view);

					nodeState.nodes.push(p);
					overallCount++;
				});
			}

			// create a country label:
			let label = {
				x: screenW * 0.4 - 35,
				y: screenH * 0.4 - 25,
				country: d.iso3c,
				homepoint: new PIXI.Point((w * countryIndex) / grid.length, -50)
			};
			labelState.labels[d.iso3c] = label;

			/*
			let labelparticle = createParticle(
				Math.floor(xScale(d.x)),
				Math.floor(yScale(d.y)),
				1,
				1,
				PARTICLE_TYPES.LABEL
			);
			labelparticle.country = d.iso3c;
			labelparticle.homepoint = new PIXI.Point((w * countryIndex) / grid.length, -50);
*/
			/*labelparticle.view = new PIXI.Text({
				text: d.iso3c,
				style: textStyle
			});
			labelparticle.view.anchor = new PIXI.Point(0.5, 0.5);
			spriteContainer.addChild(labelparticle.view);*/
			//nodeState.nodes.push(labelparticle);
		});

		nodeState.nodes
			.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
			.sort((a, b) => a?.valueAbs - b?.valueAbs)
			.forEach((d, i) => {
				d.valueAbsIndex = i;
			});

		/*
		for (let goal = 1; goal <= 17; goal++) {
			let goalparticle = createParticle(-50, -50, 1, 1, PARTICLE_TYPES.GOALLABEL);
			goalparticle.homepoint = new PIXI.Point(-50, -50);
			goalparticle.sdgGoal = goal;

			goalparticle.view = new PIXI.Text({
				text: `${goal}`,
				style: textStyle
			});
			//goalparticle.view.anchor = new PIXI.Point(0.5, 0.5);
			spriteContainer.addChild(goalparticle.view);
			nodeState.nodes.push(goalparticle);
		}*/

		// layout nodes:
		// layoutNodes(nodeState.nodes);

		/** visualization specific setup stuff*/
		// extract FOCUS_GOAL data domain:
		const focusAbsDomain = extent(
			allIndicators.filter((d) => d.goal === FOCUS_GOAL).map((d) => d.value)
		);
		const focusPPDomain = extent(
			allIndicators.filter((d) => d.goal === FOCUS_GOAL).map((d) => d.diff)
		);

		scatterXScale.domain(focusAbsDomain).range([MARGIN.x, screenW - MARGIN.x * 2]);
		scatterYScale.domain(focusPPDomain).range([MARGIN.y, screenH - MARGIN.y * 2]);

		barXScale.domain(focusAbsDomain).range([MARGIN.x, w * 0.6 - MARGIN.x * 2]);
		valuePPScale.domain(focusPPDomain).range([0, 1]);

		function render() {
			frame++;

			let isDirty = false;
			let speed = ticker.deltaMS / BASE_SPEED;

			nodeState.nodes.forEach((node) => {
				//if (node.type === PARTICLE_TYPES.INDICATOR) {
				seek(node, speed);

				isDirty = update(node, speed) || isDirty;

				//node.position.v.x += Math.random() * 5 - 2.5;
				//node.position.v.y += Math.random() * 5 - 2.5;

				// transfer position to pixi.js:

				if (node.type === PARTICLE_TYPES.INDICATOR) {
					// particle mode:
					node.view.x = node.position.x;
					node.view.y = node.position.y;

					node.view.scaleX = node.scale.x;
					node.view.scaleY = node.scale.y;
				} else {
					// sprite mode:
					//node.view.position.x = node.position.x;
					//node.view.position.y = node.position.y;
				}
			});

			if (isDirty) {
				particleContainer.update();
			}

			renderer.render(baseContainer);
		}

		ticker.add(render);
		ticker.start();
	}

	function layoutNodes() {
		let indicatorCount = nodeState.nodes.filter((d) => d.country === grid[0].iso3c).length;
		console.log(indicatorCount);

		if (layout === 'geo' && sortmode !== 'barchart') {
			let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
			RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);
			console.log(RADIUS);

			grid.forEach((country) => {
				const countryOffset = new PIXI.Point(xScale(country.x), yScale(country.y));

				if (sortmode === 'focus') {
					// focus mode
					const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

					cnodes.forEach((node) => {
						if (node.type === PARTICLE_TYPES.INDICATOR) {
							goHome(node);
						}
					});

					// keep the focus nodes:
					cnodes
						.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
						.forEach((d, i) => {
							d.x = countryOffset.x;
							d.y = countryOffset.y;

							d.scaleX = d.scaleY = BOXDIMS.w;
						});

					// labels
					cnodes
						.filter((d) => d.type === PARTICLE_TYPES.LABEL)
						.forEach((d, i) => {
							d.target.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
							d.target.y = countryOffset.y;
						});
				} else if (sortmode === 'absoluteprogress') {
					// focus mode
					const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

					cnodes.forEach((node) => {
						if (node.type === PARTICLE_TYPES.INDICATOR) {
							goHome(node);
						}
					});

					// keep the focus nodes:
					cnodes
						.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
						.forEach((d, i) => {
							d.x = countryOffset.x + BOXDIMS.w / 2 - (BOXDIMS.w * valuePPScale(d.valuePP)) / 2;
							d.y = countryOffset.y + BOXDIMS.h / 2 - (BOXDIMS.w * valuePPScale(d.valuePP)) / 2;

							d.scaleX = d.scaleY = BOXDIMS.w * (valuePPScale(d.valuePP) * 0.8 + 0.2);
						});

					// labels
					cnodes
						.filter((d) => d.type === PARTICLE_TYPES.LABEL)
						.forEach((d, i) => {
							d.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
							d.y = countryOffset.y;
						});
				} else if (sortmode === 'scatterplot') {
					const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

					if (cnodes.length > 0) {
						cnodes.forEach((node) => {
							if (node.type === PARTICLE_TYPES.INDICATOR) {
								goHome(node);
							}
						});

						RADIUS = BOXDIMS.w / 3;

						// keep the focus nodes:
						let cnode = cnodes.find((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL);

						if (cnode) {
							cnode.x = scatterXScale(cnode.valueAbs);
							cnode.y = scatterYScale(cnode.valuePP);

							cnode.scaleX = cnode.scaleY = RADIUS;

							// labels
							cnodes
								.filter((d) => d.type === PARTICLE_TYPES.LABEL)
								.forEach((d, i) => {
									d.x = cnode.x + 5;
									d.y = cnode.y - 5;
								});
						}
					}
				}
			});

			nodeState.nodes.filter((d) => d.type === PARTICLE_TYPES.GOALLABEL).forEach(goHome);
		} else if (layout !== 'goals' && sortmode === 'barchart') {
			countryLevels.sort((a, b) => b.value - a.value);

			grid
				.sort((a, b) =>
					sortmode !== 'barchart'
						? a.iso3c.localeCompare(b.iso3c)
						: (nodeState.nodes.find(
								(d) => d.country === b.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
							)?.valueAbsIndex ?? -1) -
							(nodeState.nodes.find(
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

					const cnodes = nodeState.nodes
						.filter((d) => d.country === country.iso3c)
						.sort(sortByNone);

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
									if (d.type === PARTICLE_TYPES.INDICATOR) {
										d.x = d.sdgGoal * (4 * RADIUS) + i * RADIUS + countryOffset.x;
										d.y = countryOffset.y; // + d.sdgIndicator * RADIUS;

										d.scaleX = d.scaleY = RADIUS;
									}
								});
						} else {
							if (sortmode === 'barchart') {
								const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

								cnodes.forEach((node) => {
									if (node.type === PARTICLE_TYPES.INDICATOR) {
										goHome(node);
									}
								});

								RADIUS = BOXDIMS.w / 6;

								// keep the focus nodes:
								cnodes
									.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
									.forEach((d, i) => {
										d.x = countryOffset.x;
										d.y = countryOffset.y;

										d.scaleX = barXScale(d.valueAbs);
										d.scaleY = RADIUS;
									});
							}
						}
					}

					cnodes
						.filter((d) => d.type === PARTICLE_TYPES.LABEL)
						.forEach((d) => {
							d.x = countryOffset.x;
							d.y = countryOffset.y;
						});
				});

			nodeState.nodes
				.filter((d) => d.type === PARTICLE_TYPES.GOALLABEL)
				.forEach((d) => {
					d.homepoint.x = d.x = 4 * RADIUS * d.sdgGoal + 50;
					d.y = sortmode === 'barchart' ? -20 : MARGIN.y - 20;
				});
		}

		particleContainer.update();
	}

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

		sortmode = modes[modeIndex].sortmode;
		showLabels = modes[modeIndex].showLabels;
		//layoutNodes(nodeState.nodes);
	}

	$effect(() => {
		if (canvas && allIndicators.length > 0 && !isSetup) {
			setup();
		}
	});

	let LayoutComponent = $derived.by(() => {
		switch (layout) {
			case 'intro':
				return Intro;
			case 'geo':
				return AllIndicatorMap;
			case 'goals':
				return AllIndicatorMatrix;
		}
	});
</script>

<canvas bind:this={canvas}></canvas>

<SVGContainer {w} {h}>
	<LayoutComponent
		{frame}
		inView={isSetup}
		activeScene={sortmode === 'goals' ? 0 : 1}
		{w}
		h={screenH}
		slot="svg"
	/>

	<!--
	<AllIndicatorGoals
		particles={nodes}
		inView={layout === 'goals'}
		activeScene={sortmode === 'goals' ? 0 : 1}
		{w}
		{h}
	></AllIndicatorGoals>
	-->
	<ISOCodeLabels inView={showLabels} slot="iso-code-labels"></ISOCodeLabels>
</SVGContainer>

<div class="button-panel">
	<button onclick={back}>&lt;</button>
	<button onclick={forward}>&gt;</button>
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
