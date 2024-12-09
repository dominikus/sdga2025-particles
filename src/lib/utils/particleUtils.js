export function goHome(particle) {
	particle.target.set(particle.homepoint.x, particle.homepoint.y);
}
export function resetColor(particle) {
	particle.colorTarget = particle.levelColor;
}
