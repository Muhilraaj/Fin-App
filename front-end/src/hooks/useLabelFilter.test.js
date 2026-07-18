import { renderHook } from '@testing-library/react';
import { useLabelFilter } from './useLabelFilter';

const flatLabels3 = [
  { id: 'uuid-1', L1: 'Food', L2: 'Groceries', L3: 'Vegetables' },
  { id: 'uuid-2', L1: 'Food', L2: 'Groceries', L3: 'Dairy' },
  { id: 'uuid-3', L1: 'Food', L2: 'Dining', L3: 'Restaurants' },
  { id: 'uuid-4', L1: 'Transport', L2: 'Fuel', L3: 'Petrol' },
];

const flatLabels2 = [
  { id: 'uuid-a', L1: 'Salary', L2: 'Monthly' },
  { id: 'uuid-b', L1: 'Salary', L2: 'Bonus' },
];

describe('useLabelFilter', () => {
  test('returns empty options when labels are not loaded', () => {
    const { result } = renderHook(() =>
      useLabelFilter(null, { l1: '*', l2: '*', l3: '*' }, 3)
    );
    expect(result.current).toEqual({
      l1Options: [],
      l2Options: [],
      l3Options: [],
      selectedLabelId: null,
    });
  });

  test('derives 3-level options from flat labels', () => {
    const { result } = renderHook(() =>
      useLabelFilter(flatLabels3, { l1: '*', l2: '*', l3: '*' }, 3)
    );
    expect(result.current.l1Options).toEqual(['Food', 'Transport']);
    expect(result.current.l2Options).toEqual(['Dining', 'Fuel', 'Groceries']);
    expect(result.current.l3Options).toEqual(['Dairy', 'Petrol', 'Restaurants', 'Vegetables']);
    expect(result.current.selectedLabelId).toBeNull();
  });

  test('filters L2 and L3 when L1 is selected', () => {
    const { result } = renderHook(() =>
      useLabelFilter(flatLabels3, { l1: 'Food', l2: '*', l3: '*' }, 3)
    );
    expect(result.current.l2Options).toEqual(['Dining', 'Groceries']);
    expect(result.current.l3Options).toEqual(['Dairy', 'Restaurants', 'Vegetables']);
  });

  test('resolves selectedLabelId when full path is selected', () => {
    const { result } = renderHook(() =>
      useLabelFilter(flatLabels3, { l1: 'Food', l2: 'Groceries', l3: 'Vegetables' }, 3)
    );
    expect(result.current.selectedLabelId).toBe('uuid-1');
  });

  test('derives 2-level options from flat labels', () => {
    const { result } = renderHook(() =>
      useLabelFilter(flatLabels2, { l1: '*', l2: '*' }, 2)
    );
    expect(result.current.l1Options).toEqual(['Salary']);
    expect(result.current.l2Options).toEqual(['Bonus', 'Monthly']);
    expect(result.current.selectedLabelId).toBeNull();
  });

  test('resolves income selectedLabelId', () => {
    const { result } = renderHook(() =>
      useLabelFilter(flatLabels2, { l1: 'Salary', l2: 'Monthly' }, 2)
    );
    expect(result.current.selectedLabelId).toBe('uuid-a');
  });
});
