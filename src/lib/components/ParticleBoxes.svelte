<script>
	import { scaleLinear } from 'd3';
	import { grid } from '$lib/data/worldtilegrid.js';

	import { seek, update, vector, createParticle } from '$lib/utils/particle.js';

	$: console.log(grid);

	const MARGIN = 20;
	let RADIUS = 3;
	const INDICATORS = 30;

	const BOXDIMS = { w: 40, h: 40 };

	let sortmode = 'goals';

	let canvas, ctx;

	let nodes;
	let frame = 0;

	let w, h;

	let xScale = scaleLinear().domain([0, 29]);
	let yScale = scaleLinear().domain([0, 22]);

	let isSetup = false;

	function colorFromLevel(level) {
		return ['#f75781', '#fda696', '#fbe9aa', '#60d1c3', '#009ee9'][level];
	}

	function sortByLevel(a, b) {
		return b.level - a.level;
	}

	function sortByNone(a, b) {
		return 0;
	}

	function layoutNodes(nodes) {
		frame = 0;
		let nodesPerLine = Math.ceil(Math.sqrt(INDICATORS));
		RADIUS = BOXDIMS.w / nodesPerLine;
		grid.forEach((country) => {
			const countryOffset = vector(
				Math.floor(xScale(country.x)) - BOXDIMS.w / 2 + 0.5,
				Math.floor(yScale(country.y)) - BOXDIMS.h / 2 + 0.5
			);

			const cnodes = nodes
				.filter((d) => d.id === country.iso3c)
				.sort(sortmode === 'goals' ? sortByNone : sortByLevel);
			cnodes.forEach((d, i) => {
				d.target.v.x = (i % nodesPerLine) * RADIUS + countryOffset.v.x;
				d.target.v.y = Math.floor(i / nodesPerLine) * RADIUS + countryOffset.v.y;
			});
		});
		console.log(nodes);
	}

	$: if (canvas && !isSetup) {
		w = window.innerWidth;
		h = window.innerHeight;
		// enlarge to full screen size:
		canvas.width = w;
		canvas.height = h;

		xScale.range([MARGIN, w - MARGIN * 2]);
		yScale.range([MARGIN, h - MARGIN * 2]);

		ctx = canvas.getContext('2d');

		nodes = [];
		grid.forEach((d) => {
			const countryLevel = Math.floor(Math.random() * 5);
			for (let i = 0; i < INDICATORS; i++) {
				let p = createParticle(w / 2, h / 2, d.x, d.y);
				p.id = d.iso3c;
				p.count = Math.random() * 100;
				p.level = Math.max(0, Math.min(4, countryLevel + Math.floor(Math.random() * 4) - 2));
				nodes.push(p);
			}
		});

		// layout nodes:
		layoutNodes(nodes);

		/*
		const testVec = createParticle(0, 0, 100, 100, true);
		console.log(testVec);
		seek(testVec, testVec.target);
		console.log(testVec);
		update(testVec);
		console.log(testVec);
		update(testVec);
		console.log(testVec);
    

		const vec = vector(0, 0, 'lol', true);
		console.log(vec);
		vec.add(vector(100, 100));
		console.log(vec);
    */

		function render() {
			// Clear canvas
			ctx.fillStyle = '#f6f5f3';
			ctx.fillRect(0, 0, w, h);

			grid.forEach((country) => {
				ctx.fillStyle = '#999';
				ctx.strokeStyle = '#333';

				//ctx.fillRect(0, 0, BOXDIMS.w, BOXDIMS.h);
				// ctx.strokeRect(0, 0, BOXDIMS.w, BOXDIMS.h);

				nodes
					.filter((d) => d.id === country.iso3c)
					.forEach((node) => {
						if (node.count < frame) {
							seek(node, node.target);

							update(node);
						}

						ctx.fillStyle = colorFromLevel(node.level);
						ctx.fillRect(node.position.v.x, node.position.v.y, RADIUS - 0.5, RADIUS - 0.5);
						/*ctx.beginPath();
						ctx.arc(node.x + RADIUS / 2, node.y + RADIUS / 2, RADIUS / 2 - 0.5, 0, 2 * Math.PI);
						ctx.fill();*/
					});

				ctx.save();

				ctx.translate(
					Math.floor(xScale(country.x)) - BOXDIMS.w / 2 + 0.5,
					Math.floor(yScale(country.y)) - BOXDIMS.h / 2 + 0.5
				);
				ctx.font = 'bold 14px Open Sans, sans-serif';
				ctx.textAlign = 'center';
				ctx.fillStyle = '#000';

				ctx.fillText(country.iso3c, BOXDIMS.w / 2, BOXDIMS.h / 2 + 4);

				ctx.restore();
			});

			frame++;

			requestAnimationFrame(render);
		}

		requestAnimationFrame(render);

		isSetup = true;
	}

	function sort() {
		if (sortmode === 'goals') {
			sortmode = 'levels';
		} else {
			sortmode = 'goals';
		}
		layoutNodes(nodes);
	}
</script>

<canvas bind:this={canvas} />

<button on:click={sort}>toggle sort mode</button>
