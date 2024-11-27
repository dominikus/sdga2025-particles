<script>
	export let img;
</script>

<div class="parallax" style="background-image: url('{img}')"></div>

<style>
	.parallax {
		/* Full height */
		height: 800px;

		/* Create the parallax scrolling effect */
		background-attachment: fixed;
		background-position: center;
		background-repeat: no-repeat;
		background-size: 100%;
		margin: var(--space-2xl) 0;
	}

	@media only screen and (max-device-width: 920px) {
		.parallax {
			background-attachment: scroll;
			height: 300px;
		}
	}
</style>
