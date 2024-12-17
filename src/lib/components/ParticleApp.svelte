<script>
	import { grid } from '$lib/data/worldtilegrid.js';

	import { seek, update, createParticle } from '$lib/utils/pixiParticle.svelte.js';

	import * as PIXI from 'pixi.js';
	import { Stats } from 'pixi-stats';
	import Intro from './vis/Intro.svelte';
	import BarChart from './vis/BarChart.svelte';
	import TreeMap from './vis/TreeMap.svelte';
	import AllIndicatorMap from './vis/AllIndicatorMap.svelte';
	import AllIndicatorMatrix from './vis/AllIndicatorMatrix.svelte';
	import Colors from '$lib/variables.js';
	import SVGContainer from './VisContainer.svelte';

	import { nodeState } from '$lib/state/nodeState.svelte.js';
	import IndicatorFocus from './vis/IndicatorFocus.svelte';
	import VisContainer from './VisContainer.svelte';

	let { allIndicators = [] } = $props();

	// $inspect(grid);

	let RADIUS = 3;

	const BASE_SPEED = 25; //ms => 40fps

	let activeVis = $state(0);
	let activeScene = $state(0);

	let modes = [
		{ vis: Intro, sceneCount: 1 },
		{ vis: BarChart, sceneCount: 3 },
		{ vis: TreeMap, sceneCount: 1 },
		{ vis: AllIndicatorMap, sceneCount: 2 },
		{ vis: AllIndicatorMatrix, sceneCount: 2 },
		{ vis: AllIndicatorMap, sceneCount: 1 },
		{ vis: IndicatorFocus, sceneCount: 4 }
	];

	let Vis = $derived(modes[activeVis].vis);
	let currentSceneCount = $derived(modes[activeVis].sceneCount);

	let canvas;

	let frame = $state(0);

	let w = $state(),
		h = $state();
	let screenW = $state(),
		screenH = $state();

	let isSetup = $state(false);

	let particleContainer;

	let ticker;

	function colorFromLevel(level) {
		return [Colors.level0, Colors.level1, Colors.level2, Colors.level3, Colors.level4][level];
	}

	console.log(Colors);

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
				color: true
			}
		});

		const spriteContainer = new PIXI.Container();

		baseContainer.addChild(particleContainer);
		baseContainer.addChild(spriteContainer);

		const tex = PIXI.Texture.WHITE; //createColoredTexture(0xffffff, 1, 1);

		let totalIndicatorNum = allIndicators.length;

		let indicatorIndex = 0;

		grid.forEach((d, countryIndex) => {
			for (let goal = 1; goal <= 17; goal++) {
				let filteredGTs = allIndicators.filter((dd) => dd.iso3c === d.iso3c && dd.goal === goal);

				filteredGTs.forEach((indicator, ii) => {
					let particleColor = colorFromLevel(indicator.level);

					let p;

					if (indicatorIndex === 0) {
						p = createParticle(
							screenW * 0.4 - 35,
							screenH * 0.4 - 25,
							RADIUS,
							RADIUS,
							particleColor
						);
					} else {
						p = createParticle(
							(w * indicatorIndex) / totalIndicatorNum,
							-50,
							RADIUS,
							RADIUS,
							particleColor
						);
					}

					p.sdgGoal = goal;
					p.sdgTargetCount = ii; //targetCount;
					p.sdgIndicator = 1; //i;

					p.indicatorName = indicator.indicatorName;
					p.moreIsBetter = indicator.moreIsBetter;
					p.targetValue = indicator.targetValue;

					p.country = d.iso3c;

					p.level = indicator.level;
					p.valueAbs = indicator.value ?? 0;
					p.valuePP = indicator.diff ?? 0;

					p.homepoint = new PIXI.Point((w * indicatorIndex) / totalIndicatorNum, -50);
					p.levelColor = particleColor;

					p.view = new PIXI.Particle({
						texture: tex,
						scaleX: RADIUS,
						scaleY: RADIUS,
						tint: particleColor
					});
					p.scaleX = RADIUS;
					p.scaleY = RADIUS;

					particleContainer.addParticle(p.view);

					nodeState.nodes.push(p);
					indicatorIndex++;
				});
			}
		});

		function render() {
			frame++;

			let isDirty = false;
			let speed = ticker.deltaMS / BASE_SPEED;

			nodeState.nodes.forEach((node) => {
				seek(node, speed);

				isDirty = update(node, speed) || isDirty;

				// transfer position to pixi.js:
				node.view.x = node.position.x;
				node.view.y = node.position.y;

				node.view.scaleX = node.scale.x;
				node.view.scaleY = node.scale.y;

				node.view.tint = node.currentColor;
			});

			if (isDirty) {
				particleContainer.update();
			}

			renderer.render(baseContainer);
		}

		ticker.add(render);
		ticker.start();
		//render();
		//console.log(nodeState.nodes);
	}

	function back() {
		step(-1);
	}
	function forward() {
		step(1);
	}

	function step(dir) {
		if (dir === 1) {
			if (currentSceneCount > activeScene + 1) {
				activeScene++;
			} else {
				// switch over to next vis:
				activeScene = 0;
				activeVis++;
				if (activeVis >= modes.length) {
					activeVis = 0;
				}
			}
		} else if (dir === -1) {
			if (activeScene > 0) {
				activeScene--;
			} else {
				// switch over to previous vis:
				activeVis--;
				if (activeVis < 0) {
					activeVis = modes.length - 1;
				}
				activeScene = modes[activeVis].sceneCount - 1;
			}
		}
	}

	$effect(() => {
		if (canvas && allIndicators.length > 0 && !isSetup) {
			setup();
		}
	});
</script>

<canvas bind:this={canvas}></canvas>

<Vis {frame} inView={isSetup} {activeScene} {w} h={screenH} />

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
