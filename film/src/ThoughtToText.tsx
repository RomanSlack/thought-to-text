import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, SCENES, SceneKey} from './theme';
import {Defs, Grain} from './components/kit';
import {Opening, Question} from './scenes/Opening';
import {Head} from './scenes/Head';
import {Ring, Scatter, Strip} from './scenes/Ring';
import {Intention, Language, Signal} from './scenes/Cards';
import {Flick, Hand} from './scenes/Hand';
import {Coda, Spell} from './scenes/Spell';

const RENDER: Record<SceneKey, React.FC<{t: number}>> = {
	open: Opening,
	question: Question,
	head: Head,
	ring: Ring,
	signal: Signal,
	strip1: ({t}) => <Strip t={t} t0={9.2} names={['bulb', 'neuron', 'heart', 'eye', 'moon']} />,
	intention: Intention,
	strip2: ({t}) => <Strip t={t} t0={10.6} names={['keyboard', 'tile', 'robohand', 'headset', 'pencil']} />,
	language: Language,
	scatter: Scatter,
	hand: Hand,
	flick: Flick,
	spell: Spell,
	coda: Coda,
};

// every visual is a pure function of the frame: t (absolute seconds) picks the scene
export const ThoughtToText: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const key = (Object.keys(SCENES) as SceneKey[]).find((k) => t >= SCENES[k][0] && t < SCENES[k][1]) ?? 'coda';
	const Scene = RENDER[key];
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<Defs />
			<Scene t={t} />
			<Grain frame={frame} amount={0.15} />
			<Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
