<script>
	import { inview } from 'svelte-inview';

	export let scene;

	export let standalone = false;
	export let colWidth = 12;

	export let standaloneHeight = 800;

	export let cW = 0;
	export let cH = 0;

	let inviewOptions = {
		rootMargin: '-50px',
		unobserveOnEnter: true
	};

	let isInView = false;
	const handleChange = ({ detail }) => {
		isInView = detail.inView;
	};
</script>

<div
	class="inner-container"
	class:standalone
	style="--height:{standaloneHeight}px; --cols: var(--col-{colWidth})"
	use:inview={inviewOptions}
	on:inview_change={handleChange}
>
	<slot name="title" />
	<slot name="legend-top" />
	{#if isInView}
		<div class="vis" bind:clientHeight={cH} bind:clientWidth={cW}>
			<slot name="vis" {cW} {cH} {scene} />
			<slot name="tooltip" />
		</div>

		<slot name="legend-bottom" />
	{/if}
	<slot name="source" />
</div>

<style>
	.inner-container {
		width: 100%;
		max-width: var(--cols);
		height: 100%;
		max-height: var(--col-10);
		display: flex;
		align-items: center;
		flex-direction: column;
		row-gap: var(--space-s);
		background-color: var(--background-light);
	}

	.inner-container.standalone {
		height: var(--height);
		max-height: var(--height);
		width: var(--col-12);
		margin: var(--space-2xl) auto;
		padding: var(--space-s) var(--space-s) var(--space-xs) var(--space-s);
	}

	.vis {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		overflow: hidden;

		flex: 1;
		width: 100%;
	}

	@media screen and (max-width: 872px) {
		.inner-container {
			max-height: 100%;
		}

		.inner-container.standalone {
			width: 100%;
			max-width: 100%;
			margin: var(--space-2xl) 0;
		}
	}
</style>
