<script>
	import ChartGrid from '$lib/components/general/ChartGrid.svelte';
	import { scaleLinear } from 'd3';
	import Legend from './general/Legend.svelte';
	import CategoricalLegend from './general/CategoricalLegend.svelte';
	import Colors from '$lib/variables.js';
	import Source from './general/Source.svelte';
	import Tooltip from './general/Tooltip.svelte';

	export let scene;

	const margins = {
		top: 20,
		right: 30,
		bottom: 20,
		left: 30
	};

	$: cW = 500;
	$: w = cW - margins.left - margins.right;
	$: cH = 400;
	$: h = cH - margins.top - margins.bottom;

	$: xScale = scaleLinear().domain([0, 100]).range([0, w]);
	$: xTicks = [0, 20, 40, 60, 80, { value: 100, label: '100 kg' }];

	$: yScale = scaleLinear().domain([0, 100]).range([h, 0]);
	$: yTicks = [0, 20, 40, 60, 80, 100];

	let colorScale = scaleLinear([Colors.boys, Colors.girls]).domain([0, 100]);

	let hoveredData = 0;

	let data = [10, 20, 30, 40];
</script>

<div class="inner-container">
	<h2>A beautiful title for a visualization</h2>
	<h3>and a very nice subtitle as well</h3>
	<div class="vis-container" bind:clientHeight={cH} bind:clientWidth={cW}>
		<svg width={cW} height={cH}>
			<g transform={`translate(${margins.left}, ${margins.top})`}>
				<ChartGrid
					gridType="yGrid"
					innerHeight={h}
					innerWidth={w}
					scale={yScale}
					ticks={yTicks}
					axisUnits="unit"
					axisTitle="Title"
				/>
				<ChartGrid
					gridType="xGrid"
					innerHeight={h}
					innerWidth={w}
					scale={xScale}
					ticks={xTicks}
					axisUnits="unit"
					axisTitle="Title"
				/>
				{#each data as d}
					<circle
						cx={xScale(d)}
						cy={yScale(d)}
						r={25 * (scene + 1)}
						on:mouseover={() => (hoveredData = d)}
						on:mouseout={() => (hoveredData = 0)}
					></circle>
				{/each}
			</g>
		</svg>
		{#if hoveredData}
			<Tooltip tx={xScale(hoveredData) + margins.left} ty={yScale(hoveredData) + margins.top}
				>hovering over {hoveredData}</Tooltip
			>
		{/if}
	</div>

	<Legend title="Legend title" color={colorScale} unitLabel="units" digits="0" units="$" />
	<CategoricalLegend
		items={[
			{ label: 'Boys', color: Colors.boys },
			{ label: 'Girls', color: Colors.girls },
			{ label: 'red', color: Colors.red },
			{ label: 'green', color: Colors.green },
			{ label: 'yellow', color: Colors.yellow },
			{ label: 'blue', color: Colors.blue },
			{ label: 'orange', color: Colors.orange }
		]}
	/>
	<Source>This is the source of the data.</Source>
</div>

<style>
	circle {
		transition: 0.5s r;
		fill: var(--boys);
	}
	h2,
	h3 {
		margin: 0 0 var(--space-xs) 0;
	}

	.inner-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.vis-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		overflow: hidden;

		flex: 1;
		width: 100%;
	}
</style>
