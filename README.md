# SDGA 2025 Particles

Showing countries, indicators and progress with particles.

## General architecture

[routes/+page.svelte](src/routes/+page.svelte) loads the data from [static/data/toy_data_pluse_values.csv](static/data/toy_data_pluse_values.csv) and passes it into the main [ParticleApp.svelte](lib/ParticleApp.svelte) component.

In [ParticleApp.svelte](lib/ParticleApp.svelte) the `step` function is setting `activeVis` and `activeScene`. The corresponding visualization component is selected through `modes` and mounted through the `Vis` component.

The particles are rendered to a `canvas` element, which sits below the layers of the `Vis` component.

The `setup` function sets up the Pixi `renderer` (which references the `canvas` to render everything to), sets up a Pixi `baseContainer`, adds children `ParticleContainer` and `spriteContainer` to it.

In `setup`, for each country/indicator combination, a particle is created with the `createParticle` function. These particles are objects holding multiple `PIXI.POINT` for their position, target, velocity, acceleration, scale, ..., with getters and setters for each. In the `setup` function each particle also gets properties from the data (like the country code, the indicator, the indicator target, ...), gets a home location (also with `PIXI.Point`), which is 50 pixels above the top of the window, and gets `view` property which holds a `PIXI.Particle` object. These particle views are added to the `ParticleContainer`, and the full particle is stored in `nodeState.nodes`.

`setup` also defines the `render` function. For each frame, the position, scale and color of each particle is updated. The new position is determined with the `seek` function.

## Vis components

All [vis components](lib/components/vis) import the `VisContainer` to slot in the visualizations. This component has 2 slots: one for a top component (for legends, ...) and one for an svg layer (which can have a child slot for svg elements and one for ISO code labels).

Each vis component imports the state of the particles (`nodeState.nodes`) and has a `layout` function that is invoked when the component is in view. The layout updates the `nodeState.nodes` so that the particles on the canvas are updated. The layout function can also update the content of the slots of the VisContainer.