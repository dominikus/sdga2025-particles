<script>
	import { grid } from '$lib/data/worldtilegrid.js';
	import * as PIXI from 'pixi.js';
	import { labelState } from '$lib/state/nodeState.svelte.js';
	import { fade } from 'svelte/transition';

	import { onMount } from 'svelte';

	let particles = $derived(labelState.labels);

	let { w, h } = $props();

	onMount(() => {
		grid.forEach((country, i) => {
			// create a country label:
			let label = {
				x: w * 0.4 - 35,
				y: h * 0.4 - 25,
				country: country.iso3c,
				homepoint: new PIXI.Point(i / grid.length, -50)
			};
			particles[country.iso3c] = label;
		});
	});
</script>

<g>
	{#each Object.keys(particles) as labelId}
		{@const label = particles[labelId]}
		<text transform="translate({label.x}, {label.y})" transition:fade>{label.country}</text>
	{/each}
</g>

<style>
	text {
		transition: all 1s;

		text-anchor: middle;
	}
</style>
