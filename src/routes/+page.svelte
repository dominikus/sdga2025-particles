<script>
	import { csv } from 'd3';

	import ParticleApp from '$lib/components/ParticleApp.svelte';
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
					goal: +d.goal,
					indicatorName: d.indicatorname
				}
			];
			//allIndicators = [...allIndicators, { ...d, indicators: +d.indicators }];
		});
	});
	$: console.log(allIndicators);
</script>

<!--<Particles />-->
<!--<ParticleBoxes />-->
<!--<PixiParticleBoxes {allIndicators} />-->
<ParticleApp {allIndicators} />

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
