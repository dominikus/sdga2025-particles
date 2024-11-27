<script>
	import { forceSimulation, forceX, forceY, forceCenter, forceCollide, scaleLinear } from 'd3';
	import { grid } from '$lib/data/worldtilegrid.js';

	$: console.log(grid);

	const MARGIN = 20;
	const RADIUS = 2;

	let canvas, ctx;

	let w, h;

	let xScale = scaleLinear().domain([0, 28]);
	let yScale = scaleLinear().domain([0, 22]);

	let isSetup = false;

	function colorFromLevel(level) {
		//return ['#771a1a', '#eb8a8a', '#ffe9a4', '#8fd4f1', '#134257'][level];
		return ['#f75781', '#fda696', '#fbe9aa', '#60d1c3', '#009ee9'][level];
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

		let nodes = [];
		grid.forEach((d) => {
			const countryLevel = Math.floor(Math.random() * 5);
			for (let i = 0; i < 150; i++) {
				nodes.push({
					id: d.iso3c,
					x: xScale(d.x),
					y: yScale(d.y),
					tx: d.x,
					ty: d.y,
					level: Math.max(0, Math.min(4, countryLevel + Math.floor(Math.random() * 4) - 2))
				});
			}
		});

		let simulation = forceSimulation(nodes)
			.force(
				'x',
				forceX()
					.x((d, i) => xScale(d.tx))
					.strength(0.05)
			)
			.force(
				'y',
				forceY()
					.y((d) => yScale(d.ty))
					.strength(0.05)
			)
			.force('collide', forceCollide(RADIUS).strength(1));
		//.force('center', forceCenter(w / 2, h / 2).strength(0.5));

		isSetup = true;

		function render() {
			simulation.tick();

			// Clear canvas
			ctx.fillStyle = '#f6f5f3';
			ctx.fillRect(0, 0, w, h);

			// Draw nodes
			nodes.forEach((node) => {
				ctx.fillStyle = colorFromLevel(node.level);
				ctx.beginPath();
				ctx.arc(node.x, node.y, RADIUS, 0, 2 * Math.PI);
				ctx.fill();
			});

			/*grid.forEach((country) => {
				let center = { x: 0, y: 0 };
				const cnodes = nodes.filter((d) => d.id === country.iso3c);
				cnodes.forEach((n) => {
					center.x += n.x;
					center.y += n.y;
				});
				center.x /= cnodes.length;
				center.y /= cnodes.length;

				let dist = 0;
				cnodes.forEach((n) => {
					const cdist = Math.hypot(n.x - center.x, n.y - center.y);
					if (cdist > dist) {
						dist = cdist;
					}
				});

				ctx.strokeStyle = '#999';
				ctx.beginPath();
				ctx.arc(center.x, center.y, dist + RADIUS, 0, 2 * Math.PI);
				ctx.stroke();
			});*/

			console.log('tick');
			requestAnimationFrame(render);
		}

		requestAnimationFrame(render);
	}
</script>

<canvas bind:this={canvas} />
