import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile} from 'remotion';
import {C, FPS, H, W, SpriteName} from '../theme';
import {fonts} from './fonts';

// ---------------------------------------------------------------- time helpers
export const EOUT = Easing.out(Easing.cubic);
export const EOUT5 = Easing.out(Easing.poly(5));
export const EIN = Easing.in(Easing.cubic);
export const EIO = Easing.inOut(Easing.cubic);

/** clamped interpolate over absolute seconds */
export const ramp = (t: number, t0: number, t1: number, from = 0, to = 1, easing = EOUT) =>
	interpolate(t, [t0, t1], [from, to], {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** keyframes over absolute seconds */
export const keys = (t: number, ts: number[], vs: number[], easing = EIO) =>
	interpolate(t, ts, vs, {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** seeded rng, deterministic per (seed) */
export const rnd = (seed: number) => {
	let s = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
	s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0;
	return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
};

/** hold-on-twos: animation steps at 12fps, like the reference's hand-made feel */
export const twos = (t: number) => Math.floor(t * 12) / 12;

export const px = (fx: number) => fx * W;
export const py = (fy: number) => fy * H;

// ---------------------------------------------------------------- backgrounds
export const Paper: React.FC<{dim?: number}> = ({dim = 0}) => (
	<AbsoluteFill style={{background: C.paper}}>
		<Img src={staticFile('img/paper.jpg')} style={{width: W, height: H, objectFit: 'cover', filter: `brightness(${1 - dim})`}} />
	</AbsoluteFill>
);

export const Night: React.FC<{color?: string}> = ({color = C.night}) => (
	<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${color} 0%, #0d0d0d 100%)`}} />
);

export const Vignette: React.FC<{strength?: number; color?: string; inner?: number}> = ({strength = 0.35, color = '0,0,0', inner = 45}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(${color},0) ${inner}%, rgba(${color},${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

/** per-frame film grain + dust specks. frame-seeded, so seek-safe. */
export const Grain: React.FC<{frame: number; amount?: number}> = ({frame, amount = 0.16}) => {
	const seed = Math.floor(frame / 1); // new grain every frame
	const specks = Array.from({length: 7}, (_, i) => ({
		x: rnd(seed * 31 + i) * W,
		y: rnd(seed * 17 + i * 7) * H,
		r: 1 + rnd(seed * 13 + i * 3) * 2.5,
		o: rnd(seed * 7 + i * 11) * 0.5,
	}));
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'overlay', opacity: amount * 2.2}}>
				<filter id={`grain${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed % 997} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width={W} height={H} filter={`url(#grain${seed})`} />
			</svg>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{specks.map((s, i) => (
					<circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 2 ? '#fff' : '#000'} opacity={s.o * 0.35} />
				))}
			</svg>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- sprite (3D-extruded pixel art)
export type SpriteProps = {
	name: SpriteName;
	x: number; // center, fraction of W
	y: number; // center, fraction of H
	w: number; // width, fraction of W
	rz?: number;
	rx?: number;
	ry?: number;
	scale?: number;
	opacity?: number;
	blur?: number;
	black?: number; // 0..1 ink-silhouette
	glow?: number; // 0..1 gold flash glow
	depth?: number; // extrusion layers
	motionBlurX?: number;
};

export const Sprite: React.FC<SpriteProps> = ({
	name, x, y, w, rz = 0, rx = 0, ry = 0, scale = 1, opacity = 1, blur = 0, black = 0, glow = 0, depth = 9, motionBlurX = 0,
}) => {
	const width = w * W;
	const step = width * 0.0065;
	const front = `brightness(${1 - black})${glow > 0 ? ` drop-shadow(0 0 ${30 * glow}px rgba(255,170,40,${0.9 * glow})) brightness(${1 + 0.35 * glow})` : ''}`;
	return (
		<div
			style={{
				position: 'absolute',
				left: x * W,
				top: y * H,
				width: 0,
				height: 0,
				opacity,
				filter: blur > 0.2 || motionBlurX ? `blur(${blur}px)` : undefined,
			}}
		>
			<div style={{position: 'absolute', perspective: 1800, transform: `translate(-50%, -50%) scale(${scale})`, width, left: 0, top: 0}}>
				<div style={{position: 'relative', width, transformStyle: 'preserve-3d', transform: `rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
					{Array.from({length: depth}, (_, k) => depth - 1 - k).map((i) => (
						<Img
							key={i}
							src={staticFile(`img/sprites/${name}.png`)}
							style={{
								position: i === 0 ? 'relative' : 'absolute',
								left: 0,
								top: 0,
								width,
								display: 'block',
								imageRendering: 'pixelated',
								transform: `translateZ(${-i * step}px)`,
								filter: i === 0 ? front : `brightness(${(0.42 - i * 0.012) * (1 - black)})`,
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- vector bits
/** 4-point sparkle star centered at (0,0), radius 1 */
export const starPath = (pinch = 0.18) => {
	const p = pinch;
	return `M0,-1 C${p},-${p} ${p},-${p} 1,0 C${p},${p} ${p},${p} 0,1 C-${p},${p} -${p},${p} -1,0 C-${p},-${p} -${p},-${p} 0,-1 Z`;
};

export const Star4: React.FC<{x: number; y: number; r: number; color: string; rot?: number; glow?: number; pinch?: number; opacity?: number; sx?: number}> = ({
	x, y, r, color, rot = 0, glow = 0, pinch = 0.16, opacity = 1, sx = 1,
}) => (
	<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
		<g transform={`translate(${x * W},${y * H}) rotate(${rot}) scale(${r * sx},${r})`}>
			{glow > 0 && <path d={starPath(pinch)} fill={color} transform="scale(1.04)" style={{filter: `blur(${Math.max(0.004, glow / r)}px)`}} opacity={0.9} />}
			<path d={starPath(pinch)} fill={color} />
		</g>
	</svg>
);

/** stroke that draws on: p 0..1. d in px space */
export const Pen: React.FC<{d: string; p: number; color?: string; width?: number; opacity?: number; glow?: number; tail?: number}> = ({
	d, p, color = C.ink, width = 3, opacity = 1, glow = 0, tail,
}) => {
	if (p <= 0) return null;
	const start = tail !== undefined ? Math.max(0, p - tail) : 0;
	return (
		<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
			<path
				d={d}
				pathLength={1}
				fill="none"
				stroke={color}
				strokeWidth={width}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={`${p - start} 2`}
				strokeDashoffset={-start}
				style={glow ? {filter: `drop-shadow(0 0 ${glow}px ${color})`} : undefined}
			/>
		</svg>
	);
};

/** hand-drawn ellipse loop (red pen annotation). cx, cy, rx, ry in px. seeded wobble */
export const loopPath = (cx: number, cy: number, rx: number, ry: number, rot: number, seed: number, turns = 1.15) => {
	const n = 48;
	const pts: string[] = [];
	for (let i = 0; i <= n * turns; i++) {
		const a = (i / n) * Math.PI * 2;
		const wob = 1 + (rnd(seed + i) - 0.5) * 0.08 + i * 0.002;
		const lx = Math.cos(a) * rx * wob;
		const ly = Math.sin(a) * ry * wob;
		const cr = Math.cos((rot * Math.PI) / 180);
		const sr = Math.sin((rot * Math.PI) / 180);
		pts.push(`${(cx + lx * cr - ly * sr).toFixed(1)},${(cy + lx * sr + ly * cr).toFixed(1)}`);
	}
	return `M${pts.join(' L')}`;
};

/** black spray-paint blob. x,y fractions, r px */
export const Ink: React.FC<{x: number; y: number; r: number; p?: number; stretch?: number; rot?: number; seed?: number; opacity?: number}> = ({
	x, y, r, p = 1, stretch = 1, rot = 0, seed = 1, opacity = 1,
}) => {
	if (p <= 0) return null;
	const rr = r * (0.4 + 0.6 * p);
	return (
		<div
			style={{
				position: 'absolute',
				left: x * W - rr * 1.5,
				top: y * H - rr * 1.5,
				width: rr * 3,
				height: rr * 3,
				transform: `rotate(${rot}deg) scaleX(${stretch})`,
				filter: `url(#spray${seed % 3})`,
				opacity,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(8,8,8,1) 0%, rgba(8,8,8,0.97) 30%, rgba(8,8,8,0.55) 45%, rgba(8,8,8,0) 66%)',
				}}
			/>
		</div>
	);
};

/** global svg filter defs (spray edges) */
export const Defs: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		{[0, 1, 2].map((i) => (
			<filter key={i} id={`spray${i}`} x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency={0.06 + i * 0.02} numOctaves={3} seed={i * 7 + 3} result="n" />
				<feDisplacementMap in="SourceGraphic" in2="n" scale={38} xChannelSelector="R" yChannelSelector="G" />
			</filter>
		))}
	</svg>
);

// ---------------------------------------------------------------- type
export const sans = (size: number, weight = 500): React.CSSProperties => ({
	fontFamily: fonts.sans,
	fontSize: size,
	fontWeight: weight,
	letterSpacing: '-0.02em',
	lineHeight: 1,
	whiteSpace: 'pre',
});

/** words that appear on given absolute times; reveals each with a 2-frame blur snap */
export const TypeLine: React.FC<{
	t: number;
	words: {w: string; at: number; style?: React.CSSProperties}[];
	size: number;
	color: string;
	weight?: number;
	glow?: boolean;
}> = ({t, words, size, color, weight = 500, glow}) => (
	<span style={{...sans(size, weight), color, textShadow: glow ? `0 0 ${size * 0.25}px rgba(255,240,230,0.35)` : undefined}}>
		{words.map(({w, at, style}, i) => {
			if (t < at) return null;
			const k = ramp(t, at, at + 2 / FPS);
			return (
				<span key={i} style={{display: 'inline-block', filter: `blur(${(1 - k) * 6}px)`, opacity: 0.4 + 0.6 * k, ...style}}>
					{(i ? ' ' : '') + w}
				</span>
			);
		})}
	</span>
);

/** caret: thin bar, blinks on twos-ish */
export const Caret: React.FC<{t: number; x: number; y: number; h: number; color?: string; from?: number}> = ({t, x, y, h, color = C.text, from = 0}) => {
	const on = Math.floor((t - from) * 3) % 2 === 0;
	if (!on) return null;
	return <div style={{position: 'absolute', left: x * W, top: y * H - h / 2, width: h * 0.075, height: h, background: color, boxShadow: `0 0 10px ${color}`}} />;
};
