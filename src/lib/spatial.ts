type SpatialNodes = {
  input: GainNode;
  output: GainNode;
  splitter: ChannelSplitterNode;
  merger: ChannelMergerNode;
  delay_l: DelayNode;
  delay_r: DelayNode;
  cross_l: GainNode;
  cross_r: GainNode;
  direct_l: GainNode;
  direct_r: GainNode;
  convolver: ConvolverNode;
  wet: GainNode;
  dry: GainNode;
};

let _nodes: SpatialNodes | null = null;
let _enabled = false;

function gen_impulse(ctx: AudioContext): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.round(rate * 0.35);
  const buf = ctx.createBuffer(2, len, rate);
  const l = buf.getChannelData(0);
  const r = buf.getChannelData(1);

  for (let i = 0; i < len; i++) {
    const t = i / rate;
    const decay = Math.exp(-6 * t);
    const early = i < rate * 0.02 ? 0.6 : 1;

    l[i] = (Math.random() * 2 - 1) * decay * early * 0.15;
    r[i] = (Math.random() * 2 - 1) * decay * early * 0.15;

    if (i === Math.round(rate * 0.008)) { l[i] += 0.12; r[i] += 0.08; }
    if (i === Math.round(rate * 0.013)) { l[i] += 0.06; r[i] += 0.10; }
    if (i === Math.round(rate * 0.019)) { l[i] += 0.08; r[i] += 0.05; }
  }

  return buf;
}

export function create_spatial(ctx: AudioContext): SpatialNodes {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  const delay_l = ctx.createDelay(0.01);
  const delay_r = ctx.createDelay(0.01);
  delay_l.delayTime.value = 0.00022;
  delay_r.delayTime.value = 0.00038;

  const cross_l = ctx.createGain();
  const cross_r = ctx.createGain();
  cross_l.gain.value = -0.15;
  cross_r.gain.value = -0.15;

  const direct_l = ctx.createGain();
  const direct_r = ctx.createGain();
  direct_l.gain.value = 0.92;
  direct_r.gain.value = 0.92;

  input.connect(splitter);

  splitter.connect(delay_l, 0);
  delay_l.connect(direct_l);
  direct_l.connect(merger, 0, 0);

  splitter.connect(cross_r, 0);
  cross_r.connect(merger, 0, 1);

  splitter.connect(delay_r, 1);
  delay_r.connect(direct_r);
  direct_r.connect(merger, 0, 1);

  splitter.connect(cross_l, 1);
  cross_l.connect(merger, 0, 0);

  const convolver = ctx.createConvolver();
  convolver.buffer = gen_impulse(ctx);

  const wet = ctx.createGain();
  const dry = ctx.createGain();
  wet.gain.value = 0.22;
  dry.gain.value = 0.85;

  merger.connect(dry);
  merger.connect(convolver);
  convolver.connect(wet);

  dry.connect(output);
  wet.connect(output);

  _nodes = { input, output, splitter, merger, delay_l, delay_r, cross_l, cross_r, direct_l, direct_r, convolver, wet, dry };
  return _nodes;
}

export function get_spatial_nodes(): SpatialNodes | null {
  return _nodes;
}

export function is_spatial_enabled(): boolean {
  return _enabled;
}

export function set_spatial_enabled(v: boolean) {
  _enabled = v;
}
