<script>
	export let w;
	export let h;
</script>

<svg class="vis" width={w} height={h}><slot /></svg>

<style>
	svg {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 9999;

		pointer-events: none;
	}
</style>
