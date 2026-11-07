// Permanent unlocks and freely selectable loadout; a flight takes a snapshot.
(function () {
  'use strict';
  const key = 'kaijufly_progress_v1';
  const catalog = [
    { id: 'density', name: '片场扩建', costs: [80, 180, 360], detail: ['标准密度', '空中互动 +20%', '空中互动 +40%', '空中互动 +60%'] },
    { id: 'skid', name: '落地受身', costs: [60, 140, 280], detail: ['触地收场', '每次飞行可受身 1 次', '可受身 2 次', '可受身 3 次'] },
    { id: 'toss', name: '拉顿斜抛', costs: [70, 160, 320], detail: ['松爪后平飞', '小幅向上抛掷', '强力向上抛掷', '高抛接续飞行'] },
    { id: 'moth', name: '摩斯拉鳞粉', costs: [60, 140, 280], detail: ['回复 20 点体力', '回复 35 点体力', '回复 50 点体力', '回复 65 点体力'] },
    { id: 'stamina', name: '体力训练', costs: [50, 120, 240], detail: ['起始 / 上限 65', '起始 / 上限 80', '起始 / 上限 95', '起始 / 上限 110'] },
    { id: 'efficiency', name: '省力挥臂', costs: [90, 200, 380], detail: ['标准消耗', '体力消耗 −8%', '体力消耗 −16%', '体力消耗 −24%'] },
    { id: 'combo', name: '特技摄影', costs: [80, 180, 360], detail: ['标准特技得分', '特技得分 +15%', '特技得分 +30%', '特技得分 +45%'] }
  ];
  const data = { points: 0, earned: 0, runs: 0, owned: {}, equipped: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    for (const k of ['points', 'earned', 'runs']) data[k] = Math.max(0, Math.floor(Number(saved[k]) || 0));
    for (const item of catalog) {
      const n = Number(saved.owned && saved.owned[item.id]);
      data.owned[item.id] = Number.isFinite(n) ? Math.max(0, Math.min(3, Math.floor(n))) : 0;
      const e = Number(saved.equipped && saved.equipped[item.id]);
      data.equipped[item.id] = Number.isFinite(e) ? Math.max(0, Math.min(data.owned[item.id], Math.floor(e))) : data.owned[item.id];
    }
  } catch (_) { /* A damaged save starts with a valid empty loadout. */ }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (_) { return false; }
  }
  const api = {
    catalog, data,
    snapshot() { return Object.fromEntries(catalog.map(i => [i.id, data.equipped[i.id] || 0])); },
    buy(id) {
      const item = catalog.find(i => i.id === id), n = data.owned[id] || 0;
      if (!item || n >= 3 || data.points < item.costs[n]) return false;
      data.points -= item.costs[n]; data.owned[id] = n + 1; data.equipped[id] = n + 1;
      save(); return true;
    },
    equip(id, level) {
      if (!catalog.some(i => i.id === id) || !Number.isInteger(level) || level < 0 || level > (data.owned[id] || 0)) return false;
      data.equipped[id] = level; save(); return true;
    },
    award(distance, interactions, mission) {
      // Restarting/abandoning never pays. Completed flights always move progress forward.
      const points = Math.min(200, 8 + Math.floor(distance / 35) + Math.min(40, interactions * 3) + (mission ? 15 : 0));
      data.points += points; data.earned += points; data.runs++;
      const saved = save(); return { points, saved };
    }
  };
  window.kaijuProgress = api;
})();
