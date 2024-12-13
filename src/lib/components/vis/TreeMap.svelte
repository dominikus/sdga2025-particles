<script>
    import { countryRegions as countryRegions } from '$lib/data/country-regions.js';
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';
    import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';
    import { hierarchy, treemap, treemapBinary } from 'd3'

    let { inView = false, w, h, frame } = $props();

	let particles = nodeState.nodes;
    let indicatorParticles = particles.filter(d => d.indicatorName == "GDP per capita, PPP (constant 2021 international $)")
    let otherParticles = particles.filter(d => d.indicatorName != "GDP per capita, PPP (constant 2021 international $)")

    const margins = {
		top: 20,
		right: 20,
		bottom: 20,
		left: 120
	};

    const regions = ["EAS", "ECS", "LCN", "MEA", "SAS", "SSF"].map(r => ({
        "name": r,
        "children": indicatorParticles.filter(d => countryRegions.find(c => c.iso3c == d.country).region_iso3c == r)
    }))
    let world = {
        "name": "world",
        children: regions
    }

    let root = hierarchy(world)
    root.sum((d) => d.valueAbs);
    root.sort((a, b) => a.value - b.value);
    
    treemap()
        .size([w - margins.right - margins.left,h - margins.top - margins.bottom])
        .padding(2)
        .tile(treemapBinary)
        (root)

	$effect(() => {
		if (inView === true && frame) {
			layout();
		}
	});

    const RADIUS = 10
	function layout() {
        otherParticles.forEach(node => {
            goHome(node);
			node.scaleX = RADIUS;
			node.scaleY = RADIUS;
			resetColor(node);
        })
        indicatorParticles.forEach((d) => {
            let countryNode = root.leaves().find(c => c.data.country == d.country)
            const countryLabel = labelState.labels[d.country]
            if(countryNode){
                d.x = margins.left + countryNode.x0;
			    d.y = h + margins.bottom - countryNode.y0;
                d.scaleX = countryNode.x1 - countryNode.x0;
                d.scaleY = countryNode.y0 - countryNode.y1;
                if(d.valueAbs > 10000){
                    countryLabel.x = margins.left + countryNode.x0 + 16;
                    countryLabel.y = h + margins.bottom - countryNode.y1 + 16;
                }
                else {
                    countryLabel.x = countryLabel.homepoint.x;
				    countryLabel.y = countryLabel.homepoint.y;
                }
            }
            else {
                goHome(d);
			    d.scaleX = 10;
			    d.scaleY = 10;
			    resetColor(d);

                countryLabel.x = countryLabel.homepoint.x;
				countryLabel.y = countryLabel.homepoint.y;
            }
        })
	}
</script>

<VisContainer {w} {h}>
    <ISOCodeLabels {w} h={2500} slot="iso-code-labels"></ISOCodeLabels>
	<g slot="svg">
	</g>
</VisContainer>

<style>
</style>
