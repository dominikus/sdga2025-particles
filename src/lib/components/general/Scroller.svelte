<script>
	import Scroller from '@sveltejs/svelte-scroller';
	import Source from './Source.svelte';

	let index;
</script>

<Scroller bind:index query=".scene" threshold="1">
	<slot name="background" slot="background" {index} />
	<slot name="foreground" slot="foreground" />
</Scroller>

<style>
	:global(svelte-scroller-outer) {
		margin: var(--space-2xl) 0;
	}
	:global(svelte-scroller-foreground) {
		pointer-events: none;
	}
	:global(svelte-scroller-foreground > div) {
		display: flex;
		flex-direction: column;
		gap: 100vh;
		padding: 100vh 0;
		align-items: center;
	}

	:global(svelte-scroller-background) {
		background-color: var(--background-light);
	}

	:global(svelte-scroller-background > div) {
		height: 100vh;
		padding: var(--space-m);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	:global(.background-container) {
		pointer-events: all !important;
	}
</style>
