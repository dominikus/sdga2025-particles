<script>
	// Copyright 2021, Observable Inc.
	// Released under the ISC license.
	// https://observablehq.com/@d3/color-legend
	import { interpolate, quantize, interpolateRound } from 'd3';
	import Number from './Number.svelte';
	import { browser } from '$app/environment';

	/*old stuff*/
	export let units = '';
	export let unitLabel = '';
	export let digits = 0;
	export let hidden = false;
	export let title = '';
	export let color;

	/*new porperties*/
	export let tickLabels = [];
	//export let ticks;
	//export let tickFormat;
	//export let tickValues = [];

	let width = 620;
	let tickSize = 12;
	let height = 16 + tickSize;
	const margin = {
		top: 0,
		right: 0,
		bottom: 4 + tickSize,
		left: 0
	};
	//ticks = width / 64;

	let domain = [];

	$: {
		const d = color.domain();
		domain = [];
		if (d.length == 2) {
			domain = [d[0], d[0] + (d[1] - d[0]) / 2, d[1]];
		} else {
			domain = d;
		}
	}

	function ramp(color, n = 256) {
		if (browser) {
			const canvas = document.createElement('canvas');
			canvas.width = n;
			canvas.height = 1;
			const context = canvas.getContext('2d');
			for (let i = 0; i < n; ++i) {
				context.fillStyle = color(i / (n - 1));
				context.fillRect(i, 0, 1, 1);
			}
			return canvas;
		}
	}

	let x = () => {},
		n,
		href;

	$: if (browser) {
		// Continuous
		if (color.interpolate) {
			n = Math.min(color.domain().length, color.range().length);
			x = color.copy().rangeRound(quantize(interpolate(margin.left, width - margin.right), n));
			href = ramp(color.copy().domain(quantize(interpolate(0, 1), n))).toDataURL();
		}
		// Sequential
		else if (color.interpolator) {
			x = Object.assign(
				color.copy().interpolator(interpolateRound(margin.left, width - margin.right)),
				{
					range() {
						return [margin.left, width - margin.right];
					}
				}
			);

			href = ramp(color.interpolator()).toDataURL();

			// scaleSequentialQuantile doesn’t implement ticks or tickFormat.

			/*
    if (!x.ticks) {
      if (tickValues === undefined) {
        const n = Math.round(ticks + 1);
        tickValues = range(n).map((i) => quantile(color.domain(), i / (n - 1)));
        console.log(tickValues);
      }
      if (typeof tickFormat !== 'function') {
        tickFormat = format(tickFormat === undefined ? ',f' : tickFormat);
      }
    } */
		}
	}
</script>

<div class:not-visible={hidden} class={'legend'} aria-hidden="true">
	<p>
		<span>{title}</span>&nbsp;<span>{unitLabel ? '(' + unitLabel + ')' : ''}</span>
	</p>
	<svg {width} {height} viewBox={[0, 0, width, height]}>
		<image
			x={margin.left}
			y={margin.top}
			width={width - margin.left - margin.right}
			height={height - margin.top - margin.bottom}
			preserveAspectRatio="none"
			xlink:href={href}
		/>
		<g class="ticks">
			{#each tickLabels as tick, i}
				<text
					class:first={i === 0}
					class:last={i === tickLabels.length - 1}
					x={x(tick.value)}
					y={margin.top + 28}>{tick.label}</text
				>
			{/each}
			{#if tickLabels.length === 0}
				{#each domain as tick, i}
					<text
						class:first={i === 0}
						class:last={i === domain.length - 1}
						x={x(tick)}
						y={margin.top + 32}><Number value={tick} unit={units} {digits} /></text
					>
				{/each}
			{/if}
		</g>
	</svg>
</div>

<style>
	svg {
		overflow: visible;
		display: block;
	}
	text {
		text-anchor: middle;
		font-size: var(--font-size-m);
		fill: var(--text-lightest);
		font-weight: 600;

		/*demo version*/
		fill: white;
	}
	text.first {
		text-anchor: start;
	}
	text.last {
		text-anchor: end;
	}
	p {
		padding: 0;
		margin: 0;
		white-space: nowrap;
		font-size: var(--font-size-l);
		font-weight: 300;
		line-height: 160%;

		/*demo version*/
		color: white;
	}
	.legend.not-visible {
		opacity: 0;
	}
	.legend {
		display: flex;
		flex-direction: column;
		width: fit-content;

		/*demo version*/
		width: 100%;
		padding: var(--space-s);
		row-gap: var(--space-2xs);
	}
</style>
