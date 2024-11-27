<script>
	export let text = '';
	export let scene;
	export let hidden = false;
</script>

<div class="scene">
	{#if !hidden}
		<div class="content">
			{@html text}
			<slot {scene} />
		</div>
	{/if}
</div>

<style>
	.content {
		max-width: var(--col-6);
		height: fit-content;
		line-height: 160%;

		color: var(--text);
		background-color: var(--background);

		padding: var(--space-s);
		border: 0.5px solid var(--background-dark);
		box-shadow: 4px 4px 8px #85878b88;

		overflow: hidden;
	}
</style>
