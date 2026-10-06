// Single source of truth for timing and look.
// Beat map is the reference teardown's (../TEARDOWN.md) re-skinned to "thought to text".
// Every scene works in ABSOLUTE seconds so numbers can be checked against the storyboard directly.

export const FPS = 24;
export const W = 1920;
export const H = 1440; // 4:3, like the reference
export const DURATION_S = 20.46;
export const TOTAL_FRAMES = Math.round(DURATION_S * FPS);

export const C = {
	paper: '#d9d9da',
	night: '#141414',
	ink: '#2e2220', // brown-black type on paper
	text: '#ebe7e4', // type on dark
	red: '#d22a1e',
	deepRed: '#8f0f1c',
	cyan: '#3fd6ef',
	blue: '#1d46d6',
	gold: '#f2c12e',
	amber: '#ff9c2a',
	mauve: '#6a5258',
};

// scene windows [start, end) in seconds
export const SCENES = {
	open: [0, 2.0], // question builds
	question: [2.0, 3.8], // question lands, vignette closes
	head: [3.8, 6.2], // "you dont." / "you just think it."
	ring: [6.2, 8.3], // the inventory of thoughts
	signal: [8.3, 9.2],
	strip1: [9.2, 9.9],
	intention: [9.9, 10.6],
	strip2: [10.6, 11.1],
	language: [11.1, 11.9],
	scatter: [11.9, 13.8],
	hand: [13.8, 15.9],
	flick: [15.9, 16.05],
	spell: [16.05, 17.2], // T E X T
	coda: [17.2, DURATION_S],
} as const;

export type SceneKey = keyof typeof SCENES;

// the 13 sprites (public/img/sprites/<name>.png), ring order clockwise from top
export const RING = [
	'brain', 'chip', 'neuron', 'bulb', 'eye', 'tile', 'heart',
	'keyboard', 'pencil', 'moon', 'robohand', 'bubble', 'headset',
] as const;
export type SpriteName = (typeof RING)[number] | 'cursor';
