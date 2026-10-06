import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, H, W} from '../theme';
import {fonts} from '../components/fonts';
import {Caret, EIN, keys, loopPath, Night, Paper, Pen, ramp, rnd, Sprite, Star4, TypeLine, Vignette} from '../components/kit';
import {mixHex, thermalFilter} from './Head';

// VO: through@14.10 one's@14.36 own@14.68 mind@14.84 straight@15.36 to@15.72 text@15.96
export const Hand: React.FC<{t: number}> = ({t}) => {
	const warm = ramp(t, 15.58, 15.84);
	const leftover = ramp(t, 13.8, 13.95, 1, 0);
	return (
		<AbsoluteFill style={{background: mixHex('#141414', '#3b2a2d', warm)}}>
			{warm === 0 && <Night />}
			{/* a few thoughts still clustered around a light, swept away as the hand resolves */}
			{leftover > 0 && (
				<>
					<div style={{position: 'absolute', left: 0.36 * W, top: 0.32 * H, width: 0.18 * W, height: 0.18 * W, borderRadius: '50%', background: 'radial-gradient(circle, #f2efe9 0%, rgba(240,235,230,0) 70%)', opacity: leftover}} />
					{(['headset', 'tile', 'robohand', 'chip'] as const).map((n, i) => (
						<Sprite key={n} name={n} x={0.38 + (i % 2) * 0.12} y={0.28 + Math.floor(i / 2) * 0.2} w={0.07} rz={(rnd(i + 40) - 0.5) * 30} opacity={leftover} depth={5} />
					))}
				</>
			)}
			<AbsoluteFill
				style={{
					transform: `translateY(${warm * 60}px) scale(${keys(t, [13.8, 15.9], [1.06, 1.0])}) rotate(${keys(t, [13.8, 15.9], [-1.5, 1])}deg)`,
					transformOrigin: '50% 100%',
				}}
			>
				<Img
					src={staticFile('img/hand.jpg')}
					style={{width: W, height: H, objectFit: 'cover', filter: `${thermalFilter(t, 13.88)} brightness(${1 - warm * 0.25})`, mixBlendMode: 'screen'}}
				/>
			</AbsoluteFill>

			{/* white arcs swirling in with the resolve */}
			<Pen d={loopPath(0.5 * W, 0.35 * H, 0.12 * W, 0.24 * H, 25, 3, 0.8)} p={ramp(t, 13.86, 14.1)} tail={0.4} width={4} color="#fff" glow={8} opacity={ramp(t, 14.1, 14.2, 1, 0)} />
			<Pen d={loopPath(0.47 * W, 0.4 * H, 0.08 * W, 0.2 * H, -15, 9, 0.7)} p={ramp(t, 13.9, 14.12)} tail={0.4} width={3} color="#fff" glow={6} opacity={ramp(t, 14.12, 14.2, 1, 0)} />

			{/* sparks, and tiny letters lifting off the fingertips: thought becoming text */}
			{Array.from({length: 9}, (_, i) => {
				const born = 14.15 + i * 0.17;
				const k = ramp(t, born, born + 0.9, 0, 1, EIN);
				if (k <= 0 || k >= 1) return null;
				const x0 = 0.42 + rnd(i * 3) * 0.2;
				const letter = i % 3 === 1;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: (x0 + Math.sin(i + k * 3) * 0.01) * W,
							top: (0.24 - k * 0.14) * H,
							color: '#fff6ea',
							fontFamily: fonts.sans,
							fontSize: letter ? 26 : 0,
							width: letter ? undefined : 5,
							height: letter ? undefined : 5,
							borderRadius: 3,
							background: letter ? undefined : '#fff6ea',
							opacity: (1 - k) * 0.9,
							textShadow: '0 0 8px #fff',
						}}
					>
						{letter ? 'txt'[i % 3] : ''}
					</div>
				);
			})}

			{/* captions split around the hand */}
			<div style={{position: 'absolute', right: W * (1 - 0.365), top: 0.48 * H, textAlign: 'right'}}>
				<TypeLine t={t} words={[{w: 'through', at: 13.82}, {w: 'ones', at: 14.36}]} size={64} color={warm > 0.6 ? '#d9cfcf' : C.text} glow />
			</div>
			<div style={{position: 'absolute', left: 0.645 * W, top: 0.48 * H}}>
				<TypeLine t={t} words={[{w: 'own', at: 14.68}, {w: 'mind,', at: 14.84}, {w: 'straight', at: 15.36}, {w: 'to', at: 15.66}]} size={64} color={warm > 0.6 ? '#d9cfcf' : C.text} glow />
			</div>
			{t > 14.42 && t < 14.68 && <div style={{position: 'absolute', left: 0.645 * W, top: 0.477 * H, width: 0.07 * W, height: 0.045 * H, background: '#f1ece8', opacity: t < 14.5 ? 1 : 0.0}} />}
			{t > 14.5 && t < 14.68 && <Caret t={t} from={14.5} x={0.65} y={0.502} h={56} />}
			<Vignette strength={0.5} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 15.9 - 16.05: red dart flick on paper
export const Flick: React.FC<{t: number}> = ({t}) => {
	const k = ramp(t, 15.9, 16.0);
	return (
		<AbsoluteFill>
			<Paper />
			<div style={{position: 'absolute', left: 0, top: 0, filter: `blur(${(1 - k) * 3}px) drop-shadow(0 6px 6px rgba(0,0,0,0.35))`}}>
				<Star4 x={0.6 - k * 0.08} y={0.58 - k * 0.1} r={0.03 * H} sx={0.35} color={C.red} rot={-55} pinch={0.2} />
			</div>
			<Vignette strength={0.25} />
		</AbsoluteFill>
	);
};
