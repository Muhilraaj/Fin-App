import { renderHook } from '@testing-library/react';
import { useLabelCascade } from './useLabelCascade';

const labelTree3 = {
  '*': {
    '*': {
      '*': { L1: ['Food'], L2: ['Groceries'], L3: ['Vegetables'] },
      Food: {
        '*': { L1: ['Food'], L2: ['Groceries'], L3: ['Vegetables'] },
        Groceries: {
          '*': { L1: ['Food'], L2: ['Groceries'], L3: ['Vegetables'] },
        },
      },
    },
  },
};

const labelTree2 = {
  '*': {
    '*': { L1: ['Salary'], L2: ['Monthly'] },
    Salary: {
      '*': { L1: ['Salary'], L2: ['Monthly'] },
    },
  },
};

describe('useLabelCascade', () => {
  test('returns empty options when label tree is not loaded', () => {
    const { result } = renderHook(() =>
      useLabelCascade(null, { l1: '*', l2: '*', l3: '*' }, 3)
    );
    expect(result.current).toEqual({ l1Options: [], l2Options: [], l3Options: [] });
  });

  test('derives 3-level options from label tree', () => {
    const { result } = renderHook(() =>
      useLabelCascade(labelTree3, { l1: '*', l2: '*', l3: '*' }, 3)
    );
    expect(result.current.l1Options).toEqual(['Food']);
    expect(result.current.l2Options).toEqual(['Groceries']);
    expect(result.current.l3Options).toEqual(['Vegetables']);
  });

  test('derives 2-level options from label tree', () => {
    const { result } = renderHook(() =>
      useLabelCascade(labelTree2, { l1: '*', l2: '*' }, 2)
    );
    expect(result.current.l1Options).toEqual(['Salary']);
    expect(result.current.l2Options).toEqual(['Monthly']);
  });
});
