<script>
	import { fade } from 'svelte/transition';
	export let gridType;
	export let scale;
	export let innerHeight;
	export let innerWidth;
	export let ticks = [];

	export let axisUnits;
	export let axisTitle;
	export let divisor;

	export let hideLines = false;
	export let hideTickLabels = false;

	const divideTick = function (tick, divisor) {
		return tick / divisor;
	};

	$: formattedTicks = ticks.map((d, i) => {
		let formattedTick = { value: d, label: d };
		if (isNaN(d)) {
			formattedTick = d;
		}

		if (divisor) {
			formattedTick.label = divideTick(formattedTick.label, divisor);
		}

		return formattedTick;
	});
</script>

{#if gridType == 'xGrid'}
	{#each formattedTicks as tick}
		<line
			x1={scale(tick.value)}
			x2={isNaN(scale(tick.value)) ? 0 : scale(tick.value)}
			y1={hideLines ? innerHeight + 5 : 0}
			y2={innerHeight}
			class="gridline"
			transition:fade|local
		/>
		{#if !hideTickLabels}
			<text x={scale(tick.value)} y={innerHeight + 16} class="ticklabel x" transition:fade|local
				>{tick.label}</text
			>
		{/if}
	{/each}
	{#if axisTitle}
		<text x={innerWidth - 3} y={innerHeight - 6} class="x-title" transition:fade|local
			>{axisTitle} {axisUnits ? ' (' + axisUnits + ')' : ''}</text
		>
	{/if}
{/if}

{#if gridType == 'yGrid'}
	{#each formattedTicks as tick, i}
		<line
			x1={hideLines ? -5 : 0}
			x2={hideLines ? 0 : innerWidth}
			y1={scale(tick.value)}
			y2={scale(tick.value)}
			class="gridline"
			transition:fade|local
		/>
		{#if !hideTickLabels}
			<text x={-8} y={scale(tick.value) + 4} class="ticklabel y" transition:fade|local
				>{tick.label}</text
			>
		{/if}
		{#if i === ticks.length - 1 && axisTitle}
			<text x={5} y={-8} class="y-title" transition:fade|local
				>{axisTitle} {axisUnits ? ' (' + axisUnits + ')' : ''}</text
			>
		{/if}
	{/each}
{/if}

<style>
	text.ticklabel {
		fill: var(--text-lighter);
		font-size: 12px;
		stroke: none;
	}

	text {
		stroke: none;
		stroke-width: 0px;
	}

	text.x-title,
	text.y-title {
		font-weight: 400;
		stroke: none;
		font-size: var(--font-size-s);
	}
	text.x-title {
		text-anchor: end;
	}
	line.gridline {
		stroke-width: 1px;
		stroke: var(--grey-lighter);
		opacity: 0.3;
		stroke-dasharray: 4 4;
	}

	text.ticklabel.x {
		text-anchor: middle;
	}

	text.ticklabel.y {
		text-anchor: end;
		font-weight: 300;
	}
</style>
