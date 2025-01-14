<script>
	import { csv } from 'd3';

	import ParticleApp from '$lib/components/ParticleApp.svelte';
	import { onMount } from 'svelte';

	let allIndicators = [];
	let fullIndicators = [];
	onMount(() => {
		csv('/data/targets-indicators.csv', (dd) => {
			fullIndicators = [
				...fullIndicators,
				{
					goal: +dd.goal,
					target: dd.target,
					indicators: +dd.indicators
				}
			];
		});
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
					targetValue: +d.target_value,
					indicatorName: d.indicatorname,
					moreIsBetter: d.more_is_better === '1'
				}
			];
			//allIndicators = [...allIndicators, { ...d, indicators: +d.indicators }];
		});
	});
	$: console.log(allIndicators, fullIndicators);
</script>

<!--<Particles />-->
<!--<ParticleBoxes />-->
<!--<PixiParticleBoxes {allIndicators} />-->
<ParticleApp {allIndicators} {fullIndicators} />

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
