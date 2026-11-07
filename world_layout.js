// Shared world-space visual bounds, spawn clearance and swept collision tests.
(function () {
  'use strict';
  const groundHeights = { canvas: 17, tower: 22, anguirus: 10, ultraman: 17, water: 5, sand: 3, dolly: 10, chair: 10, trampoline: 6, building: 16, vent: 7, bento: 7, dolly_rail: 6 };
  function bounds(e, ground = false) {
    const rooted = ground || e.type === 'gillas' || e.type === 'oilrig';
    const height = ground ? (e.h || groundHeights[e.type] || 10) : e.h * (['mothra', 'rodan'].includes(e.type) ? 1.6 : 1);
    return { left: e.x - e.w / 2, right: e.x + e.w / 2, bottom: rooted ? 0 : e.y - height / 2, top: rooted ? height : e.y + height / 2 };
  }
  function clear(candidate, air, ground, isGround = false) {
    const box = bounds(candidate, isGround);
    const entries = air.map(e => [e, false]).concat(ground.map(e => [e, true]));
    return entries.every(([other, grounded]) => {
      const b = bounds(other, grounded), same = other.type === candidate.type;
      const gapX = same ? 20 : 9, gapY = same ? 12 : 5;
      return box.right + gapX <= b.left || box.left >= b.right + gapX || box.top + gapY <= b.bottom || box.bottom >= b.top + gapY;
    });
  }
  function sweptContact(from, to, box, paddingX = 3, paddingY = 2.2) {
    let enter = 0, leave = 1;
    for (const [axis, min, max] of [['x', box.left - paddingX, box.right + paddingX], ['y', box.bottom - paddingY, box.top + paddingY]]) {
      const delta = to[axis] - from[axis];
      if (Math.abs(delta) < 1e-9) { if (from[axis] < min || from[axis] > max) return null; continue; }
      let a = (min - from[axis]) / delta, b = (max - from[axis]) / delta;
      if (a > b) [a, b] = [b, a];
      enter = Math.max(enter, a); leave = Math.min(leave, b);
      if (enter > leave) return null;
    }
    return enter >= 0 && enter <= 1 ? enter : null;
  }
  window.kaijuLayout = { groundHeights, bounds, clear, sweptContact };
})();
