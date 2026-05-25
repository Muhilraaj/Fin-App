import { useMemo } from 'react';

const emptyNode3 = { L1: [], L2: [], L3: [] };
const emptyNode2 = { L1: [], L2: [] };

export function useLabelCascade(labelTree, { l1, l2, l3 = '*' }, depth = 3) {
  return useMemo(() => {
    if (!labelTree) {
      return depth === 3
        ? { l1Options: [], l2Options: [], l3Options: [] }
        : { l1Options: [], l2Options: [] };
    }

    if (depth === 3) {
      const node = labelTree[l1]?.[l2]?.[l3] ?? emptyNode3;
      return {
        l1Options: node.L1 ?? [],
        l2Options: node.L2 ?? [],
        l3Options: node.L3 ?? [],
      };
    }

    const node = labelTree[l1]?.[l2] ?? emptyNode2;
    return {
      l1Options: node.L1 ?? [],
      l2Options: node.L2 ?? [],
    };
  }, [labelTree, l1, l2, l3, depth]);
}
