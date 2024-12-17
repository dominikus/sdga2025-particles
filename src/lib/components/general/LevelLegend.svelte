<script>
	import CategoricalLegend from './CategoricalLegend.svelte';
	import Colors from '$lib/variables.js';
	export let indicator = '';
</script>

<CategoricalLegend
	title="How did countries progress, compared to countries with a similar starting point{indicator}?"
	items={[
		{ color: Colors.level0, label: 'among the worst' },
		{ color: Colors.level1, label: 'worse than expected' },
		{ color: Colors.level2, label: 'about as expected' },
		{ color: Colors.level3, label: 'better than expected' },
		{ color: Colors.level4, label: 'among the best' }
	]}
></CategoricalLegend>
