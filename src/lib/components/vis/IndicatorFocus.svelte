<script>
	// import { particles } from 'engine.js';
	import { grid as countries } from '$lib/data/worldtilegrid.js';
	import { scaleLinear, extent, scaleDiverging, interpolateRdBu, piecewise, max } from 'd3';
	import * as PIXI from 'pixi.js';
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';
	import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';
	import Legend from '../general/Legend.svelte';
	import VisContainer from '../VisContainer.svelte';

	let particles = nodeState.nodes;

	let { inView = false, activeScene = 0, w, h } = $props();

	let FOCUS_GOAL = $state(3);

	const margins = {
		top: 140,
		right: 20,
		bottom: 120,
		left: 20
	};

	const RADIUS = 10;

	const BOXDIMS = { w: 28, h: 28 };

	let fullH = 2500;

	const countryNodes = {};
	countries.forEach((d) => {
		countryNodes[d.iso3c] = nodeState.nodes.filter((dd) => dd.country === d.iso3c);
	});

	let countryLevels = [];
	countries.forEach((country) => {
		countryLevels.push({
			country: country.iso3c,
			value: countryNodes[country.iso3c].reduce((acc, val) => (val.level ?? 0) + acc, 0)
		});
	});

	const sceneConfig = {
		0: { sortmode: 'focus' },
		1: { sortmode: 'absoluteprogress' },
		2: { sortmode: 'scatterplot' },
		3: { sortmode: 'barchart' }
	};

	let sortmode = $derived(sceneConfig[activeScene].sortmode);

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

	let focusAbsDomain = $derived(
		extent(particles.filter((d) => d.sdgGoal === FOCUS_GOAL).map((d) => d.valueAbs))
	);
	let focusPPDomain = $derived(
		extent(particles.filter((d) => d.sdgGoal === FOCUS_GOAL).map((d) => d.valuePP))
	);

	let scatterXScale = $derived(
		scaleLinear()
			.domain(focusAbsDomain)
			.range([margins.left, w - margins.left - margins.right])
	);
	let scatterYScale = $derived(
		scaleLinear()
			.domain(focusPPDomain)
			.range([margins.top, h - margins.top - margins.bottom])
	);

	let valuePPScale = $derived(
		scaleLinear()
			.domain([0, max(focusPPDomain, (d) => Math.abs(d))])
			.range([0, 1])
	);

	let barXScale = $derived(
		scaleLinear()
			.domain(focusAbsDomain)
			.range([margins.left, w * 0.6 - margins.left - margins.right])
	);

	let colorScale = $derived(
		scaleDiverging(
			[focusPPDomain[0], 0, focusPPDomain[1]],
			piecewise(
				['#6cdcf6', '#7abdd2', '#809eaf', '#80808e', '#cf7a59', '#e98747', '#ff9534'].reverse()
			)
		)
	);

	let focusParticles = $derived(particles.filter((d) => d.sdgGoal === FOCUS_GOAL));

	$inspect(focusParticles);

	function layout() {
		let indicatorCount = particles.filter((d) => d.country === countries[0].iso3c).length;
		let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
		let RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);

		countryLevels.sort((a, b) => b.value - a.value);

		countries
			.sort(
				(a, b) =>
					(nodeState.nodes.find(
						(d) => d.country === b.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
					)?.valueAbsIndex ?? -1) -
					(nodeState.nodes.find(
						(d) => d.country === a.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
					)?.valueAbsIndex ?? -1)
			)
			.forEach((country, i) => {
				const countryOffset = new PIXI.Point(xScale(country.x), yScale(country.y));

				if (sortmode !== 'barchart') {
					if (sortmode === 'focus') {
						// focus mode
						const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

						cnodes.forEach((node) => {
							goHome(node);
							resetColor(node);
						});

						// keep the focus nodes:
						const fNodes = cnodes.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL);

						fNodes.forEach((d, i) => {
							d.x = countryOffset.x;
							d.y = countryOffset.y;

							d.scaleX = d.scaleY = BOXDIMS.w;
						});

						// place label:
						const countryLabel = labelState.labels[country.iso3c];

						countryLabel.y = countryOffset.y;

						countryLabel.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
					} else if (sortmode === 'absoluteprogress') {
						// focus mode
						const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

						cnodes.forEach((node) => {
							goHome(node);
							resetColor(node);
						});

						// keep the focus nodes:
						cnodes
							.filter((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL)
							.forEach((d, i) => {
								const val = valuePPScale(Math.abs(d.valuePP));
								d.x = countryOffset.x + BOXDIMS.w / 2 - (BOXDIMS.w * val) / 2;
								d.y = countryOffset.y + BOXDIMS.h / 2 - (BOXDIMS.w * val) / 2;

								d.scaleX = d.scaleY = BOXDIMS.w * (val * 0.8 + 0.2);

								d.color = colorScale(d.valuePP);
							});

						// place label:
						const countryLabel = labelState.labels[country.iso3c];
						countryLabel.x = countryOffset.x + nodesPerLine * RADIUS * 0.5;
						countryLabel.y = countryOffset.y;
					} else if (sortmode === 'scatterplot') {
						const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

						if (cnodes.length > 0) {
							cnodes.forEach((node) => {
								goHome(node);
								resetColor(node);
							});

							RADIUS = BOXDIMS.w / 3;

							// keep the focus nodes:
							let cnode = cnodes.find((d) => d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL);

							const countryLabel = labelState.labels[country.iso3c];

							if (cnode) {
								cnode.x = scatterXScale(cnode.valueAbs);
								cnode.y = scatterYScale(cnode.valuePP);

								cnode.scaleX = cnode.scaleY = RADIUS;

								// labels
								countryLabel.x = cnode.x + 5;
								countryLabel.y = cnode.y;
							} else {
								// labels
								countryLabel.x = countryLabel.homepoint.x;
								countryLabel.y = countryLabel.homepoint.y;
							}
						}
					}
				} else {
					RADIUS = 10;

					const countryOffset = new PIXI.Point(50, margins.top + i * 12);

					for (let goal = 1; goal <= 17; goal++) {
						const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c);

						cnodes.forEach((node) => {
							goHome(node);
							resetColor(node);
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

					const countryLabel = labelState.labels[country.iso3c];
					countryLabel.x = countryOffset.x;
					countryLabel.y = countryOffset.y + RADIUS;
				}
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
	<ISOCodeLabels {w} h={2500} slot="iso-code-labels"></ISOCodeLabels>
	<Legend
		title={focusParticles[0].indicatorName}
		color={colorScale}
		slot="top"
		hidden={activeScene !== 1}
	></Legend>
</VisContainer>

<select bind:value={FOCUS_GOAL}>
	<option value={1}> GOAL 1 </option> <option value={3}> GOAL 3 </option><option value={4}>
		GOAL 4
	</option><option value={5}> 5 </option><option value={7}> GOAL 7 </option><option value={9}>
		GOAL 9
	</option></select
>

<style>
	select {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
