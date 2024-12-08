import * as PIXI from 'pixi.js';

const MIN_SPEED = 25;
const MAX_SPEED = 40;
const MAX_FORCE = 20;
const PROXIMITY_LIMIT = 100;

// Helper function to limit vector magnitude
function limitVector(vec, max) {
	const mag = Math.hypot(vec.x, vec.y);
	if (mag > max) {
		vec.set((vec.x * max) / mag, (vec.y * max) / mag);
	}
}

// Helper function to set vector magnitude
function setVectorMag(vec, mag) {
	const currentMag = Math.hypot(vec.x, vec.y);
	if (currentMag !== 0) {
		vec.set((vec.x / currentMag) * mag, (vec.y / currentMag) * mag);
	}
}

// Map function for scaling values
function map(x, a, b, ta, tb) {
	const factor = (x - a) / (b - a);
	return (tb - ta) * factor + ta;
}

// Particle Update Function
export function update(particle, speed) {
	particle.velocity.set(
		particle.velocity.x + particle.acceleration.x,
		particle.velocity.y + particle.acceleration.y
	);
	limitVector(particle.velocity, particle.MAX_SPEED * speed);
	particle.position.set(
		particle.position.x + particle.velocity.x,
		particle.position.y + particle.velocity.y
	);
	particle.acceleration.set(0, 0);
}

// Apply Force to Particle
function applyForce(particle, force) {
	particle.acceleration.set(particle.acceleration.x + force.x, particle.acceleration.y + force.y);
}

// Particle Seek Behavior
export function seek(particle, target, speed) {
	const desired = new PIXI.Point(target.x - particle.position.x, target.y - particle.position.y);

	const d = Math.hypot(desired.x, desired.y);

	if (d < 1) {
		particle.position.set(target.x, target.y);
		return;
	} else if (d < PROXIMITY_LIMIT) {
		const m = map(d, 0, PROXIMITY_LIMIT, 0, particle.MAX_SPEED * speed);
		setVectorMag(desired, m);
	} else {
		setVectorMag(desired, particle.MAX_SPEED * speed);
	}

	const steer = new PIXI.Point(desired.x - particle.velocity.x, desired.y - particle.velocity.y);
	limitVector(steer, MAX_FORCE * speed * speed);

	applyForce(particle, steer);
}

// Particle Factory
export function createParticle(x, y, tx, ty, talkative = false, type) {
	return {
		position: new PIXI.Point(x, y),
		target: new PIXI.Point(tx, ty),
		velocity: new PIXI.Point(0, 0),
		acceleration: new PIXI.Point(0, 0),
		MAX_SPEED: MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
		type
	};
}
