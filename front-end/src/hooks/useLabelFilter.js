import { useMemo } from 'react';
import { buildLabelIndex } from '../utils/buildLabelIndex';

const empty3 = { l1Options: [], l2Options: [], l3Options: [], selectedLabelId: null };
const empty2 = { l1Options: [], l2Options: [], selectedLabelId: null };

export function useLabelFilter(flatLabels, { l1, l2, l3 = '*' }, depth = 3) {
  return useMemo(() => {
    if (!flatLabels?.length) {
      return depth === 3 ? empty3 : empty2;
    }

    const index = buildLabelIndex(flatLabels, depth);
    const l1Options = index.l1Options;
    const l2Options = index.l2Options(l1);
    const l3Options = depth === 3 ? index.l3Options(l1, l2) : [];

    let selectedLabelId = null;
    if (depth === 3 && l1 !== '*' && l2 !== '*' && l3 !== '*') {
      selectedLabelId = index.idByPath.get(`${l1}|${l2}|${l3}`) ?? null;
    } else if (depth === 2 && l1 !== '*' && l2 !== '*') {
      selectedLabelId = index.idByPath.get(`${l1}|${l2}`) ?? null;
    }

    if (depth === 3) {
      return { l1Options, l2Options, l3Options, selectedLabelId };
    }
    return { l1Options, l2Options, selectedLabelId };
  }, [flatLabels, l1, l2, l3, depth]);
}
