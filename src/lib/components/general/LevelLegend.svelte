<script>
	import CategoricalLegend from './CategoricalLegend.svelte';

	export let indicator = '';
</script>

<CategoricalLegend
	title="How did countries progress, compared to countries with a similar starting point{indicator}?"
	items={[
		{ color: '#f75781', label: 'among the worst' },
		{ color: '#fda696', label: 'worse than expected' },
		{ color: '#fbe9aa', label: 'about as expected' },
		{ color: '#60d1c3', label: 'better than expected' },
		{ color: '#009ee9', label: 'among the best' }
	]}
></CategoricalLegend>
