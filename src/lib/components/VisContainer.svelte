<script>
	export let w;
	export let h;
</script>

<slot name="top"></slot>
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
</style>
