<script>
	import { _ } from 'svelte-i18n';

	export let itemSymbol = 'square';
	export let hidden;
	export let top = false;

	export let items = [];
</script>

<div class:top class:hidden class="categorical-legend" aria-hidden="true">
	{#each items as item}
		<div class="pill-container">
			<div
				class={`pill ${itemSymbol}`}
				style:background-color={item.color}
				style:border-color={item.border}
			/>
			<div class={'legend-label'}>
				{item.label}
			</div>
		</div>
	{/each}
</div>

<style>
	.categorical-legend {
		display: flex;
		flex-flow: row wrap;
		justify-content: center;
		margin: 0;
		column-gap: var(--space-m);
		row-gap: var(--space-2xs);
	}

	.legend-label {
		font-size: var(--font-size-s);
		font-weight: 300;
		line-height: 160%;
	}

	.categorical-legend.top {
		margin: 0 0 var(--space-s) 0;
	}
	.categorical-legend .pill-container {
		display: flex;
		align-items: center;
	}
	.categorical-legend .pill-container .pill {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		margin-right: var(--space-xs);
		border: 1px solid transparent;
	}
	.categorical-legend .pill-container .pill.square {
		border-radius: 0px;
	}
	.categorical-legend .pill-container .pill.line {
		height: 2.5px;
		width: 20px;
		border-radius: 2px;
	}
	.hidden {
		visibility: hidden;
	}
</style>
