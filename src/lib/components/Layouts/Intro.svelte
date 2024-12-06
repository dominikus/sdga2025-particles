<script>
	// import { particles } from 'engine.js';
	import { goHome } from '$lib/utils/particleUtils.js';
	import { nodeState } from '$lib/state/nodeState.svelte.js';

	let particles = nodeState.nodes;
	let { inView = false, w, h, frame } = $props();

	let isLayouted = $state(false);

	$effect(() => {
		if (inView === true && frame && !isLayouted && particles.length > 0) {
			layout();
			isLayouted = true;
		}
	});

	function layout() {
		console.log(particles.length);
		particles.forEach((d) => {
			if (d.type === 'indicator') {
				d.x = w * 0.4 - 35;
				d.y = h * 0.4 - 25;

				d.scaleX = 50;
				d.scaleY = 50;
			} else {
				goHome(d);
			}
		});
	}
</script>

<g>
	<text x={w * 0.4 + 50} y={h * 0.4 + 12} style="opacity: {inView ? 1 : 0}"
		>1 country x 1 indicator</text
	>
</g>

<!--
<div slot="under">underneath</div>
<g slot="svg">over</g>
-->

<style>
	text {
		transition: all 1s;
		font-size: 30px;
	}
</style>
