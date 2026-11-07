// Height changes the odds, never the existence of the airborne world.
(function () {
  'use strict';
  const bands = [
    { min: 30, max: 80, weights: { mothra: 8, plane: 3, rodan: 2, cloud: 1, gamera: 3, chili: 1, can: 1.5, birds: 1 } },
    { min: 80, max: 130, weights: { mothra: 3, plane: 8, rodan: 3, cloud: 2, gamera: 2, chili: 1, can: 1, birds: 1 } },
    { min: 130, max: 180, weights: { mothra: 2, plane: 3, rodan: 8, cloud: 3, gamera: 2, chili: 1, can: 1, birds: 1 } },
    { min: 180, max: 230, weights: { mothra: 1.5, plane: 2, rodan: 3, cloud: 8, gamera: 2, chili: 1, can: 1, birds: 1 } }
  ];
  const low = { min: 14, max: 30, weights: bands[0].weights };
  function rowForHeight(height) {
    return height < 30 ? 0 : 1 + Math.floor((height - 30) / 50);
  }
  function rowBounds(row) {
    return row === 0 ? [14, 30] : [30 + (row - 1) * 50, 80 + (row - 1) * 50];
  }
  function sample(random, row = 1) {
    const band = row === 0 ? low : bands[Math.min(row - 1, bands.length - 1)];
    const [min, max] = rowBounds(row);
    const y = min + random() * (max - min);
    const entries = Object.entries(band.weights);
    let weighted = random() * entries.reduce((sum, item) => sum + item[1], 0);
    let type = entries[entries.length - 1][0];
    for (const [key, weight] of entries) { weighted -= weight; if (weighted < 0) { type = key; break; } }
    return { type, y };
  }
  window.kaijuAirDistribution = { bands, sample, rowForHeight, rowBounds };
})();
