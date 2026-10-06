import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {C, FPS, H, W} from '../theme';
import {Caret, EOUT, EOUT5, keys, loopPath, Night, Pen, ramp, sans, Sprite, Star4, Vignette} from '../components/kit';

/** the value word: a white block lands first, then resolves into the word; caret parks at x=0.915 */
const CardWord: React.FC<{t: number; t0: number; word: string}> = ({t, t0, word}) => {
	const dt = t - t0;
	const block = dt >= 0.03 && dt < 0.13;
	const shown = dt >= 0.13;
	const k = ramp(dt, 0.13, 0.2);
	return (
		<>
			{block && (
				<div
					style={{
						position: 'absolute',
						left: 0.585 * W,
						top: 0.455 * H,
						width: (dt < 0.08 ? 0.09 : 0.03 * word.length) * W,
						height: 0.068 * H,
						background: '#f1ece8',
						filter: `blur(${dt < 0.08 ? 4 : 0}px)`,
					}}
				/>
			)}
			{shown && (
				<div style={{position: 'absolute', left: 0.585 * W, top: 0.448 * H, ...sans(108, 500), color: C.text, filter: `blur(${(1 - k) * 5}px)`, textShadow: '0 0 26px rgba(255,235,225,0.35)'}}>
					{word}
				</div>
			)}
			{dt >= 0.13 && <Caret t={t} from={t0 + 0.13} x={0.915} y={0.49} h={90} />}
			{dt >= 0.03 && dt < 0.13 && <div style={{position: 'absolute', left: 0.912 * W, top: 0.455 * H, width: 0.012 * W, height: 0.068 * H, background: '#f1ece8'}} />}
		</>
	);
};

const pop = (t: number, at: number, damping = 10) => (t < at ? 0 : spring({frame: Math.round((t - at) * FPS), fps: FPS, config: {damping, stiffness: 240}}));

// ---------------------------------------------------------------- signal.  8.3 - 9.2
export const Signal: React.FC<{t: number}> = ({t}) => {
	const flip = ramp(t, 8.92, 9.14, 0, 1, EOUT);
	return (
		<AbsoluteFill>
			<Night />
			{/* red spark behind the chip, upper right */}
			<Star4 x={0.37} y={0.27} r={0.2 * H * pop(t, 8.3, 9)} color={C.red} rot={18 + (t - 8.3) * 30 + flip * 40} glow={18} pinch={0.11} sx={1 + flip * 1.4} />
			<Sprite name="chip" x={0.27 - flip * 0.06} y={0.47 + flip * 0.03} w={0.33} rz={-14 + flip * 30} ry={-20 + (t - 8.3) * 25 - flip * 62} rx={10 + flip * 40} depth={14} scale={keys(t, [8.3, 8.42], [1.12, 1], EOUT5)} />
			{/* streaks + white zig-zag thrown on the cut */}
			{[
				[0.36, 0.1, 0.42, 0.02], [0.47, 0.22, 0.58, 0.14], [0.47, 0.62, 0.57, 0.74], [0.33, 0.82, 0.38, 0.92],
			].map(([x0, y0, x1, y1], i) => (
				<Pen key={i} d={`M ${x0 * W} ${y0 * H} L ${x1 * W} ${y1 * H}`} p={ramp(t, 8.3, 8.38)} tail={0.6} width={14} color={C.red} opacity={ramp(t, 8.38, 8.5, 1, 0)} />
			))}
			<Pen d={`M ${0.38 * W} ${0.28 * H} l 40 30 l -50 40 l 60 30 l -40 60 l 70 20`} p={ramp(t, 8.3, 8.42)} tail={0.5} width={6} color="#f3eeea" opacity={ramp(t, 8.42, 8.5, 1, 0)} />
			{/* data bits leaving the chip as it flips */}
			{[0, 1, 2, 3, 4].map((i) => {
				const k = ramp(t, 8.95 + i * 0.03, 9.18, 0, 1, EOUT);
				return k > 0 && k < 1 ? <div key={i} style={{position: 'absolute', left: (0.33 + k * (0.08 + i * 0.03)) * W, top: (0.4 - k * (0.05 + i * 0.04)) * H, width: 10, height: 10, background: i % 2 ? C.red : '#f3eeea', opacity: 1 - k}} /> : null;
			})}
			<CardWord t={t} t0={8.3} word="signal." />
			<Vignette strength={0.45} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- intention.  9.9 - 10.6
export const Intention: React.FC<{t: number}> = ({t}) => {
	const g = ramp(t, 9.9, 10.05, 0, 1, EOUT5);
	const big = ramp(t, 10.38, 10.6, 0, 1, EOUT5);
	return (
		<AbsoluteFill>
			<Night />
			{/* red ribbon: a paper strip sweeping in behind the cursor, then lunging top-right */}
			<svg width={W} height={H} style={{position: 'absolute', filter: 'drop-shadow(0 0 6px rgba(210,40,30,0.6))'}}>
				<path
					d={`M 0 ${0.86 * H} L ${0.02 * W} ${0.74 * H} L ${(0.02 + 0.2 * g) * W} ${(0.74 - 0.12 * g) * H} L ${(0.03 + 0.22 * g) * W} ${(0.8 - 0.14 * g) * H} Z`}
					fill={C.red}
				/>
				<path
					d={`M ${0.24 * W} ${0.33 * H} L ${(0.27 + 0.48 * big) * W} ${(0.22 - 0.24 * big) * H} L ${(0.33 + 0.67 * big) * W} ${(0.33 - 0.33 * big) * H} L ${0.33 * W} ${0.39 * H} Z`}
					fill={C.red}
					opacity={g}
				/>
			</svg>
			<Sprite name="cursor" x={0.27} y={0.48} w={0.24} rz={-16 + (t - 9.9) * 10} ry={24 - (t - 9.9) * 30} rx={8} depth={14} scale={keys(t, [9.9, 10.02], [1.15, 1], EOUT5)} />
			<Pen d={`M ${0.17 * W} ${0.68 * H} C ${0.21 * W} ${0.64 * H}, ${0.27 * W} ${0.68 * H}, ${0.31 * W} ${0.72 * H}`} p={ramp(t, 9.96, 10.1)} tail={0.6} width={4} color="#f3eeea" opacity={ramp(t, 10.1, 10.2, 1, 0)} />
			<CardWord t={t} t0={9.9} word="intention." />
			<Vignette strength={0.45} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- language.  11.1 - 11.9
const GLYPHS = [
	{g: 'a', x: 0.45, y: 0.72, s: 190, at: 11.2, r: -14},
	{g: '?', x: 0.36, y: 0.2, s: 170, at: 11.42, r: 12},
	{g: 'w', x: 0.19, y: 0.74, s: 150, at: 11.6, r: 8},
];

export const Language: React.FC<{t: number}> = ({t}) => {
	const ringK = ramp(t, 11.1, 11.2, 0, 1, EOUT);
	return (
		<AbsoluteFill>
			<Night />
			{t < 11.22 && (
				<svg width={W} height={H} style={{position: 'absolute', filter: 'blur(3px)'}}>
					<circle cx={W / 2} cy={H / 2} r={0.3 * H + ringK * 0.15 * H} fill="none" stroke={C.red} strokeWidth={22} strokeDasharray="3 9" opacity={1 - ramp(t, 11.15, 11.22)} />
				</svg>
			)}
			<Sprite name="bubble" x={keys(t, [11.1, 11.2], [0.5, 0.25], EOUT5)} y={0.49} w={keys(t, [11.1, 11.2], [0.09, 0.22], EOUT5)} rz={-6 + Math.sin(t * 4) * 3} ry={Math.sin(t * 3) * 18} blur={keys(t, [11.1, 11.18], [6, 0])} depth={12} />
			{GLYPHS.map((q) => {
				const s = pop(t, q.at, 8);
				return (
					<div key={q.g} style={{position: 'absolute', left: q.x * W, top: q.y * H, transform: `translate(-50%,-50%) rotate(${q.r + (1 - s) * 30}deg) scale(${s})`, ...sans(q.s, 700), color: C.red, textShadow: '0 0 18px rgba(210,40,30,0.5)'}}>
						{q.g}
					</div>
				);
			})}
			<Pen d={loopPath(0.4 * W, 0.24 * H, 0.06 * W, 0.08 * H, 20, 5, 0.55)} p={ramp(t, 11.44, 11.56)} tail={0.7} width={4} color="#f3eeea" opacity={ramp(t, 11.56, 11.7, 1, 0)} />
			<CardWord t={t} t0={11.1} word="language." />
			<Vignette strength={0.45} />
		</AbsoluteFill>
	);
};
