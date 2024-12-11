<script>
	// import { particles } from 'engine.js';
	import { nodeState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';

	let particles = nodeState.nodes;
	let { inView = false, w, h, frame } = $props();

	$effect(() => {
		if (inView === true && frame) {
			layout();
		}
	});

	function layout() {
		particles[0].x = w * 0.4 - 35;
		particles[0].y = h * 0.4 - 25;

		particles[0].scaleX = 50;
		particles[0].scaleY = 50;

		particles.forEach((node, i) => {
			if (i > 0) {
				goHome(node);
				node.scaleX = 10;
				node.scaleY = 10;
				resetColor(node);
			}
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
