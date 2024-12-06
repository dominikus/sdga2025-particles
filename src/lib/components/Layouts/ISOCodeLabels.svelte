<script>
	// import { particles } from 'engine.js';
	import { grid as countries } from '$lib/data/worldtilegrid.js';
	import { scaleLinear } from 'd3';
	import * as PIXI from 'pixi.js';
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';

	let particles = $derived(labelState.labels);
	let { inView = false } = $props();
</script>

<g>
	{#each particles as label}
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
