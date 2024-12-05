<script>
	// import { particles } from 'engine.js';
	import { goHome } from '$lib/utils/particleUtils.js';
	import { grid as countries } from '$lib/data/worldtilegrid.js';
	import { scaleLinear } from 'd3';
	import * as PIXI from 'pixi.js';

	export let particles = [];
	export let inView = false;
	export let activeScene = 0;
	export let w, h;

	$: console.log(`activescene: ${activeScene}`);

	const margins = {
		top: 120,
		right: 30,
		bottom: 20,
		left: 20
	};

	$: xScale = scaleLinear()
		.domain([0, 29])
		.range([margins.left, w - margins.left - margins.right]);
	$: yScale = scaleLinear()
		.domain([0, 22])
		.range([margins.top, h - margins.top - margins.bottom]);

	const BOXDIMS = { w: 28, h: 28 };

	const sceneConfig = {
		0: { sortmode: 'goals' },
		1: { sortmode: 'levels' }
	};

	function sortByLevel(a, b) {
		return b.level - a.level;
	}

	function sortByNone(a, b) {
		return 0;
	}

	function layout() {
		let indicatorCount = particles.filter((d) => d.country === countries[0].iso3c).length;
		let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
		let RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);

		countries.forEach((country) => {
			const countryOffset = new PIXI.Point(xScale(country.x), yScale(country.y));

			const cnodes = particles
				.filter((d) => d.country === country.iso3c)
				.sort(sceneConfig[activeScene].sortmode === 'goals' ? sortByNone : sortByLevel);
			cnodes.forEach((d, i) => {
				if (d.type === 'indicator') {
					d.x = Math.floor(i % nodesPerLine) * RADIUS + countryOffset.x;
					d.y = Math.floor(i / nodesPerLine) * RADIUS + countryOffset.y;

					d.scaleX = d.scaleY = RADIUS;
				} else {
					d.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
					d.y = countryOffset.y;
				}
			});
		});
	}

	$: if (inView === true && particles?.length > 0) {
		activeScene;
		layout();
	}
</script>

<g>
	{#each particles.filter((d) => d.type === 'label') as label}
		<text transform="translate({label.x}, {label.y})" style="opacity: {inView ? 1 : 0}"
			>{label.country}</text
		>
	{/each}
</g>

<style>
	text {
		transition: all 1s;

		text-anchor: middle;
	}
</style>
