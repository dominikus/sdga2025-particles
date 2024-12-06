<script>
	// import { particles } from 'engine.js';
	import { labelState } from '$lib/state/nodeState.svelte.js';

	let particles = $derived(labelState.labels);
	let { inView = false } = $props();
</script>

<g>
	{#each Object.keys(particles) as labelId}
		{@const label = particles[labelId]}
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
