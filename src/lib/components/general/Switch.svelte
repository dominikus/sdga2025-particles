<!-- Rounded switch -->
<script>
	export let leftLabel;
	export let rightLabel;
	export let toggle;
	export let hidden = false;
	export let justify = 'center';
</script>

<div class="switch-container" class:hidden style="justify-content:{justify}">
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<span
		class="label left"
		class:highlight={toggle}
		on:click={() => (toggle = true)}
		on:keyup={() => (toggle = true)}
		tabindex="0"
		role="button">{leftLabel}</span
	>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<label class="switch">
		<input type="checkbox" checked={!toggle} on:click={() => (toggle = !toggle)} />
		<span class="slider round"></span>
	</label>

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<span
		class="label right"
		class:highlight={!toggle}
		on:click={() => (toggle = false)}
		on:keyup={() => (toggle = false)}
		tabindex="0"
		role="button">{rightLabel}</span
	>
</div>

<style>
	span {
		color: var(--white);
	}
	.switch-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		font-size: var(--font-size-m);
		width: 100%;
	}
	.switch-container.hidden {
		visibility: hidden;
		pointer-events: none;
		display: none;
		margin: 0;
		padding: 0;
	}

	.label {
		cursor: pointer;
		opacity: 0.7;
		font-weight: 500;
	}
	.label.right {
		text-align: left;
	}
	.label.left {
		text-align: right;
	}
	.label.highlight {
		opacity: 1;
	}

	/* The switch - the box around the slider */
	.switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 26px;
	}

	/* Hide default HTML checkbox */
	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* The slider */
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--blue);
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 18px;
		width: 18px;
		left: 4px;
		bottom: 4px;
		background-color: var(--white);

		transition: transform 0.15s ease-out;
	}

	input:checked + .slider {
		background-color: var(--blue);
	}

	input:focus + .slider {
		border: 0px solid var(--blue);
	}

	input:checked + .slider:before {
		transform: translateX(24px);
	}

	/* Rounded sliders */
	.slider.round {
		border-radius: 24px;
	}

	.slider.round:before {
		border-radius: 50%;
	}
</style>
