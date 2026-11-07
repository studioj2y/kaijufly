// Deterministic, headless flight samples for tuning the game loop.
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(__dirname + '/game.js', 'utf8');

function createGame(seed, rank = 0) {
  let value = seed >>> 0;
  const math = Object.create(Math);
  math.random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };

  const nodes = new Map();
  const makeNode = () => ({
    style: {}, dataset: {}, textContent: '', innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    getContext() { return { setTransform() {} }; }
  });
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, makeNode());
      return nodes.get(id);
    },
    querySelectorAll() { return []; },
    title: ''
  };
  const window = {
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    addEventListener() {},
    kaijuAudio: { ensure() {}, play() {} },
    TOKUSATSU_LANDINGS: new Proxy({}, { get: () => ({ head: '', face: '', name: '', note: '', bonus: 0 }) }),
    drawTokusatsuLandingVignette() {}
  };
  const context = {
    window, document, Math: math, URLSearchParams,
    location: { search: '' }, requestAnimationFrame() {},
    localStorage: { getItem() { return null; }, setItem() {} }
  };
  vm.runInNewContext(fs.readFileSync(__dirname + '/progression.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(__dirname + '/air_distribution.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(__dirname + '/world_layout.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(__dirname + '/art_prototypes/revision8/manifest.js', 'utf8'), context);
  for (const item of window.kaijuProgress.catalog) {
    window.kaijuProgress.data.owned[item.id] = rank;
    window.kaijuProgress.data.equipped[item.id] = rank;
  }
  vm.runInNewContext(source, context, { filename: 'game.js' });
  const game = window.__KAIJU__;
  return { game, progress: window.kaijuProgress, nodes };
}

function run(seed, strategy, rank = Number(process.env.RANK || 0)) {
  const { game } = createGame(seed, rank);
  game.startGame('distance', 0);
  game.S.angle = 42;
  game.S.power = 65;
  game.press();
  game.press();
  game.release();

  let seconds = 0;
  const limit = Number(process.env.MAX_SECONDS || 180);
  for (let frame = 0; frame < 60 * limit && game.S.phase !== 'result'; frame++) {
    const s = game.S;
    s.holding = s.phase === 'flying' && (strategy === 'hold' ||
      (strategy === 'low-altitude' && s.carried <= 0 && s.j.energy > 10 && s.j.y < 24 && s.j.vy < 7));
    game.step(1 / 60);
    seconds += 1 / 60;
  }
  const s = game.S;
  return {
    seed, strategy, phase: s.phase, seconds: Math.round(seconds),
    distance: Math.round(s.dist), interactions: Object.values(s.events).reduce((a, b) => a + b, 0),
    air: s.air.length, ground: s.ground.length,
    energy: Math.round(s.j.energy), height: Math.round(s.j.y), speed: Math.round(s.j.vx)
  };
}

if (require.main === module) for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
  console.log(JSON.stringify(run(seed, 'none')));
  console.log(JSON.stringify(run(seed, 'hold')));
  console.log(JSON.stringify(run(seed, 'low-altitude')));
}
module.exports = { createGame, run };
