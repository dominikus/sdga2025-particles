<script>
	// import { particles } from 'engine.js';
	import { goHome } from '$lib/utils/particleUtils.js';

	export let particles = [];
	export let inView = false;
	export let w, h;

	$: if (inView === true && particles?.length > 0) {
		layout();
	}

	function layout() {
		particles.forEach((d) => {
			if (d.type === 'indicator') {
				d.x = w * 0.4 - 35;
				d.y = h * 0.4 - 25;

				d.scaleX = 50;
				d.scaleY = 50;
			} else {
				goHome(d);
			}
		});
	}
</script>

<!--
<div slot="under">underneath</div>
<g slot="svg">over</g>
-->
