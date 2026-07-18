import { buildLabelIndex } from './buildLabelIndex';

describe('buildLabelIndex', () => {
  const rows = [
    { id: 'uuid-1', L1: 'Food', L2: 'Groceries', L3: 'Vegetables' },
    { id: 'uuid-2', L1: 'Food', L2: 'Groceries', L3: 'Dairy' },
    { id: 'uuid-3', L1: 'Food', L2: 'Dining', L3: 'Restaurants' },
    { id: 'uuid-4', L1: 'Transport', L2: 'Fuel', L3: 'Petrol' },
  ];

  test('builds sorted L1 options', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.l1Options).toEqual(['Food', 'Transport']);
  });

  test('builds L2 options for a given L1', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.l2Options('Food')).toEqual(['Dining', 'Groceries']);
    expect(index.l2Options('Transport')).toEqual(['Fuel']);
  });

  test('builds all L2 options when L1 is wildcard', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.l2Options('*')).toEqual(['Dining', 'Fuel', 'Groceries']);
  });

  test('builds L3 options for a given L1 and L2', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.l3Options('Food', 'Groceries')).toEqual(['Dairy', 'Vegetables']);
  });

  test('builds L3 options for L1 only when L2 is wildcard', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.l3Options('Food', '*')).toEqual(['Dairy', 'Restaurants', 'Vegetables']);
  });

  test('maps path to id', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.idByPath.get('Food|Groceries|Vegetables')).toBe('uuid-1');
  });

  test('supports 2-level depth', () => {
    const incomeRows = [
      { id: 'uuid-a', L1: 'Salary', L2: 'Monthly' },
      { id: 'uuid-b', L1: 'Salary', L2: 'Bonus' },
    ];
    const index = buildLabelIndex(incomeRows, 2);
    expect(index.l1Options).toEqual(['Salary']);
    expect(index.l2Options('Salary')).toEqual(['Bonus', 'Monthly']);
    expect(index.idByPath.get('Salary|Monthly')).toBe('uuid-a');
  });
});
