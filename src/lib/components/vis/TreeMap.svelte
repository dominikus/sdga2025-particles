<script>
    import { countryRegions as countryRegions } from '$lib/data/country-regions.js';
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';
    import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';
    import { hierarchy, treemap } from 'd3'

    let { inView = false, activeScene = 0,w, h, frame } = $props();

	let particles = nodeState.nodes;
    let indicatorParticles = particles.filter(d => d.indicatorName == "GDP per capita, PPP (constant 2021 international $)")
        /*.map(d => ({...d,
            region: countryRegions.find(c => c.iso3c == d.country).region_iso3c
        }))*/
    let otherParticles = particles.filter(d => d.indicatorName != "GDP per capita, PPP (constant 2021 international $)")

    const regions = ["EAS", "ECS", "LCN", "MEA", "SAS", "SSF"].map(r => ({
        "name": r,
        "children": indicatorParticles.filter(d => countryRegions.find(c => c.iso3c == d.country).region_iso3c == r)
    }))
    let world = {
        "name": "world",
        children: regions
    }

    const margins = {
		top: 20,
		right: 20,
		bottom: 20,
		left: 120
	};

    let root = hierarchy(world)
    root.sum((d) => d.valueAbs);
    root.sort((a, b) => b.height - a.height || b.valueAbs - a.valueAbs);
    
    treemap().size([w - margins.right - margins.left,h - margins.top - margins.bottom]).padding(2)(root)
    console.log(root.leaves())

    /*const sceneConfig = {
		0: { sortmode: 'none', scaling: 'none' },
		1: { sortmode: 'levels', scaling: 'none' },
        2: { sortmode: 'levels', scaling: 'value' },

	};
    let sortmode = $derived(sceneConfig[activeScene].sortmode)
    let scalemode = $derived(sceneConfig[activeScene].scaling)*/

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
        indicatorParticles.forEach((d) => {
            let countryNode = root.leaves().find(c => c.data.country == d.country)
            if(countryNode){
                console.log(countryNode.x0)
                d.x = margins.left + countryNode.x0;
			    d.y = h + margins.bottom - countryNode.y0;
                d.scaleX = countryNode.x1 - countryNode.x0;
                d.scaleY = countryNode.y0 - countryNode.y1;
            }
            else{
                goHome(d);
			    d.scaleX = 10;
			    d.scaleY = 10;
			    resetColor(d);
            }

            /*const countryLabel = labelState.labels[d.country]
            if(scalemode == 'value' && (d.valuePP > 5000 || d.valuePP < 0)){
                countryLabel.x = margins.left + (i) * RADIUS + i*2;
                countryLabel.y = h * 0.4 - d.valuePP/100
            }
            else {
                countryLabel.x = countryLabel.homepoint.x;
				countryLabel.y = countryLabel.homepoint.y;
            }*/
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
