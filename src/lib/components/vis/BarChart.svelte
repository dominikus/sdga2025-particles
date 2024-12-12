<script>
	import { nodeState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';

	let particles = nodeState.nodes;
    let indicatorParticles = particles.filter(d => d.indicatorName == "GDP per capita, PPP (constant 2021 international $)")
    //.sort(function(a, b) {return b.level - a.level;})
	console.log(indicatorParticles)
    let { inView = false, w, h, frame } = $props();

    const margins = {
		top: 160,
		right: 20,
		bottom: 120,
		left: 120
	};



	$effect(() => {
		if (inView === true && frame) {
			layout();
		}
	});

    const RADIUS = 10
	function layout() {
		/*goHome(particles[0])

		particles[0].scaleX = 10;
		particles[0].scaleY = 10;

        particles[1].x = w * 0.4 - 35;
		particles[1].y = h * 0.4 - 25;

		particles[1].scaleX = 50;
		particles[1].scaleY = 50;

		particles.forEach((node, i) => {
			if (i > 1) {
				goHome(node);
				node.scaleX = 10;
				node.scaleY = 10;
				resetColor(node);
			}
		});*/
        indicatorParticles.forEach((d, i) => {
            d.x = margins.left + (i) * RADIUS + i*2;
			d.y = h * 0.4;
            d.scaleX = RADIUS;
            d.scaleY = d.valuePP/100;
        })
	}
</script>

<VisContainer {w} {h}>
	<g slot="svg">
		<!--text x={w * 0.4 + 50} y={h * 0.4 + 12} style="opacity: {inView ? 1 : 0}"
			>1 country x 1 indicator</text
		-->
	</g>
</VisContainer>

<style>
	text {
		transition: all 1s;
		font-size: 30px;
	}
</style>
