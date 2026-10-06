import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, TOTAL_FRAMES, W} from './theme';
import {ThoughtToText} from './ThoughtToText';

export const RemotionRoot: React.FC = () => (
	<Composition id="ThoughtToText" component={ThoughtToText} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
);
