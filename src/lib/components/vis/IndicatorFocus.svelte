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
		top: 160,
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

	const ticks = {
		1: {
			change: [-15000, 0, 15000, 30000, 45000],
			val: [0, 20000, 40000, 60000, 80000, 100000]
		},
		3: { change: [-40, -30, -20, -10, 0, 10], val: [0, 25, 50, 75, 100, 125] },
		4: { change: [-20, 0, 20, 40], val: [0, 25, 50, 75, 100] },
		5: { change: [-30, -15, 0, 15, 30], val: [0, 10, 20, 30, 40, 50] },
		7: { change: [-10, 0, 10, 20, 30, 40], val: [0, 25, 50, 75, 100] },
		9: { change: [-20, 0, 20, 40, 60, 80], val: [0, 25, 50, 75, 100] }
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
			.domain([ticks[FOCUS_GOAL].val[0], ticks[FOCUS_GOAL].val[ticks[FOCUS_GOAL].val.length - 1]])
			.range([margins.left, w - margins.left - margins.right])
	);
	let scatterYScale = $derived(
		scaleLinear()
			.domain([
				ticks[FOCUS_GOAL].change[0],
				ticks[FOCUS_GOAL].change[ticks[FOCUS_GOAL].change.length - 1]
			])
			.range([h - margins.top - margins.bottom, margins.top])
	);

	let valuePPScale = $derived(
		scaleLinear()
			.domain([0, max(focusPPDomain, (d) => Math.abs(d))])
			.range([0, 1])
	);

	let barXScale = $derived(
		scaleLinear()
			.domain([ticks[FOCUS_GOAL].val[0], ticks[FOCUS_GOAL].val[ticks[FOCUS_GOAL].val.length - 1]])
			.range([margins.left, w * 0.6 - margins.left - margins.right])
	);

	let colorScale = $derived(
		scaleDiverging(
			[focusPPDomain[0], 0, focusPPDomain[1]],
			piecewise(
				moreIsBetter
					? ['#8efcff', '#8ed2d8', '#89a8b2', '#80808e', '#c9997a', '#e7c17f', '#ffec88'].reverse()
					: ['#8efcff', '#8ed2d8', '#89a8b2', '#80808e', '#c9997a', '#e7c17f', '#ffec88']
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

							d.scaleX = d.scaleY = BOXDIMS.w * (val * 0.85 + 0.15);

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
				} else if (sortmode === 'barchart') {
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
					innerHeight={h - margins.top * 2 - margins.bottom}
					innerWidth={w - margins.left - margins.right}
					scale={scatterXScale}
					ticks={ticks[FOCUS_GOAL].val}
					axisTitle={focusParticles[0].indicatorName}
				></ChartGrid>
			</g>
			<g transform="translate({margins.left}, 0)">
				<ChartGrid
					gridType="yGrid"
					innerHeight={h - margins.top - margins.bottom}
					innerWidth={w - margins.left * 2 - margins.right}
					scale={scatterYScale}
					ticks={ticks[FOCUS_GOAL].change}
					axisTitle={'Absolute change (pp)'}
				></ChartGrid>
			</g>
			<line
				class="target move"
				transform="translate({scatterXScale(focusParticles[0].targetValue)},{margins.top})"
				x0="0"
				y0={margins.top}
				x1="0"
				y1={h - margins.top * 2 - margins.bottom}
			></line>
			<text
				transform="translate({scatterXScale(focusParticles[0].targetValue)},{margins.top - 8})"
				class="middle move">Target</text
			>
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
			<option value={1}>{particles.filter((d) => d.sdgGoal === 1)[0].indicatorName}</option>
			<option value={3}>{particles.filter((d) => d.sdgGoal === 3)[0].indicatorName}</option><option
				value={4}
			>
				{particles.filter((d) => d.sdgGoal === 4)[0].indicatorName}
			</option><option value={5}>{particles.filter((d) => d.sdgGoal === 5)[0].indicatorName}</option
			><option value={7}>{particles.filter((d) => d.sdgGoal === 7)[0].indicatorName}</option><option
				value={9}
				>{particles.filter((d) => d.sdgGoal === 9)[0].indicatorName}
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
		width: 600px;
		margin-left: var(--space-s);
	}

	.target {
		stroke: white;
		stroke-width: 2px;
	}

	.move {
		transition: all 1s;
	}
</style>
