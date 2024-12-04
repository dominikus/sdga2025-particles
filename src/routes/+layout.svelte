<script>
	import '../styles/normalize.css';
	import '../styles/variables.css';
	import '../styles/styles.css';
	import '../styles/fluid.css';
	import '../styles/grid.css';
	import '../styles/vis.css';
</script>

<svelte:head>
	<title>SDGAtlas 2025 experiments</title>
	<meta property="og:title" content="" />
	<meta property="og:description" content="" />
	<meta property="og:image" content="" />

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display+SC:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<slot />
