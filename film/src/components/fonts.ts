import {loadFont as loadSans} from '@remotion/google-fonts/GoogleSans';
import {loadFont as loadSig} from '@remotion/google-fonts/HerrVonMuellerhoff';
import {loadFont as loadScrawl} from '@remotion/google-fonts/ReenieBeanie';

// Google Sans: the rounded geometric sans the reference is cut in.
const sans = loadSans('normal', {weights: ['400', '500', '700'], subsets: ['latin']});
// signature-style pen layer + scrawled opener
const sig = loadSig('normal', {weights: ['400'], subsets: ['latin']});
const scrawl = loadScrawl('normal', {weights: ['400'], subsets: ['latin']});

export const fonts = {
	sans: sans.fontFamily,
	sig: sig.fontFamily,
	scrawl: scrawl.fontFamily,
};
