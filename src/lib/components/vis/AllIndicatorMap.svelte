<script>
	// import { particles } from 'engine.js';
	import { grid as countries } from '$lib/data/worldtilegrid.js';
	import { scaleLinear, max } from 'd3';
	import * as PIXI from 'pixi.js';
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';
	import VisContainer from '../VisContainer.svelte';
	import LevelLegend from '../general/LevelLegend.svelte';

	let particles = nodeState.nodes;

	let { inView = false, activeScene = 0, w, h } = $props();

	const margins = {
		top: 120,
		right: 20,
		bottom: 120,
		left: 120
	};

	let xScale = $derived(
		scaleLinear()
			.domain([0, 29])
			.range([margins.left, w - margins.left - margins.right])
	);
	let yScale = $derived(
		scaleLinear()
			.domain([0, 22])
			.range([margins.top, h - margins.top - margins.bottom])
	);

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
		let indicatorCount = max(
			countries,
			(country) => particles.filter((d) => d.country === country.iso3c).length
		);
		let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
		let RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);

		console.log(indicatorCount, BOXDIMS.w, nodesPerLine, RADIUS);

		countries.forEach((country) => {
			const countryOffset = new PIXI.Point(xScale(country.x), yScale(country.y));

			const cnodes = particles
				.filter((d) => d.country === country.iso3c)
				.sort(sceneConfig[activeScene].sortmode === 'goals' ? sortByNone : sortByLevel);
			cnodes.forEach((d, i) => {
				d.x = Math.floor(i % nodesPerLine) * RADIUS + countryOffset.x;
				d.y = Math.floor(i / nodesPerLine) * RADIUS + countryOffset.y;

				d.scaleX = d.scaleY = RADIUS;
			});

			// place label:
			const countryLabel = labelState.labels[country.iso3c];
			countryLabel.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
			countryLabel.y = countryOffset.y;
		});
	}

	$effect(() => {
		if (inView === true && particles?.length > 0) {
			activeScene;
			layout();
		}
	});
</script>

<VisContainer {w} h={2500}>
	<div slot="top">
		<LevelLegend></LevelLegend>
	</div>
	<ISOCodeLabels {w} h={2500} slot="iso-code-labels"></ISOCodeLabels>
</VisContainer>
