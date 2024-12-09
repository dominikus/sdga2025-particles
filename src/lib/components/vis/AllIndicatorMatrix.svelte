<script>
	// import { particles } from 'engine.js';
	import { grid as countries } from '$lib/data/worldtilegrid.js';
	import { scaleLinear } from 'd3';
	import * as PIXI from 'pixi.js';
	import { nodeState, labelState } from '$lib/state/nodeState.svelte.js';
	import ISOCodeLabels from '$lib/components/vis/ISOCodeLabels.svelte';

	let particles = nodeState.nodes;

	let { inView = false, activeScene = 0, w, h } = $props();

	const margins = {
		top: 140,
		right: 20,
		bottom: 120,
		left: 20
	};

	const RADIUS = 10;

	const countryNodes = {};
	countries.forEach((d) => {
		countryNodes[d.iso3c] = nodeState.nodes.filter((dd) => dd.country === d.iso3c);
	});

	let countryLevels = [];
	countries.forEach((country) => {
		countryLevels.push({
			country: country.iso3c,
			value: countryNodes[country.iso3c].reduce((acc, val) => (val.level ?? 0) + acc, 0)
		});
	});

	const sceneConfig = {
		0: { sortmode: 'goals' },
		1: { sortmode: 'levels' }
	};

	let sortmode = $derived(sceneConfig[activeScene].sortmode);

	function sortByLevel(a, b) {
		return b.level - a.level;
	}

	function sortByNone(a, b) {
		return 0;
	}

	function layout() {
		console.log('it"s layout!!!', sortmode, countries[0]);
		countryLevels.sort((a, b) => b.value - a.value);

		console.log([...countries].sort((a, b) => a.iso3c.localeCompare(b.iso3c)));

		countries
			.sort((a, b) =>
				sortmode === 'goals'
					? a.iso3c.localeCompare(b.iso3c)
					: countryLevels.findIndex((d) => d.country === a.iso3c) -
						countryLevels.findIndex((d) => d.country === b.iso3c)
			)
			.forEach((country, i) => {
				// const countryOffset = new PIXI.Point(0, 10 + (i * ih) / grid.length);

				const countryOffset = new PIXI.Point(50, margins.top + i * 12);

				const cnodes = nodeState.nodes.filter((d) => d.country === country.iso3c).sort(sortByNone);

				for (let goal = 1; goal <= 17; goal++) {
					cnodes
						.filter((d) => d.sdgGoal === goal)
						.sort((a, b) => {
							if (sortmode === 'goals') {
								return 0;
							} else {
								return b.level - a.level;
							}
						})
						.forEach((d, i) => {
							d.x = d.sdgGoal * (4 * RADIUS) + countryOffset.x;
							d.y = countryOffset.y; // + d.sdgIndicator * RADIUS;

							d.scaleX = d.scaleY = RADIUS;
						});
				}

				// place label:
				const countryLabel = labelState.labels[country.iso3c];
				countryLabel.x = countryOffset.x;
				countryLabel.y = countryOffset.y + RADIUS;
			});
		/*
nodeState.nodes
  .filter((d) => d.type === PARTICLE_TYPES.GOALLABEL)
  .forEach((d) => {
    d.homepoint.x = d.x = 4 * RADIUS * d.sdgGoal + 50;
    d.y = sortmode === 'barchart' ? -20 : MARGIN.y - 20;
  });*/
	}

	$effect(() => {
		if (inView === true && particles?.length > 0) {
			activeScene;
			layout();
		}
	});
</script>

<g>
	{#each new Array(17) as goal, i}
		<text
			transform="translate({(i + 1) * (4 * RADIUS) + RADIUS / 2 + 50}, {margins.top - 10})"
			style="opacity: {inView ? 1 : 0}">{i + 1}</text
		>
	{/each}
</g>
<ISOCodeLabels {w} {h} slot="iso-code-labels"></ISOCodeLabels>

<style>
	text {
		transition: all 1s;
		text-anchor: middle;
	}
</style>
