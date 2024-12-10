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
	import LevelLegend from '../general/LevelLegend.svelte';
	import ChartGrid from '../general/ChartGrid.svelte';

	let particles = nodeState.nodes;

	let { inView = false, activeScene = 0, w, h } = $props();

	let FOCUS_GOAL = $state(3);

	const margins = {
		top: 140,
		right: 20,
		bottom: 120,
		left: 120
	};

	const BOXDIMS = { w: 28, h: 28 };

	const countryNodes = {};
	countries.forEach((d) => {
		countryNodes[d.iso3c] = nodeState.nodes.filter((dd) => dd.country === d.iso3c);
	});

	const sceneConfig = {
		0: { sortmode: 'focus' },
		1: { sortmode: 'absoluteprogress' },
		2: { sortmode: 'scatterplot' },
		3: { sortmode: 'barchart' }
	};

	let sortmode = $derived(sceneConfig[activeScene].sortmode);

	let focusParticles = $derived(particles.filter((d) => d.sdgGoal === FOCUS_GOAL));

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

	let focusAbsDomain = $derived([
		0,
		Math.max(extent(focusParticles.map((d) => d.valueAbs))[1], focusParticles[0].targetValue)
	]);
	let focusPPDomain = $derived(extent(focusParticles.map((d) => d.valuePP)));

	$inspect(focusAbsDomain);

	$inspect(focusPPDomain);

	let scatterXScale = $derived(
		scaleLinear()
			.domain(focusAbsDomain)
			.range([margins.left, w - margins.left - margins.right])
	);
	let scatterYScale = $derived(
		scaleLinear()
			.domain(focusPPDomain)
			.range([h - margins.top - margins.bottom, margins.top])
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
				moreIsBetter
					? ['#6cdcf6', '#7abdd2', '#809eaf', '#80808e', '#cf7a59', '#e98747', '#ff9534'].reverse()
					: ['#6cdcf6', '#7abdd2', '#809eaf', '#80808e', '#cf7a59', '#e98747', '#ff9534']
			)
		)
	);

	let moreIsBetter = $derived(focusParticles[0].moreIsBetter);

	$inspect(focusParticles);

	function layout() {
		let indicatorCount = particles.filter((d) => d.country === countries[0].iso3c).length;
		let nodesPerLine = Math.ceil(Math.sqrt(indicatorCount));
		let RADIUS = Math.ceil(BOXDIMS.w / nodesPerLine);

		countries
			.sort(
				(a, b) =>
					((nodeState.nodes.find(
						(d) => d.country === b.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
					)?.valueAbs ?? -1) -
						(nodeState.nodes.find(
							(d) => d.country === a.iso3c && d.sdgTargetCount === 0 && d.sdgGoal === FOCUS_GOAL
						)?.valueAbs ?? -1)) *
					(moreIsBetter ? 1 : -1)
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
							node.scaleX = RADIUS;
							node.scaleY = RADIUS;
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

	<g slot="svg">
		{#if activeScene == 2}
			<g transform="translate(0,{margins.top})">
				<ChartGrid
					gridType="xGrid"
					innerHeight={h + 20 - margins.top * 2 - margins.bottom}
					innerWidth={w - margins.left - margins.right}
					scale={scatterXScale}
					ticks={[
						Math.floor(focusAbsDomain[0]),
						Math.floor(focusAbsDomain[1]),
						Math.floor(focusAbsDomain[1]) / 2
					]}
					axisTitle={focusParticles[0].indicatorName}
				></ChartGrid>
			</g>
			<g transform="translate({margins.left - 20}, 0)">
				<ChartGrid
					gridType="yGrid"
					innerHeight={h - margins.top - margins.bottom}
					innerWidth={w + 20 - margins.left * 2 - margins.right}
					scale={scatterYScale}
					ticks={[Math.floor(focusPPDomain[0]), 0, Math.floor(focusPPDomain[1])]}
					axisTitle={'Absolute change (pp)'}
				></ChartGrid>
			</g>
		{/if}
	</g>

	<div slot="top">
		{#if activeScene == 1}
			<Legend
				title={'How much did ' + focusParticles[0].indicatorName + ' change since 2015?'}
				color={colorScale}
			></Legend>
		{:else}
			<LevelLegend indicator=" in {focusParticles[0].indicatorName}"></LevelLegend>
		{/if}
		<select bind:value={FOCUS_GOAL}>
			<option value={1}> GOAL 1 </option> <option value={3}> GOAL 3 </option><option value={4}>
				GOAL 4
			</option><option value={5}>GOAL 5 </option><option value={7}> GOAL 7 </option><option
				value={9}
			>
				GOAL 9
			</option></select
		>
	</div>
</VisContainer>

<style>
	div {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	select {
		width: 100px;
		margin-left: var(--space-s);
	}
</style>
