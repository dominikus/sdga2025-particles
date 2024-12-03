<script>
	import { _ } from 'svelte-i18n';
	import { tsv } from 'd3';

	import Particles from '$lib/components/Particles.svelte';
	import ParticleBoxes from '$lib/components/ParticleBoxes.svelte';
	import PixiParticleBoxes from '$lib/components/PixiParticleBoxes.svelte';
	import { onMount } from 'svelte';

	let goalTargets = [];
	onMount(() => {
		tsv('/data/targets-indicators.tsv', (d) => {
			goalTargets = [...goalTargets, { ...d, indicators: +d.indicators }];
		});
	});
	$: console.log(goalTargets);
</script>

<img src="img/legend.png" />
<!--<Particles />-->
<!--<ParticleBoxes />-->
<PixiParticleBoxes {goalTargets} />

<style>
	img {
		position: absolute;
		top: 0;
		left: 0;
		width: 1000px;
	}

	:global(canvas) {
		position: absolute;
		top: 0px;
		left: 0;
	}
</style>
