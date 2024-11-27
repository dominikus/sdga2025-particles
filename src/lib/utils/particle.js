const MAX_SPEED = 5;
const MAX_FORCE = 2.5;
const PROXIMITY_LIMIT = 100;

export function update(particle) {
	particle.velocity.add(particle.acceleration);
	particle.velocity.limit(MAX_SPEED);
	particle.position.add(particle.velocity);
	particle.acceleration.mult(0);
}

function applyForce(particle, force) {
	particle.acceleration.add(force);
}

function map(x, a, b, ta, tb) {
	let factor = (x - a) / (b - a);
	return (tb - ta) * factor + ta;
}

export function seek(particle, target) {
	let desired = target.sub(particle.position);

	let d = desired.mag();

	if (d < 0.01) {
		// we're there!
		return;
	} else if (d < PROXIMITY_LIMIT) {
		let m = map(d, 0, PROXIMITY_LIMIT, 0, MAX_SPEED);
		desired.setMag(m);
	} else {
		desired.setMag(MAX_SPEED);
	}
	let steer = desired.sub(particle.velocity);
	steer.limit(MAX_FORCE);
	applyForce(particle, steer);
}

export function createParticle(x, y, tx, ty, talkative = false) {
	return {
		position: vector(x, y, 'position', talkative),
		target: vector(tx, ty, 'target', talkative),
		velocity: vector(0, 0, 'velocity', talkative),
		acceleration: vector(0, 0, 'acceleration', talkative)
	};
}

export function vector(_x, _y, name, talkative = false) {
	let v = { x: _x, y: _y };

	let sub = (v2) => {
		return vector(v.x - v2.v.x, v.y - v2.v.y);
	};
	let add = (v2) => {
		talkative && console.log(name, v.x, v.y, '+', v2.v.x, v2.v.y);
		v.x += v2.v.x;
		v.y += v2.v.y;
	};
	let mult = (factor) => {
		v.x *= factor;
		v.y *= factor;
	};
	let mag = () => Math.hypot(v.x, v.y);
	let resize = (newMag, limit = false) => {
		const currentMag = mag();
		if (currentMag !== 0) {
			const resize = newMag / currentMag;
			if (!limit || resize < 1) {
				mult(resize);
			}
		}
	};
	let limit = (limit) => {
		resize(limit, true);
	};
	let setMag = (newMag) => {
		resize(newMag, false);
	};

	return {
		v,
		sub,
		add,
		mult,
		mag,
		resize,
		limit,
		setMag
	};
}
