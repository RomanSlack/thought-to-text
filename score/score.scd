// "Thought to Text" - score for the BCI re-skin. Same beat map as the reference edit (../reference/TEARDOWN.md).
// Hand-placed to the cut list in ../film/src/theme.ts: hits on cuts, quiet where the picture breathes.
// Key: F# major / D# minor pentatonic (matches the original's chroma). Groove sections at 108 BPM.
// Renders offline (NRT) to music.wav

~root = thisProcess.nowExecutingPath.dirname;
// set SC_PREFIX if SuperCollider lives somewhere other than /usr (e.g. a portable install)
~sc = "SC_PREFIX".getenv ? "/usr";
~dur = 20.46;

thisThread.randSeed = 2026;

// ---------------------------------------------------------------- synths
~defs = [

	// lo-fi electric piano: sine body + soft FM tine, a little tape wobble
	SynthDef(\keys, { |freq=440, amp=0.1, dur=1, pan=0, send=0.35|
		var wob = 1 + (SinOsc.kr(5.3, Rand(0, 6)) * 0.0015);
		var f = freq * wob;
		var env = EnvGen.ar(Env([0, 1, 0.5, 0], [0.005, dur, 0.8], [0, -3, -4]), doneAction: 2);
		var tine = SinOsc.ar(f * 2, SinOsc.ar(f * 7) * EnvGen.ar(Env.perc(0.001, 0.4)) * 1.5) * 0.25;
		var sig = (SinOsc.ar(f) + tine + (SinOsc.ar(f * 0.5) * 0.2)) * env * amp;
		sig = LPF.ar(sig, 3200);
		sig = Pan2.ar(sig, pan);
		Out.ar(20, sig);
		Out.ar(22, sig * send);
	}),

	// warm pad: detuned saws, slow swell, filter opens with \cut
	SynthDef(\pad, { |freq=220, amp=0.05, dur=2, atk=0.6, rel=1.2, cut=1800, pan=0|
		var env = EnvGen.ar(Env([0, 1, 1, 0], [atk, dur, rel], [2, 0, -3]), doneAction: 2);
		var sig = Saw.ar(freq * [0.997, 1.003, 1.0], [0.4, 0.4, 0.3]).sum;
		sig = RLPF.ar(sig, cut * EnvGen.kr(Env([0.6, 1, 0.8], [atk, dur])), 0.6);
		sig = Pan2.ar(sig * env * amp, pan + LFNoise1.kr(0.3, 0.2));
		Out.ar(20, sig);
		Out.ar(22, sig * 0.6);
	}),

	// 808 sub with pitch drop and grit
	SynthDef(\sub, { |freq=39, amp=0.5, dec=1.8|
		var env = EnvGen.ar(Env.perc(0.004, dec, 1, -3), doneAction: 2);
		var f = freq * EnvGen.kr(Env([2.6, 1], [0.06], -4));
		var sig = (SinOsc.ar(f) * 1.6).tanh * env * amp;
		Out.ar(20, sig ! 2);
	}),

	SynthDef(\bass, { |freq=55, amp=0.25, dur=0.5|
		var env = EnvGen.ar(Env([0, 1, 0.8, 0], [0.01, dur, 0.15], [0, -2, -4]), doneAction: 2);
		var sig = SinOsc.ar(freq) + (LFTri.ar(freq) * 0.3);
		sig = LPF.ar((sig * 1.3).tanh, 600) * env * amp;
		Out.ar(20, sig ! 2);
	}),

	// lo-fi kick
	SynthDef(\kick, { |amp=0.45|
		var env = EnvGen.ar(Env.perc(0.002, 0.35, 1, -5), doneAction: 2);
		var sig = SinOsc.ar(EnvGen.kr(Env([150, 52, 45], [0.04, 0.2], -4)));
		sig = sig + (LPF.ar(WhiteNoise.ar, 900) * Env.perc(0.001, 0.015).ar * 0.6);
		sig = (sig * 1.4).tanh * env * amp;
		Out.ar(20, sig ! 2);
	}),

	// dusty snare/clap
	SynthDef(\snare, { |amp=0.22, pan=0|
		var n = BPF.ar(WhiteNoise.ar, 1800, 0.9);
		var clap = n * EnvGen.ar(Env([0, 1, 0.3, 1, 0.3, 1, 0], [0.001, 0.008, 0.001, 0.008, 0.001, 0.16], -4));
		var body = SinOsc.ar(190) * Env.perc(0.001, 0.07).ar * 0.5;
		var sig = (clap + body) * amp * EnvGen.ar(Env.perc(0.001, 0.3), doneAction: 2);
		sig = Pan2.ar(sig, pan);
		Out.ar(20, sig);
		Out.ar(22, sig * 0.35);
	}),

	SynthDef(\hat, { |amp=0.06, dec=0.05, pan=0.2|
		var sig = HPF.ar(WhiteNoise.ar, 7000) * EnvGen.ar(Env.perc(0.001, dec, 1, -6), doneAction: 2) * amp;
		Out.ar(20, Pan2.ar(sig, pan));
	}),

	// text tick: tiny click for type swaps
	SynthDef(\tick, { |amp=0.12, freq=3500, pan=0|
		var sig = BPF.ar(WhiteNoise.ar + Impulse.ar(0), freq, 0.5) * EnvGen.ar(Env.perc(0.0005, 0.025), doneAction: 2) * amp;
		Out.ar(20, Pan2.ar(sig, pan));
		Out.ar(22, Pan2.ar(sig * 0.2, pan));
	}),

	// typewriter clack: thump + key click + small bell ping
	SynthDef(\clack, { |amp=0.2, pan=0.3|
		var thump = SinOsc.ar(EnvGen.kr(Env([400, 120], [0.02]))) * Env.perc(0.001, 0.04).ar;
		var click = BPF.ar(WhiteNoise.ar, 2500, 0.3) * Env.perc(0.0005, 0.03).ar * 2;
		var ping = SinOsc.ar(2637) * Env.perc(0.001, 0.25).ar * 0.12;
		var sig = (thump + click + ping) * amp * EnvGen.ar(Env.perc(0.001, 0.3), doneAction: 2);
		Out.ar(20, Pan2.ar(sig, pan));
		Out.ar(22, Pan2.ar(sig * 0.3, pan));
	}),

	// chiptune blip / coin: square wave with optional upward jump
	SynthDef(\chip, { |freq=880, amp=0.06, dur=0.1, jump=1, pan=0|
		var f = freq * EnvGen.kr(Env([1, 1, jump], [dur * 0.35, 0], \hold));
		var env = EnvGen.ar(Env([0, 1, 0.7, 0], [0.002, dur, 0.05]), doneAction: 2);
		var sig = LPF.ar(Pulse.ar(f, 0.5), 5000) * env * amp;
		sig = Pan2.ar(sig, pan);
		Out.ar(20, sig);
		Out.ar(22, sig * 0.4);
	}),

	// glassy bell for sparkles and the coda
	SynthDef(\bell, { |freq=1320, amp=0.07, dec=2.5, pan=0, send=0.8|
		var parts = [1, 2.76, 5.4, 8.93];
		var sig = Mix.fill(4, { |i| SinOsc.ar(freq * parts[i]) * EnvGen.ar(Env.perc(0.001, dec / (i + 1))) * (0.5 ** i) });
		sig = sig * amp * EnvGen.ar(Env.perc(0.001, dec + 0.2), doneAction: 2);
		sig = Pan2.ar(sig, pan);
		Out.ar(20, sig);
		Out.ar(22, sig * send);
	}),

	// filtered noise sweep (flare, orbit line, brush swoosh)
	SynthDef(\whoosh, { |from=300, to=6000, dur=0.4, amp=0.15, pan=0, curve=(-2)|
		var env = EnvGen.ar(Env([0, 1, 0], [dur * 0.6, dur * 0.4], [2, -3]), doneAction: 2);
		var f = EnvGen.kr(Env([from, to], [dur], \exp));
		var sig = BPF.ar(WhiteNoise.ar ! 2, f, 0.35) * env * amp * 2;
		sig = Balance2.ar(sig[0], sig[1], Line.kr(pan.neg, pan, dur));
		Out.ar(20, sig);
		Out.ar(22, sig * 0.5);
	}),

	// reverse-cymbal swell that lands on a cut
	SynthDef(\swell, { |dur=0.6, amp=0.12|
		var env = EnvGen.ar(Env([0, 1, 0], [dur, 0.02], [4, -4]), doneAction: 2);
		var sig = HPF.ar(WhiteNoise.ar ! 2, 3000) + (HPF.ar(Pulse.ar([3130, 4400]), 2500) * 0.1);
		Out.ar(20, sig * env * amp);
		Out.ar(22, sig * env * amp * 0.5);
	}),

	// impact: sub thump + noise burst + crunch, for hard cuts
	SynthDef(\boom, { |amp=0.4, freq=39|
		var sub = SinOsc.ar(freq * EnvGen.kr(Env([3, 1], [0.05], -4))) * EnvGen.ar(Env.perc(0.002, 0.9, 1, -4));
		var burst = LPF.ar(WhiteNoise.ar, 2500) * EnvGen.ar(Env.perc(0.001, 0.12, 1, -6)) * 0.5;
		var sig = ((sub + burst) * 1.5).tanh * amp * EnvGen.ar(Env.perc(0.001, 1.0), doneAction: 2);
		Out.ar(20, sig ! 2);
		Out.ar(22, (burst * amp * 0.4) ! 2);
	}),

	// spray-paint hiss for the ink blobs
	SynthDef(\spray, { |amp=0.1, dur=0.18, pan=0|
		var env = EnvGen.ar(Env([0, 1, 0.6, 0], [0.01, dur, 0.05]), doneAction: 2);
		var sig = HPF.ar(PinkNoise.ar, 2500) + (BPF.ar(WhiteNoise.ar, 6500, 0.3) * 0.6);
		sig = sig * env * amp + (SinOsc.ar(80) * Env.perc(0.001, 0.08).ar * amp * 1.5);
		Out.ar(20, Pan2.ar(sig, pan));
		Out.ar(22, Pan2.ar(sig * 0.3, pan));
	}),

	// vinyl bed under the whole piece (matches the grain on picture)
	SynthDef(\vinyl, { |amp=0.04, dur=20|
		var env = EnvGen.ar(Env([0, 1, 1, 0], [0.2, dur - 0.4, 0.2]), doneAction: 2);
		var crackle = Dust.ar([9, 11]) * 0.9 + (Dust.ar([1.5, 1.2]) * 2.5);
		var hiss = LPF.ar(PinkNoise.ar ! 2, 4500) * 0.06;
		var sig = (BPF.ar(crackle, 2800, 1.5) + hiss) * env * amp;
		Out.ar(0, sig);
	}),

	// master: verb send + global lowpass (automated for the "vignette closing" moments)
	SynthDef(\master, { |cut=18000, gain=1|
		var music = In.ar(20, 2);
		var send = In.ar(22, 2);
		var verb = FreeVerb2.ar(send[0], send[1], 1, 0.85, 0.4);
		var sig = music + verb;
		sig = LPF.ar(sig, cut.lag(0.25).clip(80, 20000));
		Out.ar(0, sig * gain.lag(0.05));
	}),

	SynthDef(\limiter, { |gain=1.5|
		var sig = LeakDC.ar(In.ar(0, 2)) * gain;
		ReplaceOut.ar(0, Limiter.ar((sig * 1.1).tanh * 0.95, 0.9, 0.005));
	}),
];

// ---------------------------------------------------------------- helpers
~ev = List.new;
~s = { |t, def, args| ~ev.add([t, [\s_new, def, -1, 0, 0] ++ args]) };
~set = { |t, args| ~ev.add([t, [\n_set, 900] ++ args]) };   // master node

~m = { |n| n.midicps };
~spb = 60 / 108;

// chord name -> [bass midi, voicing]
~ch = (
	bmaj9: [35, [59, 63, 66, 70, 73]],
	fsAs:  [34, [61, 66, 70, 73]],
	dsm9:  [39, [58, 61, 65, 66, 70]],
	cssus: [37, [61, 66, 68, 73]],
	fsadd9: [42, [61, 66, 68, 70, 73]],
	gsm7:  [44, [59, 63, 66, 70]]
);
~keysChord = { |t, name, amp=0.05, dur=1, spread=0.012|
	~ch[name][1].do { |n, i| ~s.(t + (i * spread), \keys, [\freq, ~m.(n), \amp, amp, \dur, dur, \pan, (i / 4) - 0.5]) };
};
~padChord = { |t, name, dur=2, amp=0.035, cut=1800, atk=0.6, rel=1.2|
	~ch[name][1].do { |n| ~s.(t, \pad, [\freq, ~m.(n - 12), \amp, amp, \dur, dur, \cut, cut, \atk, atk, \rel, rel]) };
};
~groove = { |t0, beats, kickAmp=0.4|
	beats.do { |b|
		var t = t0 + (b * ~spb);
		if(b % 2 == 0) { ~s.(t, \kick, [\amp, kickAmp]) } { ~s.(t, \snare, [\amp, 0.2]) };
		if(b % 4 == 3) { ~s.(t + (~spb * 0.5), \kick, [\amp, kickAmp * 0.6]) };
		2.do { |h| ~s.(t + (h * ~spb * 0.5), \hat, [\amp, [0.05, 0.03][h], \pan, 0.25]) };
	};
};
~pent = [54, 56, 58, 61, 63, 66, 68, 70, 73, 75, 78];   // F# major pentatonic

// ---------------------------------------------------------------- the cue
~s.(0, \vinyl, [\amp, 0.05, \dur, ~dur]);

// ACT 1  0.00-2.00  typographic swaps: dry ticks on every swap, muted keys underneath
[0.0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90].do { |t, i| ~s.(t, \tick, [\amp, 0.13, \freq, [3500, 2800, 4200][i % 3], \pan, rrand(-0.4, 0.4)]) };
~s.(0.30, \whoosh, [\from, 2000, \to, 400, \dur, 0.15, \amp, 0.08]);           // redaction bar
~keysChord.(0.02, \dsm9, 0.035, 1.6);
~s.(0.02, \bass, [\freq, ~m.(39), \amp, 0.14, \dur, 1.6]);
[1.05, 1.35, 1.50].do { |t| ~s.(t, \whoosh, [\from, 900, \to, 2600, \dur, 0.18, \amp, 0.04]) };   // pen strokes
[1.2, 1.32, 1.5, 1.65, 1.8, 1.95].do { |t| ~s.(t, \tick, [\amp, 0.06, \freq, 5000]) };              // word type-on
~s.(1.4, \swell, [\dur, 0.6, \amp, 0.07]);

// ACT 1b 2.00-3.80  flare burst, then the vignette closes: filter shuts, room goes quiet
~s.(2.0, \whoosh, [\from, 500, \to, 9000, \dur, 0.3, \amp, 0.2, \pan, 0.8]);
~s.(2.0, \kick, [\amp, 0.3]);
[2.0, 2.06, 2.12, 2.2].do { |t, i| ~s.(t, \bell, [\freq, ~m.(~pent[6 + i] + 12), \amp, 0.035, \dec, 1.5, \pan, rrand(-0.6, 0.6)]) };
[2.05, 2.15, 2.25, 2.3].do { |t, i| ~s.(t, \chip, [\freq, ~m.(~pent[3 + (i * 2)] + 12), \amp, 0.03, \dur, 0.05]) };  // objects pop in
~padChord.(2.0, \bmaj9, 1.4, 0.03, 2600, 0.3, 0.6);
~keysChord.(2.02, \bmaj9, 0.04, 1.2);
~s.(2.0, \bass, [\freq, ~m.(35), \amp, 0.14, \dur, 1.4]);
~set.(2.3, [\cut, 2500]);
~set.(2.55, [\cut, 700, \gain, 0.45]);
~set.(3.2, [\cut, 350, \gain, 0.3]);
~s.(3.55, \whoosh, [\from, 1200, \to, 200, \dur, 0.25, \amp, 0.06]);
~set.(3.72, [\gain, 0.15]);                       // breath of silence before the drop

// ACT 2  3.80-6.20  "you dont." sub drop on the cut, then sparse and heavy
~set.(3.8, [\gain, 1, \cut, 2400]);
~s.(3.8, \boom, [\amp, 0.5, \freq, ~m.(27)]);
~s.(3.8, \sub, [\freq, ~m.(27), \amp, 0.5, \dec, 2.2]);
~padChord.(3.8, \dsm9, 1.8, 0.03, 900, 0.5, 0.8);
~s.(4.05, \tick, [\amp, 0.08]);                    // "you dont." types on
~s.(4.8, \whoosh, [\from, 1500, \to, 5000, \dur, 0.4, \amp, 0.08, \pan, 0.9]);   // orbit line
~s.(4.85, \bell, [\freq, ~m.(82), \amp, 0.03, \dec, 1.8, \pan, 0.5]);
~s.(5.1, \sub, [\freq, ~m.(30), \amp, 0.35, \dec, 1.1]);
~keysChord.(5.1, \gsm7, 0.035, 0.8);
[5.4, 5.55, 5.7, 6.15].do { |t| ~s.(t, \tick, [\amp, 0.06, \freq, 4500]) };        // "you just show it."
~set.(5.6, [\cut, 6000]);
[5.52, 5.64, 5.76].do { |t, i| ~s.(t, \bell, [\freq, ~m.([85, 90, 94][i]), \amp, 0.03, \dec, 1.4, \pan, 0.4]) };   // implant ripples
~s.(4.22, \bell, [\freq, ~m.(90), \amp, 0.025, \dec, 1.0, \pan, 0.4]);                         // background lifts to light
~s.(5.6, \swell, [\dur, 0.6, \amp, 0.2]);
~padChord.(5.5, \bmaj9, 0.5, 0.025, 3000, 0.4, 0.3);

// ACT 3  6.20-8.30  the ring: groove comes in, chip arp, coin blips on the gold flashes
~set.(6.2, [\cut, 18000]);
~s.(6.2, \boom, [\amp, 0.3]);
~groove.(6.2, 4);
[[6.2, \bmaj9, 1.0], [7.311, \fsAs, 0.9]].do { |c|
	~keysChord.(c[0], c[1], 0.045, c[2]);
	~s.(c[0], \bass, [\freq, ~m.(~ch[c[1]][0]), \amp, 0.22, \dur, c[2]]);
};
16.do { |i|                                       // pixel arp in 16ths, rising then falling
	var t = 6.2 + (i * ~spb * 0.25);
	var idx = [0, 2, 4, 5, 7, 5, 4, 2][i % 8] + 3;
	if(t < 8.05) { ~s.(t, \chip, [\freq, ~m.(~pent[idx]), \amp, 0.028, \dur, 0.06, \pan, [-0.3, 0.3][i % 2]]) };
};
[7.2, 7.35, 7.8].do { |t, i| ~s.(t, \chip, [\freq, ~m.([80, 83, 85][i]), \amp, 0.05, \dur, 0.08, \jump, 1.335]) };  // gold flashes
~s.(7.7, \swell, [\dur, 0.6, \amp, 0.1]);         // ring collapses into the first card
~s.(8.1, \whoosh, [\from, 4000, \to, 300, \dur, 0.2, \amp, 0.08]);

// ACT 4  8.30-11.90  three values: dark card = impact + clack, light strip = bright arp run
[[8.3, \dsm9, 9.2], [9.9, \bmaj9, 10.6], [11.1, \cssus, 11.9]].do { |c, k|
	var t = c[0];
	~s.(t, \boom, [\amp, 0.42, \freq, ~m.(~ch[c[1]][0] - 12)]);
	~s.(t, \kick, [\amp, 0.35]);
	~keysChord.(t, c[1], 0.05, 0.6, 0.006);
	~s.(t, \bass, [\freq, ~m.(~ch[c[1]][0]), \amp, 0.24, \dur, 0.6]);
	~s.(t + 0.05, \clack, [\amp, 0.22]);           // block cursor lands
	~s.(t + 0.2, \clack, [\amp, 0.12]);            // resolves to the word
	~s.(t + 0.35, \tick, [\amp, 0.06]);            // caret blink
	~s.(t + 0.55, \tick, [\amp, 0.04]);
};
~s.(8.35, \whoosh, [\from, 800, \to, 7000, \dur, 0.2, \amp, 0.1, \pan, -0.6]);   // red spark
~s.(8.95, \whoosh, [\from, 3000, \to, 600, \dur, 0.2, \amp, 0.06]);              // chip flips edge-on
8.do { |i| ~s.(8.95 + (i * 0.025), \chip, [\freq, ~m.([97, 92, 99, 94, 101, 96, 103, 98][i]), \amp, 0.018, \dur, 0.018, \pan, 0.3]) };   // data bits
~s.(10.0, \whoosh, [\from, 400, \to, 3000, \dur, 0.45, \amp, 0.08, \pan, 0.6]);  // ribbon grows
[11.2, 11.42, 11.6].do { |t, i| ~s.(t, \bell, [\freq, ~m.([78, 82, 85][i]), \amp, 0.04, \dec, 1.2, \pan, [0.1, -0.3, -0.5][i]]) };  // red glyphs pop
// light strips: conveyor arp + hats
[[9.2, 0.7, \fsAs], [10.6, 0.5, \gsm7]].do { |s|
	var n = (s[1] / (~spb * 0.25)).floor.asInteger;
	n.do { |i| ~s.(s[0] + (i * ~spb * 0.25), \chip, [\freq, ~m.(~pent[(i + 4) % ~pent.size] + 12), \amp, 0.03, \dur, 0.05, \pan, 0.5 - (i / n)]) };
	(n / 2).floor.asInteger.do { |i| ~s.(s[0] + (i * ~spb * 0.5), \hat, [\amp, 0.05]) };
	~s.(s[0], \snare, [\amp, 0.15]);
	~keysChord.(s[0], s[2], 0.035, s[1]);
};

// ACT 5  11.90-13.80  ring reforms then explodes; ink blobs land; filter closes toward the hand
~s.(11.9, \whoosh, [\from, 300, \to, 5000, \dur, 0.2, \amp, 0.12]);
~s.(11.9, \kick, [\amp, 0.4]);
~groove.(11.9, 1);
~keysChord.(11.9, \bmaj9, 0.045, 0.6);
~s.(11.9, \bass, [\freq, ~m.(35), \amp, 0.22, \dur, 0.6]);
~s.(12.2, \swell, [\dur, 0.35, \amp, 0.1]);
~s.(12.55, \boom, [\amp, 0.35]);                   // explode
~s.(12.55, \whoosh, [\from, 6000, \to, 500, \dur, 0.5, \amp, 0.15, \pan, -0.8]);
[[12.55, 0], [12.7, 70], [12.85, 73], [13.0, 75], [13.15, 78], [13.3, 80], [13.45, 82]].do { |b, i|
	if(b[1] > 0) { ~s.(b[0], \spray, [\amp, 0.11, \dur, 0.12 + 0.05.rand, \pan, rrand(-0.7, 0.7)]) };
	~s.(b[0] + 0.01, \kick, [\amp, 0.18]);
};
~padChord.(12.55, \dsm9, 1.0, 0.03, 1500, 0.2, 0.6);
~s.(12.55, \bass, [\freq, ~m.(39), \amp, 0.2, \dur, 1.0]);
~set.(12.9, [\cut, 3000]);
~set.(13.4, [\cut, 1200]);
~s.(13.6, \whoosh, [\from, 2500, \to, 400, \dur, 0.15, \amp, 0.07]);   // redaction bar
~s.(13.7, \whoosh, [\from, 200, \to, 3000, \dur, 0.15, \amp, 0.12, \pan, 0.7]);   // brush swirl

// ACT 6  13.80-15.90  the hand: drums out, warm and open, slow build
~set.(13.8, [\cut, 18000]);
~s.(13.8, \sub, [\freq, ~m.(30), \amp, 0.38, \dec, 2.0]);
~padChord.(13.8, \gsm7, 1.0, 0.03, 1400, 0.4, 0.6);
~padChord.(14.9, \bmaj9, 0.9, 0.035, 2200, 0.3, 0.6);
~keysChord.(13.82, \gsm7, 0.04, 1.0, 0.03);
~keysChord.(14.92, \bmaj9, 0.04, 0.9, 0.03);
~s.(13.82, \bass, [\freq, ~m.(44), \amp, 0.2, \dur, 1.0]);
~s.(14.92, \bass, [\freq, ~m.(35), \amp, 0.2, \dur, 0.9]);
[13.95, 14.1, 14.25, 14.4, 14.55, 15.7].do { |t| ~s.(t, \tick, [\amp, 0.05, \freq, 4500]) };   // captions type on
[14.3, 14.75, 15.15, 15.45].do { |t, i| ~s.(t, \bell, [\freq, ~m.(~pent[7 + (i % 3)] + 12), \amp, 0.02, \dec, 1.0, \pan, rrand(-0.5, 0.5)]) };   // sparks
[15.0, 15.28, 15.56].do { |t, i| ~s.(t, \kick, [\amp, 0.12 + (i * 0.05)]) };   // heartbeat build
~s.(15.3, \swell, [\dur, 0.6, \amp, 0.13]);

// ACT 6b 15.90-17.20  L O V E: one stab per letter, climbing to the resolve
~s.(15.9, \whoosh, [\from, 1000, \to, 8000, \dur, 0.12, \amp, 0.1, \pan, 0.4]);   // red dart flick
[[16.05, \bmaj9, 66, 0.3], [16.35, \fsAs, 70, 0.3], [16.65, \gsm7, 73, 0.3], [16.95, \fsadd9, 78, 0.6]].do { |l, i|
	var t = l[0];
	~s.(t, \boom, [\amp, 0.32 + (i * 0.04), \freq, ~m.(~ch[l[1]][0] - 12)]);
	~s.(t, \kick, [\amp, 0.4]);
	if(i > 0) { ~s.(t, \snare, [\amp, 0.12 + (i * 0.03)]) };
	~keysChord.(t, l[1], 0.05 + (i * 0.005), l[3], 0.004);
	~padChord.(t, l[1], l[3], 0.025, 3000, 0.02, 0.3);
	~s.(t, \bass, [\freq, ~m.(~ch[l[1]][0]), \amp, 0.25, \dur, l[3]]);
	~s.(t, \bell, [\freq, ~m.(l[2] + 12), \amp, 0.05, \dec, 1.6, \pan, [-0.5, -0.15, 0.15, 0.5][i]]);
	~s.(t, \chip, [\freq, ~m.(l[2] + 12), \amp, 0.03, \dur, 0.08]);
};
~s.(16.65, \whoosh, [\from, 300, \to, 6000, \dur, 0.15, \amp, 0.1]);   // full red flash

// ACT 7  17.20-20.46  the drop: near silence, tails, lone bells on the red pen loops
~s.(17.2, \whoosh, [\from, 2500, \to, 150, \dur, 0.35, \amp, 0.14]);   // blurred brush stroke
~set.(17.2, [\cut, 900, \gain, 0.6]);
~set.(17.6, [\cut, 4500, \gain, 1]);
~s.(17.25, \sub, [\freq, ~m.(30), \amp, 0.22, \dec, 2.5]);
~padChord.(17.25, \fsadd9, 2.6, 0.018, 1100, 0.8, 1.2);
[[17.55, 85], [18.0, 78], [19.5, 82], [19.65, 85], [19.8, 80], [19.95, 87], [20.1, 90]].do { |b, i|
	~s.(b[0], \bell, [\freq, ~m.(b[1]), \amp, 0.018 + (i * 0.003), \dec, 1.6, \pan, rrand(-0.6, 0.6)]);
	~s.(b[0], \tick, [\amp, 0.03, \freq, 6000]);
};
[19.2, 19.53, 19.87].do { |t| ~s.(t, \clack, [\amp, 0.05, \pan, 0.1]) };   // the caret: the thought is typed
~keysChord.(20.22, \fsadd9, 0.04, 0.3, 0.02);                          // final push-in
~s.(20.22, \bell, [\freq, ~m.(78), \amp, 0.04, \dec, 1.0]);
~set.(20.3, [\gain, 0.0]);

// ---------------------------------------------------------------- render
~score = ~defs.collect { |d| [0.0, [\d_recv, d.asBytes]] };
~score = ~score ++ [
	[0.0, [\s_new, \master, 900, 1, 0]],
	[0.0, [\s_new, \limiter, 901, 3, 900]]
];
~score = ~score ++ ~ev.asArray.sort { |a, b| a[0] < b[0] };
~score = ~score ++ [[~dur, [\c_set, 0, 0]]];

~opts = ServerOptions.new
	.numOutputBusChannels_(2)
	.numInputBusChannels_(0)
	.memSize_(2 ** 18)
	.maxNodes_(4096)
	.ugenPluginsPath_(~sc +/+ "lib/SuperCollider/plugins");

"rendering % events, % s...".format(~ev.size, ~dur).postln;
Score.recordNRT(~score, ~root +/+ "score.osc", ~root +/+ "music.wav",
	sampleRate: 44100, headerFormat: "WAV", sampleFormat: "int24", options: ~opts, duration: ~dur,
	action: { "done".postln; 0.exit });
