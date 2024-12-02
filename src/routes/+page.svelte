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

<!--<Particles />-->
<!--<ParticleBoxes />-->
<PixiParticleBoxes {goalTargets} />
