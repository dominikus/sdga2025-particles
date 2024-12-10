<script>
	// import { particles } from 'engine.js';
	import { nodeState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';

	let particles = nodeState.nodes;
	let { inView = false, w, h, frame } = $props();

	$effect(() => {
		if (inView === true && frame) {
			layout();
		}
	});

	function layout() {
		particles.forEach((d) => {
			d.x = w * 0.4 - 35;
			d.y = h * 0.4 - 25;

			d.scaleX = 50;
			d.scaleY = 50;
		});
	}
</script>

<VisContainer {w} {h}>
	<g slot="svg">
		<text x={w * 0.4 + 50} y={h * 0.4 + 12} style="opacity: {inView ? 1 : 0}"
			>1 country x 1 indicator</text
		>
	</g>
</VisContainer>

<style>
	text {
		transition: all 1s;
		font-size: 30px;
	}
</style>
