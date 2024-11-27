<script>
	import { browser } from '$app/environment';

	export let tx;
	export let ty;

	export let display = true;
	export let maxColWidth = 4;

	let visible = true;

	let tooltipWidth = 0;
	let tooltipHeight = 0;

	let margin = 15;

	let measureWidth = 0;
	let measureHeight = 0;

	let mp = { x: 0, y: 0 };

	function handleMousemove(event) {
		if (browser && el && display) {
			const bounds = el.getBoundingClientRect();
			mp.x = event.clientX - bounds.left;
			mp.y = event.clientY - bounds.top;

			if (mp.y < 0 || mp.y > bounds.height || mp.x < 0 || mp.x > bounds.width) {
				visible = false;
			} else {
				visible = true;
			}
		}
	}

	let x = 0;
	let y = 0;

	$: {
		let by = ty ? ty : mp.y;

		if (isMid) {
			by += margin;
		}

		by = Math.max(margin, Math.min(measureHeight - margin - tooltipHeight, by));

		y = by;
	}

	let isMid = false;

	$: {
		let bx = tx ? tx : mp.x;

		bx += margin;

		if (bx > measureWidth - margin - tooltipWidth && bx - tooltipWidth - margin < 0) {
			bx = (tx ? tx : mp.x) - tooltipWidth / 2;
			isMid = true;
		} else if (bx > measureWidth - margin - tooltipWidth) {
			// flip tooltip
			bx = (tx ? tx : mp.x) - margin - tooltipWidth;
			isMid = false;
		} else {
			bx = Math.max(margin, Math.min(measureWidth - margin - tooltipWidth, bx));
			isMid = false;
		}

		x = bx;
	}

	let el;
</script>

<svelte:window on:mouseover={handleMousemove} on:mousemove={handleMousemove} />
{#if display}
	<div
		class="measure"
		bind:this={el}
		bind:clientWidth={measureWidth}
		bind:clientHeight={measureHeight}
	/>
	<div
		class="container"
		style="left: {x}px; top: {y}px;"
		class:visible
		style:max-width={`var(--col-${maxColWidth})`}
		bind:clientWidth={tooltipWidth}
		bind:clientHeight={tooltipHeight}
	>
		<div class="content" style="maxWidth:{tooltipWidth}px; ">
			<slot />
		</div>
	</div>
{/if}

<style>
	.measure {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: transparent;
		pointer-events: none;
	}

	.container {
		position: absolute;
		z-index: 99999;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s;
		height: auto;
	}
	.container.visible {
		opacity: 1;
	}
	.content {
		padding: 10px;
		background: #fff;
		box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 10px;
		overflow: hidden;
		line-height: 160%;
	}
</style>
