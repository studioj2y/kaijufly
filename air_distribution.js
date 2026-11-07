// Pick altitude before object type so height is a useful player choice.
(function () {
  const bands = [
    { min: 14, max: 32, chance: 0.46, weights: { mothra: 8, plane: 1, rodan: 0.5, cloud: 0.2, balloon: 2, gillas: 2, oilrig: 1.5, chili: 1, can: 1.5, birds: 1 } },
    { min: 32, max: 55, chance: 0.29, weights: { mothra: 2, plane: 8, rodan: 2, cloud: 0.5, balloon: 1, chili: 1, can: 1, birds: 1 } },
    { min: 55, max: 80, chance: 0.17, weights: { mothra: 0.5, plane: 2, rodan: 9, cloud: 2, chili: 1, can: 1, birds: 1 } },
    { min: 80, max: 115, chance: 0.08, weights: { mothra: 0.2, plane: 0.5, rodan: 2, cloud: 12, chili: 0.5, can: 0.5, birds: 0.5 } }
  ];
  function sample(random) {
    let pick = random(), band = bands[bands.length - 1];
    for (const candidate of bands) { pick -= candidate.chance; if (pick < 0) { band = candidate; break; } }
    let y = band.min + random() * (band.max - band.min);
    const entries = Object.entries(band.weights);
    let weighted = random() * entries.reduce((sum, item) => sum + item[1], 0);
    let type = entries[entries.length - 1][0];
    for (const [key, weight] of entries) { weighted -= weight; if (weighted < 0) { type = key; break; } }
    // These are rooted props, unlike the freely flying objects.
    if (type === 'gillas') y = 9;
    if (type === 'oilrig') y = 9;
    return { type, y };
  }
  window.kaijuAirDistribution = { bands, sample };
})();
