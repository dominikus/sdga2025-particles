<script>
	export let w;
	export let h;
</script>

<div><slot name="top"></slot></div>
<svg class="vis" width={w} height={h}>
	<slot name="svg" />
	<slot name="iso-code-labels" />
</svg>

<style>
	svg {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 9999;

		pointer-events: none;
	}

	div {
		position: absolute;
		flex: 1;
		width: 1280px;
		height: 120px;
		display: flex;
		flex-direction: column;
	}
</style>
