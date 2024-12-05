<script>
	import { _ } from 'svelte-i18n';
	import { tsv, csv } from 'd3';

	import Particles from '$lib/components/Particles.svelte';
	import ParticleBoxes from '$lib/components/ParticleBoxes.svelte';
	import PixiParticleBoxes from '$lib/components/PixiParticleBoxes.svelte';
	import ToyDataParticles from '$lib/components/ToyDataParticles.svelte';
	import { onMount } from 'svelte';

	let allIndicators = [];
	onMount(() => {
		csv('/data/toy_data_plus_values.csv', (d) => {
			allIndicators = [
				...allIndicators,
				{
					iso3c: d.code,
					level: ['0-20', '20-40', '40-60', '60-80', '80-100'].indexOf(d.pctl),
					speed: +d.speed,
					value: +d.value,
					origValue: +d.orig_value,
					diff: +d.diff,
					goal: +d.goal
				}
			];
			//allIndicators = [...allIndicators, { ...d, indicators: +d.indicators }];
		});
	});
	$: console.log(allIndicators);
</script>

<img src="img/legend.png" />
<!--<Particles />-->
<!--<ParticleBoxes />-->
<!--<PixiParticleBoxes {allIndicators} />-->
<ToyDataParticles {allIndicators} />

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
