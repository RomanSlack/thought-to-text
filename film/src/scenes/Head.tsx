import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, H, W} from '../theme';
import {Caret, EOUT, keys, loopPath, Night, Pen, ramp, TypeLine, Vignette} from '../components/kit';

// implant point in head.jpg (2048x1536) at (1377, 627)
const IMPLANT = {x: 1377 / 2048, y: 627 / 1536};

/** blurred chroma blob snapping into the thermal figure, ~0.3s */
export const thermalFilter = (t: number, t0: number) => {
	const k = ramp(t, t0, t0 + 0.32, 0, 1, EOUT);
	return `blur(${(1 - k) * 55}px) hue-rotate(${(1 - k) * -75}deg) saturate(${1 + (1 - k) * 0.6}) contrast(${1 + (1 - k) * 0.2})`;
};

export const Head: React.FC<{t: number}> = ({t}) => {
	const lift = ramp(t, 5.68, 6.1); // background lifts to light at the end
	const dark = ramp(t, 5.9, 6.12); // figure inverts to a dark cut-out
	const bg = lift < 0.5 ? mixHex('#141414', C.mauve, lift * 2) : mixHex(C.mauve, '#cfc9cb', (lift - 0.5) * 2);
	const textColor = dark > 0.5 ? '#3a3034' : C.text;

	// "thought" pulse from the implant when the VO says "think" (5.52)
	const pulse = Math.max(ramp(t, 4.2, 4.3) * ramp(t, 4.3, 4.6, 1, 0), ramp(t, 5.5, 5.58) * ramp(t, 5.58, 6.0, 1, 0));
	const rings = [5.52, 5.64, 5.76].map((a) => ramp(t, a, a + 0.5, 0, 1, EOUT));

	const second = t >= 5.15;

	return (
		<AbsoluteFill style={{background: bg}}>
			{lift === 0 && <Night />}
			<AbsoluteFill style={{transform: `scale(${keys(t, [3.8, 6.2], [1.05, 1.0])})`}}>
				<Img
					src={staticFile('img/head.jpg')}
					style={{
						width: W,
						height: H,
						objectFit: 'cover',
						mixBlendMode: lift > 0 ? 'screen' : 'normal',
						filter: `${thermalFilter(t, 3.8)} brightness(${1 - dark * 0.55}) sepia(${dark * 0.4})`,
					}}
				/>
			</AbsoluteFill>
			{/* dark cut-out version at the end (figure goes dark on the light ground) */}
			{dark > 0 && (
				<AbsoluteFill style={{opacity: dark * 0.85}}>
					<Img src={staticFile('img/head.jpg')} style={{width: W, height: H, objectFit: 'cover', filter: 'grayscale(1) invert(1) contrast(2.2) sepia(0.25)', mixBlendMode: 'multiply'}} />
				</AbsoluteFill>
			)}

			{/* implant glow + thought ripples */}
			<div
				style={{
					position: 'absolute',
					left: IMPLANT.x * W - 160,
					top: IMPLANT.y * H - 160,
					width: 320,
					height: 320,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255,250,225,1) 0%, rgba(255,214,120,0.6) 18%, rgba(255,160,60,0) 60%)',
					opacity: 0.25 + pulse * 0.75,
					transform: `scale(${0.6 + pulse * 0.7})`,
					mixBlendMode: 'screen',
				}}
			/>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{rings.map((k, i) =>
					k > 0 && k < 1 ? (
						<circle key={i} cx={IMPLANT.x * W} cy={IMPLANT.y * H} r={30 + k * 420} fill="none" stroke="#fff6dc" strokeWidth={3 * (1 - k)} opacity={(1 - k) * 0.8} />
					) : null,
				)}
			</svg>

			{/* bokeh drifting past at the start */}
			<div style={{position: 'absolute', left: keys(t, [3.85, 4.5], [0.3, 0.16]) * W, top: 0.14 * H, width: 90, height: 90, borderRadius: '50%', background: '#e8a33a', filter: 'blur(14px)', opacity: ramp(t, 3.85, 4.0) * ramp(t, 4.4, 4.7, 1, 0)}} />
			<div style={{position: 'absolute', left: 0.36 * W, top: 0.62 * H, width: 60, height: 60, borderRadius: '50%', background: '#a3221c', filter: 'blur(12px)', opacity: ramp(t, 4.0, 4.1) * ramp(t, 4.3, 4.5, 1, 0)}} />

			{/* orbit line wraps the head */}
			<Pen d={loopPath(0.68 * W, 0.27 * H, 0.2 * W, 0.06 * H, -16, 11, 1.0)} p={ramp(t, 4.72, 5.0)} tail={0.55} color="#fff8ee" width={5} glow={8} opacity={ramp(t, 5.0, 5.12, 1, 0)} />
			<Pen d={`M ${0.66 * W} ${0.24 * H} C ${0.72 * W} ${0.2 * H}, ${0.76 * W} ${0.21 * H}, ${0.79 * W} ${0.24 * H}`} p={ramp(t, 4.45, 4.62)} tail={0.6} color="#fff8ee" width={4} glow={6} opacity={ramp(t, 4.6, 4.7, 1, 0)} />

			{/* captions, synced to the VO */}
			<div style={{position: 'absolute', left: 0.075 * W, top: 0.48 * H}}>
				{!second ? (
					<TypeLine t={t} words={[{w: 'you', at: 3.86}, {w: 'dont.', at: 4.02}]} size={64} color={textColor} glow />
				) : (
					<TypeLine t={t} words={[{w: 'you', at: 5.15}, {w: 'just', at: 5.3}, {w: 'think', at: 5.52}, {w: 'it.', at: 5.8}]} size={64} color={textColor} glow={dark < 0.5} />
				)}
			</div>
			{t > 4.02 && t < 5.1 && <Caret t={t} from={4.02} x={0.24} y={0.505} h={58} />}

			<Vignette strength={lift > 0 ? 0.2 : 0.5} />
		</AbsoluteFill>
	);
};

export function mixHex(a: string, b: string, k: number) {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}
