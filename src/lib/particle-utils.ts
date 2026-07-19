export const GLOW_DURATION_MS = 300;
export const SETTLED_DURATION_MS = 4500;
export const FADE_DURATION_MS = 700;

export const PARTICLE_POOL_SIZE = 300;
export const PARTICLES_PER_CHAR = 8;
export const PARTICLE_LIFE_MS = 900;

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  alpha: number;
}

export function createParticlePool(size: number): Particle[] {
  return Array.from({ length: size }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    size: 0,
    alpha: 0,
  }));
}

export function spawnParticlesInPool(
  pool: Particle[],
  x: number,
  y: number,
  count: number,
  cursor: { index: number }
): void {
  for (let i = 0; i < count; i += 1) {
    const particle = pool[cursor.index % pool.length];
    cursor.index += 1;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.6;

    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed - 0.4;
    particle.life = 1;
    particle.size = 1.5 + Math.random() * 2.5;
    particle.alpha = 1;
  }
}

export function updateParticle(particle: Particle, deltaMs: number): void {
  if (!particle.active) return;

  const lifeStep = deltaMs / PARTICLE_LIFE_MS;
  particle.life -= lifeStep;

  if (particle.life <= 0) {
    particle.active = false;
    particle.alpha = 0;
    return;
  }

  const dtScale = deltaMs / 16.67;
  particle.x += particle.vx * dtScale;
  particle.y += particle.vy * dtScale;
  particle.vy += 0.015 * dtScale;
  particle.vx *= 0.98;
  particle.alpha = particle.life;
}
