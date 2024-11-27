<script>
	export let border = true;
	export let leadin = 'Source: ';
</script>

<p class:border><span class="pre">{leadin}</span><slot /></p>

<style>
	.pre {
		font-style: italic;
		font-weight: 500;
	}
	p {
		font-size: var(--font-size-s);
		width: 100%;
		max-width: var(--col-12);
		line-height: 120%;
	}
	p.border {
		border-top: 1px solid var(--text);
		padding-top: var(--space-xs);
	}
</style>
