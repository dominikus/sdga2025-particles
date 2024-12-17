<script>
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import VisContainer from '../VisContainer.svelte';
	import { goHome, resetColor } from '$lib/utils/particleUtils.js';
	import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';
	import { grid as countries } from '$lib/data/worldtilegrid.js';
	import LevelLegend from '../general/LevelLegend.svelte';

	let { inView = false, activeScene = 0, w, h, frame } = $props();

	let particles = nodeState.nodes;
	let indicatorParticles = particles.filter(
		(d) => d.indicatorName == 'GDP per capita, PPP (constant 2021 international $)'
	);
	let otherParticles = particles.filter(
		(d) => d.indicatorName != 'GDP per capita, PPP (constant 2021 international $)'
	);

	const margins = {
		top: 180,
		right: 20,
		bottom: 120,
		left: 120
	};

	const sceneConfig = {
		0: { sortmode: 'none', scaling: 'none' },
		1: { sortmode: 'levels', scaling: 'none' },
		2: { sortmode: 'levels', scaling: 'value' }
	};
	let sortmode = $derived(sceneConfig[activeScene].sortmode);
	let scalemode = $derived(sceneConfig[activeScene].scaling);

	$effect(() => {
		if (inView === true && frame) {
			layout();
		}
	});

	const RADIUS =
		(w - margins.left - margins.right - indicatorParticles.length * 2) / indicatorParticles.length;
	function layout() {
		countries.forEach((country) => {
			const countryLabel = labelState.labels[country.iso3c];
			countryLabel.x = countryLabel.homepoint.x;
			countryLabel.y = countryLabel.homepoint.y;
		});

		otherParticles.forEach((node) => {
			goHome(node);
			node.scaleX = 10;
			node.scaleY = 10;
			resetColor(node);
		});

		indicatorParticles
			.sort((a, b) => (sortmode == 'none' ? 0 : b.level - a.level))
			.forEach((d, i) => {
				d.x = margins.left + i * RADIUS + i * 2;
				d.y = scalemode == 'value' ? h * 0.4 - d.valuePP / 100 : h * 0.4;
				d.scaleX = RADIUS;
				d.scaleY = scalemode == 'value' ? d.valuePP / 100 : RADIUS * 4;

				const countryLabel = labelState.labels[d.country];
				if (scalemode == 'value' && (d.valuePP > 12000 || d.valuePP < -4000)) {
					countryLabel.x = margins.left + i * RADIUS + i * 2 + 4;
					countryLabel.y =
						d.valuePP < 0 ? h * 0.4 - d.valuePP / 100 + 12 : h * 0.4 - d.valuePP / 100 - 4;
				}
			});
	}
</script>

<VisContainer {w} {h}>
	<ISOCodeLabels {w} h={2500} slot="iso-code-labels"></ISOCodeLabels>
	<g slot="svg"> </g>
	<div slot="top">
		<LevelLegend indicator=" in GDP per capita, PPP (constant 2021 international $)"></LevelLegend>
	</div>
</VisContainer>

<style>
</style>
