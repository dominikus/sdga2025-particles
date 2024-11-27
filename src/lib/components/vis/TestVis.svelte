<script>
	import ChartGrid from '$lib/components/general/ChartGrid.svelte';
	import { _ } from 'svelte-i18n';
	import { dsv, scaleLinear } from 'd3';
	import Vis from '../general/Vis.svelte';
	import Legend from '../general/Legend.svelte';

	import CategoricalLegend from '$lib/components/general/CategoricalLegend.svelte';
	import Colors from '$lib/variables.js';
	import Source from '../general/Source.svelte';
	import VisTitle from '../general/VisTitle.svelte';
	import Tooltip from '../general/Tooltip.svelte';
	import Number from '$lib/components/general/Number.svelte';
	import { onMount } from 'svelte';

	export let scene;
	export let standalone, standaloneHeight, colWidth;
	let cW, cH;

	const margins = {
		top: 20,
		right: 20,
		bottom: 20,
		left: 30
	};

	let data;
	onMount(async () => {
		data = await dsv('\t', '/data/test_data.tsv', (d) => {
			return { ...d, boys: +d.boys, girls: +d.girls };
		});
	});

	$: w = cW - margins.left - margins.right;

	$: h = cH - margins.top - margins.bottom;

	$: xScale = scaleLinear().domain([0, 100]).range([0, w]);
	$: xTicks = [0, 20, 40, 60, 80, { value: 100, label: '100 kg' }];

	$: yScale = scaleLinear().domain([0, 100]).range([h, 0]);
	$: yTicks = [0, 20, 40, 60, 80, 100];

	let colorScale = scaleLinear([Colors.boys, Colors.girls]).domain([0, 100]);

	let hoveredData = 0;
</script>

{#if data}
	<Vis bind:cW bind:cH {standalone} {standaloneHeight} {colWidth}>
		<VisTitle slot="title">{$_('vis1_title')}</VisTitle>
		<svg slot="vis" width={cW} height={cH}>
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
					hideLines={true}
					axisUnits="unit"
					axisTitle="Title"
				/>
				{#each data as d}
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<circle
						cx={xScale(d.boys)}
						cy={yScale(d.boys)}
						r={(d.boys / 2) * (scene + 1)}
						on:mouseover={() => (hoveredData = d.boys)}
						on:mouseout={() => (hoveredData = 0)}
						on:focus={() => (hoveredData = d.boys)}
						on:blur={() => (hoveredData = 0)}
					></circle>
					<text x={xScale(d.boys)} y={yScale(d.boys)}>{$_('vis1_label_' + d.category)}</text>
				{/each}
			</g>
		</svg>

		<Tooltip slot="tooltip" display={hoveredData != 0}>hovering over {hoveredData}</Tooltip>

		<Legend
			slot="legend-bottom"
			title="Dataset"
			color={colorScale}
			unitLabel="USD"
			digits="0"
			units="$"
		/>

		<Source slot="source">{$_('vis1_source')}</Source>

		<CategoricalLegend
			slot="legend-top"
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
	</Vis>
{/if}

<style>
	circle {
		transition: 0.5s r;
		fill: var(--boys);
		stroke-width: 2px;
		stroke: var(--white);
	}
</style>
