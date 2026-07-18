import { useMemo } from 'react';
import { buildLabelIndex } from '../utils/buildLabelIndex';

export function useAdminLabelCascade(rows, { l1, l2 }, depth = 3) {
  return useMemo(() => {
    const index = buildLabelIndex(rows, depth);
    return {
      l1Options: index.l1Options,
      l2Options: l1 ? index.l2Options(l1) : [],
      l3Options: depth === 3 && l1 && l2 ? index.l3Options(l1, l2) : [],
    };
  }, [rows, l1, l2, depth]);
}
