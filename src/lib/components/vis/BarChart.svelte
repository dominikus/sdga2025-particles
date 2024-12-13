<script>
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';
    import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';

    //$inspect(labelState)

    let { inView = false, activeScene = 0,w, h, frame } = $props();

	let particles = nodeState.nodes;
    let indicatorParticles = particles.filter(d => d.indicatorName == "GDP per capita, PPP (constant 2021 international $)")
    let otherParticles = particles.filter(d => d.indicatorName != "GDP per capita, PPP (constant 2021 international $)")

    const margins = {
		top: 160,
		right: 20,
		bottom: 120,
		left: 120
	};

    const sceneConfig = {
		0: { sortmode: 'none', scaling: 'none' },
		1: { sortmode: 'levels', scaling: 'none' },
        2: { sortmode: 'levels', scaling: 'value' },

	};
    let sortmode = $derived(sceneConfig[activeScene].sortmode)
    let scalemode = $derived(sceneConfig[activeScene].scaling)

	$effect(() => {
		if (inView === true && frame) {
			layout();
		}
	});

    const RADIUS = 10
	function layout() {
        otherParticles.forEach(node => {
            goHome(node);
			node.scaleX = 10;
			node.scaleY = 10;
			resetColor(node);
        })
        indicatorParticles.sort((a,b) => 
            sortmode == "none"
                ? 0
                : b.level - a.level
        ).forEach((d, i) => {
            d.x = margins.left + (i) * RADIUS + i*2;
			d.y = scalemode == 'value' ? h * 0.4 - d.valuePP/100 : h * 0.4;
            d.scaleX = RADIUS;
            d.scaleY = scalemode == 'value' ? d.valuePP/100 : RADIUS;

            const countryLabel = labelState.labels[d.country]
            if(scalemode == 'value' && (d.valuePP > 5000 || d.valuePP < 0)){
                countryLabel.x = margins.left + (i) * RADIUS + i*2;
                countryLabel.y = h * 0.4 - d.valuePP/100
            }
            else {
                countryLabel.x = countryLabel.homepoint.x;
				countryLabel.y = countryLabel.homepoint.y;
            }
        })
	}
</script>

<VisContainer {w} {h}>
    <ISOCodeLabels {w} h={2500} slot="iso-code-labels"></ISOCodeLabels>
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
