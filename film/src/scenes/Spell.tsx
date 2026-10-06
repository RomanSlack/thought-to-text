import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {C, FPS, H, SpriteName, W} from '../theme';
import {fonts} from '../components/fonts';
import {Caret, EIN, EIO, EOUT, loopPath, Night, Paper, Pen, ramp, rnd, sans, Sprite, Vignette} from '../components/kit';

// T E X T, one letter per cut, each carried by a thought
const LETTERS: {ch: string; at: number; x: number; obj: SpriteName}[] = [
	{ch: 'T', at: 16.05, x: 0.09, obj: 'brain'},
	{ch: 'E', at: 16.35, x: 0.36, obj: 'chip'},
	{ch: 'X', at: 16.65, x: 0.63, obj: 'cursor'},
	{ch: 'T', at: 16.95, x: 0.9, obj: 'tile'},
];

export const Spell: React.FC<{t: number}> = ({t}) => {
	const idx = LETTERS.filter((l) => t >= l.at).length - 1;
	const cur = LETTERS[idx];
	const dt = t - cur.at;
	const onRed = idx === 2;
	const sp = spring({frame: Math.round(dt * FPS), fps: FPS, config: {damping: 9, stiffness: 260}});

	let bg: React.ReactNode;
	if (idx === 0) bg = <><Paper dim={ramp(dt, 0.12, 0.16, 0, 0.35)} /><Vignette strength={ramp(dt, 0.12, 0.16, 0.2, 0.95)} inner={20} /></>;
	else if (idx === 1)
		bg = (
			<>
				<Night />
				<div style={{position: 'absolute', left: W / 2 - 330, top: H * 0.48 - 330, width: 660, height: 660, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,30,30,0.95) 0%, rgba(160,10,20,0.6) 35%, rgba(0,0,0,0) 70%)', opacity: ramp(dt, 0.08, 0.15) * ramp(dt, 0.22, 0.3, 1, 0.6)}} />
			</>
		);
	else if (idx === 2)
		bg = <AbsoluteFill style={{background: dt < 0.12 ? '#d11d1f' : 'radial-gradient(ellipse at 50% 50%, #7a1018 0%, #3a080c 60%, #160406 100%)'}} />;
	else bg = <Night />;

	return (
		<AbsoluteFill>
			{bg}
			<Sprite name={cur.obj} x={0.5} y={0.48} w={cur.obj === 'cursor' ? 0.1 : 0.14} scale={0.8 + 0.2 * sp} rz={(rnd(idx) - 0.5) * 24 + dt * 20} ry={-20 + dt * 60} rx={8} depth={12} />
			{LETTERS.slice(0, idx + 1).map((l, i) => {
				const fresh = i === idx && dt < 0.09;
				const color = fresh || onRed ? C.cyan : idx === 0 ? C.ink : C.text;
				return (
					<div key={i} style={{position: 'absolute', left: l.x * W, top: 0.5 * H, transform: `translate(-50%,-50%) scale(${i === idx ? 1.18 - 0.18 * sp : 1})`, ...sans(96, 500), color, textShadow: idx > 0 ? `0 0 20px ${fresh || onRed ? 'rgba(63,214,239,0.6)' : 'rgba(255,240,230,0.35)'}` : undefined}}>
						{l.ch}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- coda 17.2 - 20.46
// scattered glyphs drift from where the thought threw them into a loose typed line
const GLYPHS = [
	{ch: 'T', from: [0.16, 0.74, 160], to: [0.335, 0.5, -4]},
	{ch: 'E', from: [0.58, 0.84, 75], to: [0.445, 0.508, 3]},
	{ch: 'X', from: [0.42, 0.14, -120], to: [0.555, 0.495, -2]},
	{ch: 'T', from: [0.84, 0.3, -70], to: [0.665, 0.503, 5]},
] as const;
const DOTS = [
	[0.12, 0.42, 0.33, 0.58], [0.45, 0.33, 0.47, 0.42], [0.86, 0.36, 0.72, 0.4], [0.7, 0.86, 0.66, 0.62], [0.06, 0.6, 0.27, 0.45],
];
const LOOPS = [
	{g: 0, at: 17.55, s: 0.6}, {g: 2, at: 17.62, s: 0.5}, {g: 1, at: 17.7, s: 0.5},
	{g: 0, at: 19.5, s: 1}, {g: 3, at: 19.65, s: 1.1}, {g: 1, at: 19.8, s: 1.3}, {g: 2, at: 19.95, s: 1.4}, {g: 0, at: 20.1, s: 1.8}, {g: 3, at: 20.2, s: 1.6},
];

export const Coda: React.FC<{t: number}> = ({t}) => {
	const settle = ramp(t, 17.45, 19.6, 0, 1, EIO);
	const push = ramp(t, 20.18, 20.46, 0, 1, EIN);
	const pos = (g: (typeof GLYPHS)[number], i: number) => {
		const wob = (1 - settle) * 0.012;
		return {
			x: g.from[0] + (g.to[0] - g.from[0]) * settle + Math.sin(t * 1.3 + i) * wob,
			y: g.from[1] + (g.to[1] - g.from[1]) * settle + Math.cos(t * 1.1 + i) * wob,
			r: g.from[2] + (g.to[2] - g.from[2]) * settle,
		};
	};

	if (t < 17.38) {
		// huge out-of-focus brush stroke, then the page
		return (
			<AbsoluteFill>
				<Paper />
				<div style={{position: 'absolute', left: 0.12 * W, top: -0.32 * H, filter: 'blur(26px)', transform: `rotate(${-8 + (t - 17.2) * 20}deg) scale(${1.1 + (t - 17.2) * 0.6})`, opacity: 0.9}}>
					<span style={{fontFamily: fonts.sig, fontSize: 1500, color: '#111', lineHeight: 1}}>T</span>
				</div>
				{[0.1, 0.4, 0.75].map((x, i) => (
					<div key={i} style={{position: 'absolute', left: x * W, top: (0.6 + i * 0.1) * H, width: 50, height: 50, borderRadius: '50%', background: '#222', filter: 'blur(14px)', opacity: 0.6}} />
				))}
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{transform: `scale(${1 + push * 0.55})`, transformOrigin: '50% 50%'}}>
				{DOTS.map(([x0, y0, x1, y1], i) => (
					<div key={i} style={{position: 'absolute', left: (x0 + (x1 - x0) * settle) * W, top: (y0 + (y1 - y0) * settle) * H, width: 11, height: 11, borderRadius: '50%', background: C.ink, opacity: 0.85}} />
				))}
				{GLYPHS.map((g, i) => {
					const p = pos(g, i);
					return (
						<div key={i} style={{position: 'absolute', left: p.x * W, top: p.y * H, transform: `translate(-50%,-50%) rotate(${p.r}deg)`, ...sans(104, 500), color: C.ink}}>
							{g.ch}
						</div>
					);
				})}
				{/* quick red scribbles as the letters land, then loops circling them toward the end */}
				{LOOPS.map((l, i) => {
					const p = pos(GLYPHS[l.g], l.g);
					const k = ramp(t, l.at, l.at + 0.16, 0, 1, EOUT);
					return (
						<Pen
							key={i}
							d={loopPath(p.x * W + (rnd(i) - 0.5) * 30, p.y * H + (rnd(i + 5) - 0.5) * 30, 46 * l.s + 26, 70 * l.s + 10, (rnd(i * 3) - 0.5) * 140, i * 17, 1.1)}
							p={k}
							color={C.red}
							width={3.2}
							opacity={ramp(t, l.at + 0.5, l.at + 0.8, 0.9, l.at > 19 ? 0.75 : 0)}
						/>
					);
				})}
				{t > 19.2 && <Caret t={t} from={19.2} x={0.715} y={0.505} h={92} color={C.ink} />}
			</AbsoluteFill>
			<Vignette strength={0.28} />
		</AbsoluteFill>
	);
};

