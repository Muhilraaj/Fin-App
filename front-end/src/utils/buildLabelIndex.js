function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function pathKey(parts) {
  return parts.filter(Boolean).join('|');
}

export function buildLabelIndex(rows, depth = 3) {
  const l1Set = new Set();
  const allL2 = new Set();
  const l2ByL1 = {};
  const allL3 = new Set();
  const l3ByL1 = {};
  const l3ByL1L2 = {};
  const idByPath = new Map();

  for (const row of rows) {
    const l1 = String(row.L1 ?? '').trim();
    const l2 = String(row.L2 ?? '').trim();
    const l3 = String(row.L3 ?? '').trim();
    const id = row.id;
    if (!l1) continue;

    l1Set.add(l1);
    if (l2) {
      allL2.add(l2);
      if (!l2ByL1[l1]) l2ByL1[l1] = new Set();
      l2ByL1[l1].add(l2);
    }
    if (depth === 3 && l3) {
      allL3.add(l3);
      if (l2) {
        const l1l2 = `${l1}|${l2}`;
        if (!l3ByL1L2[l1l2]) l3ByL1L2[l1l2] = new Set();
        l3ByL1L2[l1l2].add(l3);
      }
      if (!l3ByL1[l1]) l3ByL1[l1] = new Set();
      l3ByL1[l1].add(l3);
    }
    if (id) {
      if (depth === 3 && l2 && l3) {
        idByPath.set(pathKey([l1, l2, l3]), id);
      } else if (depth === 2 && l2) {
        idByPath.set(pathKey([l1, l2]), id);
      }
    }
  }

  return {
    l1Options: sorted(l1Set),
    l2Options: (l1) => {
      if (!l1 || l1 === '*') return sorted(allL2);
      return sorted(l2ByL1[l1] ?? []);
    },
    l3Options: (l1, l2) => {
      if (depth !== 3) return [];
      if (!l1 || l1 === '*') return sorted(allL3);
      if (!l2 || l2 === '*') return sorted(l3ByL1[l1] ?? []);
      return sorted(l3ByL1L2[`${l1}|${l2}`] ?? []);
    },
    idByPath,
  };
}
