import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import {C, FPS, H, W} from '../theme';
import {fonts} from '../components/fonts';
import {EIN, EOUT, EOUT5, keys, Paper, Pen, ramp, sans, Sprite, Star4, TypeLine, Vignette} from '../components/kit';

// VO "How do you speak, when you can't say a word?" starts at 0.05s ("word?" @1.67)
const SENTENCE = (t: number, youHi: number) => [
	{w: 'how', at: 0.95},
	{w: 'do', at: 0.95},
	{w: 'you', at: 0.95, style: youHi > 0 ? {color: '#fff', textShadow: `0 0 18px rgba(255,255,255,${0.6 * youHi})`, fontWeight: 700} : undefined},
	{w: 'speak,', at: 0.95},
	{w: 'when', at: 1.18},
	{w: 'you', at: 1.34},
	{w: "can't", at: 1.5},
	{w: 'say', at: 1.66},
	{w: 'a', at: 1.8},
	{w: 'word?', at: 2.08},
];

const Guides: React.FC<{y0: number; y1: number; o?: number}> = ({y0, y1, o = 1}) => (
	<svg width={W} height={H} style={{position: 'absolute', opacity: o}}>
		{[y0, y1].map((y) => (
			<line key={y} x1={0} x2={W} y1={y * H} y2={y * H} stroke={C.red} strokeWidth={2.5} strokeDasharray="14 10" opacity={0.85} />
		))}
	</svg>
);

/** dotted selection box with corner handles, like a design tool */
const SelectBox: React.FC<{x0: number; y0: number; x1: number; y1: number; o?: number}> = ({x0, y0, x1, y1, o = 1}) => {
	const hs = 10;
	const corners = [
		[x0, y0], [x1, y0], [x0, y1], [x1, y1],
	];
	return (
		<svg width={W} height={H} style={{position: 'absolute', opacity: o}}>
			<rect x={x0 * W} y={y0 * H} width={(x1 - x0) * W} height={(y1 - y0) * H} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="3 5" />
			<line x1={x0 * W} x2={x0 * W} y1={y0 * H - 14} y2={y1 * H + 14} stroke={C.ink} strokeWidth={4} />
			<line x1={x1 * W} x2={x1 * W} y1={y0 * H - 14} y2={y1 * H + 14} stroke={C.ink} strokeWidth={4} />
			{corners.map(([x, y], i) => (
				<rect key={i} x={x * W - hs / 2} y={y * H - hs / 2} width={hs} height={hs} fill="#fff" stroke={C.ink} strokeWidth={2} />
			))}
		</svg>
	);
};

export const Opening: React.FC<{t: number}> = ({t}) => {
	// ---------- 0.00 - 0.95: the hook, swapped every ~0.15s
	const phase = t < 0.15 ? 0 : t < 0.3 ? 1 : t < 0.45 ? 2 : t < 0.6 ? 3 : t < 0.78 ? 4 : t < 0.95 ? 5 : 6;
	const bigY = 0.47;

	return (
		<AbsoluteFill>
			<Paper />
			<Vignette strength={0.28} />

			{phase === 0 && (
				<div style={{position: 'absolute', left: 0.27 * W, top: 0.08 * H, transform: 'rotate(-6deg)', clipPath: `inset(0 ${100 - ramp(t, 0, 0.12, 40, 100)}% 0 0)`}}>
					<span style={{fontFamily: fonts.scrawl, fontSize: 470, color: C.ink, lineHeight: 1}}>How</span>
				</div>
			)}
			{phase === 0 && <Pen d={`M ${0.22 * W} ${0.62 * H} C ${0.4 * W} ${0.55 * H}, ${0.55 * W} ${0.57 * H}, ${0.66 * W} ${0.52 * H}`} p={ramp(t, 0.0, 0.14, 0.3, 1)} width={5} />}

			{(phase === 1 || phase === 2) && (
				<>
					<Guides y0={bigY - 0.1} y1={bigY + 0.075} />
					<div
						style={{
							position: 'absolute',
							left: (phase === 1 ? 0.3 : keys(t, [0.3, 0.36], [0.3, 0.02], EOUT5)) * W,
							top: (bigY - 0.15) * H,
							...sans(330, 700),
							color: '#111',
						}}
					>
						how
					</div>
				</>
			)}
			{phase === 2 && (
				<>
					<div style={{position: 'absolute', left: 0.43 * W, top: (bigY - 0.08) * H, width: ramp(t, 0.3, 0.36, 0, 0.26, EOUT5) * W, height: 0.15 * H, background: '#0b0b0b'}} />
					<div style={{position: 'absolute', left: 0.72 * W, top: (bigY - 0.15) * H, ...sans(330, 700), color: '#111', clipPath: `inset(0 ${100 - ramp(t, 0.33, 0.4) * 100}% 0 0)`}}>
						do you
					</div>
					<Pen d={`M ${0.4 * W} ${0.68 * H} L ${0.42 * W} ${0.61 * H} C ${0.55 * W} ${0.6 * H}, ${0.7 * W} ${0.6 * H}, ${0.82 * W} ${0.58 * H}`} p={ramp(t, 0.31, 0.44)} width={4} />
				</>
			)}
			{phase === 3 && (
				<>
					<Guides y0={bigY - 0.1} y1={bigY + 0.075} />
					<div style={{position: 'absolute', left: 0, width: W, textAlign: 'center', top: (bigY - 0.15) * H, ...sans(330, 700), color: '#111', transform: `scale(${keys(t, [0.45, 0.6], [1.0, 0.94])})`}}>
						do you
					</div>
				</>
			)}

			{/* collapse: the big words fall into a small line inside a selection box */}
			{phase === 4 && (
				<div style={{position: 'absolute', left: 0.04 * W, top: 0.47 * H, filter: `blur(${keys(t, [0.6, 0.75], [9, 3])}px)`, color: C.ink}}>
					<span style={sans(54)}>how do you speak</span>
				</div>
			)}
			{phase === 5 && (
				<>
					<SelectBox x0={0.03} y0={0.455} x1={0.33} y1={0.53} />
					<div style={{position: 'absolute', left: 0.045 * W, top: 0.47 * H, filter: `blur(${keys(t, [0.78, 0.86], [3, 0])}px)`, color: C.ink}}>
						<span style={sans(54)}>how do you speak</span>
					</div>
					{/* signature scrawl writes across */}
					<div style={{position: 'absolute', left: 0.12 * W, top: 0.53 * H, clipPath: `inset(-20% ${100 - ramp(t, 0.8, 0.95, 0, 100, EOUT)}% -20% 0)`}}>
						<span style={{fontFamily: fonts.sig, fontSize: 210, color: C.ink, lineHeight: 1}}>Speak</span>
					</div>
					{/* ghost of a huge out-of-focus scrawl, top right */}
					<div style={{position: 'absolute', left: 0.55 * W, top: -0.08 * H, filter: 'blur(16px)', opacity: 0.32, transform: 'rotate(-12deg)'}}>
						<span style={{fontFamily: fonts.sig, fontSize: 620, color: '#333'}}>Sp</span>
					</div>
				</>
			)}

			{/* the sentence types on with the VO; pen marks travel over it */}
			{phase === 6 && (
				<>
					<div style={{position: 'absolute', left: 0.03 * W, top: 0.477 * H}}>
						<TypeLine t={t} words={SENTENCE(t, 0)} size={66} color={C.ink} />
					</div>
					<div style={{position: 'absolute', left: 0.5 * W, top: 0.38 * H, filter: 'blur(14px)', opacity: ramp(t, 0.95, 1.3, 0.35, 0), transform: 'rotate(-10deg)'}}>
						<span style={{fontFamily: fonts.sig, fontSize: 520, color: '#333'}}>S</span>
					</div>
					<Pen
						d={`M ${0.6 * W} ${0.44 * H} c 10 -40, 30 -60, 18 20 c -8 40, 30 30, 50 0 c 15 -25, 40 10, 25 25`}
						p={ramp(t, 1.0, 1.18)}
						tail={0.6}
						width={4}
						opacity={ramp(t, 1.18, 1.3, 1, 0)}
					/>
					<Pen
						d={`M ${0.42 * W} ${0.47 * H} C ${0.48 * W} ${0.43 * H}, ${0.56 * W} ${0.47 * H}, ${0.5 * W} ${0.52 * H} C ${0.46 * W} ${0.56 * H}, ${0.44 * W} ${0.6 * H}, ${0.43 * W} ${0.64 * H}`}
						p={ramp(t, 1.3, 1.46)}
						tail={0.55}
						width={5}
						opacity={ramp(t, 1.46, 1.55, 1, 0)}
					/>
					<Pen
						d={`M ${0.035 * W} ${0.455 * H} q -14 -22, 6 -20 L ${0.52 * W} ${0.452 * H}`}
						p={ramp(t, 1.5, 1.66)}
						tail={0.5}
						width={4}
						opacity={ramp(t, 1.66, 1.75, 1, 0)}
					/>
				</>
			)}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 2.0 - 3.8
const POPS = [
	{name: 'tile', x: 0.53, y: 0.29, w: 0.05, at: 2.08, rz: -14},
	{name: 'chip', x: 0.69, y: 0.27, w: 0.055, at: 2.12, rz: 12},
	{name: 'bulb', x: 0.63, y: 0.63, w: 0.035, at: 2.16, rz: 8},
	{name: 'cursor', x: 0.76, y: 0.74, w: 0.04, at: 2.2, rz: -6},
] as const;

export const Question: React.FC<{t: number}> = ({t}) => {
	// cyan flare bursts in and settles into a huge off-screen star whose arm reads as a concave wedge
	const fx = keys(t, [2.0, 2.12, 2.42], [0.1, 0.12, -0.42], EOUT);
	const fy = keys(t, [2.0, 2.12, 2.42], [0.36, 0.36, 0.5], EOUT);
	const fr = keys(t, [2.0, 2.1, 2.42, 3.8], [0.05, 0.42, 1.12, 1.06], EOUT) * H;
	const frot = keys(t, [2.0, 2.42, 3.8], [-20, 6, 10]);
	const purple = ramp(t, 3.45, 3.75);
	const close = ramp(t, 2.3, 3.55, 0, 1, EIN);
	const warm = ramp(t, 3.66, 3.76, 0, 1, EOUT);
	const textBlur = keys(t, [2.62, 2.7, 2.82], [0, 2.5, 0]);

	return (
		<AbsoluteFill>
			<Paper />
			{/* warm core flare at the very end */}
			<AbsoluteFill style={{opacity: warm, background: 'radial-gradient(ellipse 48% 52% at 55% 50%, #e9a07f 0%, #d0563c 55%, #5a0d12 85%, #120607 100%)'}} />

			{/* vignette closes in: the room goes dark around the question */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse ${85 - close * 32}% ${90 - close * 34}% at 56% 50%, rgba(25,18,20,0) ${55 - close * 10}%, rgba(25,18,20,${0.25 + close * 0.72}) 100%)`,
				}}
			/>

			{/* sentence */}
			<div style={{position: 'absolute', left: 0.03 * W, top: 0.477 * H, filter: `blur(${textBlur}px)`}}>
				<TypeLine t={t} words={SENTENCE(t, ramp(t, 3.5, 3.58))} size={66} color={warm > 0.5 ? '#2a0d0b' : C.ink} />
			</div>
			{t > 2.08 && t < 2.24 && (
				<svg width={W} height={H} style={{position: 'absolute'}}>
					<rect x={0.575 * W} y={0.455 * H} width={0.105 * W} height={0.075 * H} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="3 5" />
				</svg>
			)}

			{/* the flare / wedge: cyan rim, blue body */}
			<Star4 x={fx} y={fy} r={fr} color={C.cyan} rot={frot} glow={t < 2.4 ? 60 : 26} pinch={keys(t, [2.1, 2.42], [0.13, 0.21])} />
			<Star4
				x={fx - 0.012}
				y={fy}
				r={fr * 0.965}
				color={purple > 0 ? mix(C.blue, '#6a2fc4', purple) : C.blue}
				rot={frot}
				pinch={keys(t, [2.1, 2.42], [0.13, 0.21])}
				opacity={ramp(t, 2.14, 2.3)}
			/>

			{/* brush streaks thrown off by the flare */}
			{[
				{d: `M ${0.55 * W} ${0.16 * H} C ${0.6 * W} ${0.22 * H}, ${0.64 * W} ${0.28 * H}, ${0.7 * W} ${0.33 * H}`, w: 14, c: C.red, a: 2.0},
				{d: `M ${0.62 * W} ${0.76 * H} L ${0.72 * W} ${0.69 * H} L ${0.74 * W} ${0.62 * H}`, w: 12, c: C.red, a: 2.04},
				{d: `M ${0.66 * W} ${0.12 * H} L ${0.73 * W} ${0.2 * H}`, w: 4, c: C.ink, a: 2.02},
				{d: `M ${0.28 * W} ${0.82 * H} L ${0.48 * W} ${0.74 * H}`, w: 4, c: C.ink, a: 2.06},
				{d: `M ${0.78 * W} ${0.2 * H} q 20 -30, 30 10`, w: 8, c: C.red, a: 2.08},
			].map((s, i) => (
				<Pen key={i} d={s.d} p={ramp(t, s.a, s.a + 0.12)} tail={0.45} width={s.w} color={s.c} opacity={ramp(t, s.a + 0.14, s.a + 0.24, 1, 0)} />
			))}

			{/* the first thoughts pop in */}
			{POPS.map((s) => {
				const sp = spring({frame: Math.round((t - s.at) * FPS), fps: FPS, config: {damping: 11, stiffness: 220}});
				return (
					<Sprite
						key={s.name}
						name={s.name}
						x={s.x + (t - s.at) * 0.004}
						y={s.y}
						w={s.w}
						rz={s.rz + (t - 2) * 6}
						ry={Math.sin(t * 3 + s.x * 9) * 25}
						scale={t < s.at ? 0 : sp}
						opacity={ramp(t, 3.2, 3.42, 1, 0)}
						blur={keys(t, [2.62, 2.7, 2.82], [0, 3, 0])}
						depth={6}
					/>
				);
			})}

			{/* red loop over the glow, last beat */}
			<Pen
				d={`M ${0.3 * W} ${0.14 * H} C ${0.45 * W} ${0.02 * H}, ${0.62 * W} ${0.18 * H}, ${0.6 * W} ${0.33 * H} C ${0.59 * W} ${0.4 * H}, ${0.55 * W} ${0.38 * H}, ${0.57 * W} ${0.31 * H}`}
				p={ramp(t, 3.64, 3.76)}
				color={C.red}
				width={9}
				glow={6}
			/>
			<Vignette strength={0.25} />
		</AbsoluteFill>
	);
};


function mix(a: string, b: string, k: number) {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}
