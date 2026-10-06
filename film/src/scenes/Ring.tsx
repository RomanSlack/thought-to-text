import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {C, H, RING, SpriteName, W} from '../theme';
import {EIN, EOUT, EOUT5, Ink, keys, Paper, Pen, ramp, rnd, Sprite, TypeLine, Vignette} from '../components/kit';

const SIZES: Record<string, number> = {
	brain: 0.13, chip: 0.1, neuron: 0.11, bulb: 0.075, eye: 0.11, tile: 0.08, heart: 0.12,
	keyboard: 0.11, pencil: 0.1, moon: 0.085, robohand: 0.09, bubble: 0.1, headset: 0.11, cursor: 0.06,
};

const ringPos = (i: number, spinDeg: number, rx = 0.33, ry = 0.32) => {
	const a = ((-90 + (i * 360) / RING.length + spinDeg) * Math.PI) / 180;
	return {x: 0.5 + Math.cos(a) * rx, y: 0.5 + Math.sin(a) * ry, a};
};

/** yellow starburst rays + glow when a thought gets "selected" */
const Flash: React.FC<{x: number; y: number; k: number; r: number}> = ({x, y, k, r}) => {
	if (k <= 0 || k >= 1) return null;
	const rays = [20, 70, 135, 200, 250, 315];
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{rays.map((deg, i) => {
				const a = (deg * Math.PI) / 180;
				const r0 = r * (0.7 + k * 0.5);
				const r1 = r0 + r * (0.25 + 0.45 * (1 - Math.abs(k - 0.4)));
				return (
					<line
						key={i}
						x1={x * W + Math.cos(a) * r0}
						y1={y * H + Math.sin(a) * r0}
						x2={x * W + Math.cos(a) * r1}
						y2={y * H + Math.sin(a) * r1}
						stroke={C.gold}
						strokeWidth={7 * (1 - k)}
						strokeLinecap="round"
						opacity={1 - k}
					/>
				);
			})}
		</svg>
	);
};

const FLASHES: {name: SpriteName; at: number}[] = [
	{name: 'heart', at: 7.2},
	{name: 'bulb', at: 7.35},
	{name: 'brain', at: 7.8},
];

export const Ring: React.FC<{t: number}> = ({t}) => {
	const assemble = ramp(t, 6.24, 6.6, 0, 1, EOUT5);
	const spin = (t - 6.2) * 22 - (1 - assemble) * 70;
	const collapse = ramp(t, 8.08, 8.3, 0, 1, EIN);
	const dim = keys(t, [6.2, 6.3, 6.42], [0.0, 0.55, 0.0]);

	return (
		<AbsoluteFill>
			<Paper dim={dim} />
			{/* wandering spray-paint mark in the hole of the ring */}
			<Ink x={keys(t, [6.5, 7.0, 7.6, 8.1], [0.47, 0.42, 0.52, 0.46])} y={keys(t, [6.5, 7.0, 7.6, 8.1], [0.42, 0.52, 0.47, 0.4])} r={46} seed={2} opacity={ramp(t, 6.5, 6.7) * 0.85} />
			<Pen d={`M ${0.5 * W} ${0.12 * H} C ${0.42 * W} ${0.2 * H}, ${0.43 * W} ${0.32 * H}, ${0.48 * W} ${0.38 * H}`} p={ramp(t, 7.0, 7.14)} tail={0.6} width={18} color="#151515" opacity={ramp(t, 7.14, 7.3, 0.9, 0)} />
			{RING.map((name, i) => {
				const {x, y, a} = ringPos(i, spin);
				const f = FLASHES.find((q) => q.name === name);
				const glow = f ? ramp(t, f.at, f.at + 0.06) * ramp(t, f.at + 0.06, f.at + 0.3, 1, 0) : 0;
				// collapse: the ring squashes sideways into a row heading for the first card
				const cx = x + (0.5 + (x - 0.5) * 0.55 - x) * collapse + collapse * 0.08;
				const cy = y + (0.5 + (y - 0.5) * 0.25 - y) * collapse;
				const enter = 1 + (1 - assemble) * 0.9;
				return (
					<React.Fragment key={name}>
						<Sprite
							name={name}
							x={0.5 + (cx - 0.5) * enter}
							y={0.5 + (cy - 0.5) * enter}
							w={SIZES[name] * 1.55}
							rz={Math.cos(a) * 10 + (rnd(i) - 0.5) * 16}
							ry={Math.sin(t * 2.2 + i) * 22}
							rx={Math.cos(t * 1.7 + i) * 10}
							scale={(1 + collapse * 0.5) * (1 + glow * 0.12)}
							blur={(1 - assemble) * 16 + collapse * 6}
							glow={glow}
						/>
						{f && <Flash x={cx} y={cy} k={ramp(t, f.at, f.at + 0.3, 0, 1, Easing.linear)} r={SIZES[name] * 1.55 * W * 0.6} />}
					</React.Fragment>
				);
			})}
			<Vignette strength={0.3} />
		</AbsoluteFill>
	);
};

/** conveyor strip of oversized thoughts sliding left */
export const Strip: React.FC<{t: number; t0: number; names: SpriteName[]}> = ({t, t0, names}) => {
	const dt = t - t0;
	return (
		<AbsoluteFill>
			<Paper />
			{names.map((name, i) => (
				<Sprite
					key={name}
					name={name}
					x={0.17 + i * 0.2 - dt * 0.3}
					y={0.5 + (i % 2 ? 0.02 : -0.015)}
					w={Math.min(0.3, SIZES[name] * 2.7)}
					rz={(rnd(i * 5 + t0) - 0.5) * 20}
					ry={-18 + dt * 25}
					blur={keys(dt, [0, 0.06], [10, 0])}
				/>
			))}
			{[0.31, 0.72, 0.55, 0.12].map((x, i) => (
				<div key={i} style={{position: 'absolute', left: (x - dt * 0.05) * W, top: (0.25 + rnd(i + 9) * 0.55) * H, width: 7, height: 7, borderRadius: 4, background: C.red}} />
			))}
			<Vignette strength={0.25} />
		</AbsoluteFill>
	);
};

// scattered landing spots after the explode, seeded
const SCATTER = RING.map((_, i) => ({
	x: 0.1 + rnd(i * 13 + 1) * 0.8,
	y: 0.12 + rnd(i * 7 + 3) * 0.76,
	rz: (rnd(i * 3 + 5) - 0.5) * 50,
}));
// ink hits: which thought gets blacked out, and when (on the score's hits)
const HITS: {i: number; at: number}[] = [
	{i: 6, at: 12.7}, // heart
	{i: 8, at: 12.85}, // pencil
	{i: 2, at: 13.0}, // neuron
	{i: 4, at: 13.15}, // eye
	{i: 9, at: 13.3}, // moon
	{i: 11, at: 13.45}, // bubble
];

export const Scatter: React.FC<{t: number}> = ({t}) => {
	const reform = ramp(t, 11.9, 12.08, 0, 1, EOUT5);
	const spin = (t - 11.9) * 30 + (1 - reform) * -140;
	const explode = ramp(t, 12.55, 12.78, 0, 1, EOUT5);
	const swirl = ramp(t, 13.66, 13.8, 0, 1, EIN);

	return (
		<AbsoluteFill>
			<Paper />
			<Ink x={0.5} y={0.47} r={34} seed={1} opacity={ramp(t, 12.0, 12.1) * ramp(t, 12.45, 12.6, 1, 0)} />
			{RING.map((name, i) => {
				const r = ringPos(i, spin);
				const s = SCATTER[i];
				const drift = Math.max(0, t - 12.78) * 0.01;
				const x = r.x + (s.x - r.x) * explode + Math.cos(i) * drift;
				const y = r.y + (s.y - r.y) * explode + Math.sin(i) * drift;
				const hit = HITS.find((h) => h.i === i);
				const black = hit ? ramp(t, hit.at, hit.at + 0.08) : 0;
				const moving = explode > 0 && explode < 0.85;
				return (
					<Sprite
						key={name}
						name={name}
						x={x + (x - 0.5) * swirl * 0.4}
						y={y}
						w={SIZES[name] * (1.55 - explode * 0.55)}
						rz={s.rz * explode + Math.sin(t * 2 + i) * 6}
						ry={Math.sin(t * 2.5 + i) * 25}
						blur={(1 - reform) * 14 + (moving ? 5 : 0) + swirl * 8}
						black={black}
						opacity={1 - swirl * 0.6}
					/>
				);
			})}
			{HITS.map((h, k) => {
				const s = SCATTER[h.i];
				return <Ink key={k} x={s.x + 0.01} y={s.y} r={SIZES[RING[h.i]] * W * 0.42} p={ramp(t, h.at, h.at + 0.08)} seed={k} stretch={1 + (k % 2) * 0.4} rot={k * 40} opacity={0.92} />;
			})}
			{/* explode swoosh + brush marks */}
			<Pen d={`M ${0.15 * W} ${0.22 * H} C ${0.4 * W} ${0.05 * H}, ${0.9 * W} ${0.2 * H}, ${0.88 * W} ${0.52 * H} C ${0.86 * W} ${0.7 * H}, ${0.55 * W} ${0.72 * H}, ${0.42 * W} ${0.66 * H}`} p={ramp(t, 12.52, 12.72)} tail={0.4} width={10} color="#1a1a1a" opacity={ramp(t, 12.72, 12.85, 0.85, 0)} />
			<Pen d={`M ${0.06 * W} ${0.86 * H} C ${0.1 * W} ${0.78 * H}, ${0.16 * W} ${0.9 * H}, ${0.22 * W} ${0.84 * H}`} p={ramp(t, 13.28, 13.4)} width={26} color="#121212" />
			<Pen d={`M ${0.3 * W} ${0.9 * H} c 30 -60, 80 -40, 60 10 c -20 40, 40 30, 60 -10`} p={ramp(t, 13.3, 13.42)} width={6} color="#121212" />
			{/* "through" arrives under a redaction bar */}
			{t > 13.58 && (
				<div style={{position: 'absolute', left: 0.24 * W, top: 0.62 * H}}>
					<TypeLine t={t} words={[{w: 'through', at: 13.58}]} size={52} color={C.ink} />
					<div style={{position: 'absolute', left: ramp(t, 13.58, 13.7, 120, 230, EOUT), top: 0, width: 150, height: 56, background: '#0b0b0b'}} />
				</div>
			)}
			{/* the black brush swirl that wipes to the hand */}
			{[0, 1, 2, 3].map((k) => (
				<Pen
					key={k}
					d={`M ${(0.1 + k * 0.22) * W} ${(0.9 - k * 0.15) * H} C ${(0.3 + k * 0.1) * W} ${(0.4 + k * 0.05) * H}, ${(0.5 - k * 0.1) * W} ${(0.3 + k * 0.1) * H}, ${(0.7 + k * 0.05) * W} ${(0.2 + k * 0.12) * H}`}
					p={ramp(t, 13.66 + k * 0.02, 13.79)}
					tail={0.5}
					width={24 + k * 10}
					color="#0e0e0e"
				/>
			))}
			<AbsoluteFill style={{background: '#0e0e0e', opacity: ramp(t, 13.74, 13.8)}} />
			<Vignette strength={0.3 + swirl * 0.5} />
		</AbsoluteFill>
	);
};
