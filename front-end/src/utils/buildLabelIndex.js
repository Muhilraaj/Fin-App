function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function buildLabelIndex(rows, depth = 3) {
  const l1Set = new Set();
  const l2ByL1 = {};
  const l3ByL1L2 = {};

  for (const row of rows) {
    const l1 = String(row.L1 ?? '').trim();
    const l2 = String(row.L2 ?? '').trim();
    const l3 = String(row.L3 ?? '').trim();
    if (!l1) continue;

    l1Set.add(l1);
    if (l2) {
      if (!l2ByL1[l1]) l2ByL1[l1] = new Set();
      l2ByL1[l1].add(l2);
    }
    if (depth === 3 && l2 && l3) {
      const key = `${l1}|${l2}`;
      if (!l3ByL1L2[key]) l3ByL1L2[key] = new Set();
      l3ByL1L2[key].add(l3);
    }
  }

  return {
    l1Options: sorted(l1Set),
    l2Options: (l1) => sorted(l2ByL1[l1] ?? []),
    l3Options: (l1, l2) => sorted(l3ByL1L2[`${l1}|${l2}`] ?? []),
  };
}
