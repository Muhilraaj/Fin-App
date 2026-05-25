import { buildLabelIndex } from './buildLabelIndex';

describe('buildLabelIndex', () => {
  const rows = [
    { L1: 'Food', L2: 'Groceries', L3: 'Vegetables' },
    { L1: 'Food', L2: 'Groceries', L3: 'Dairy' },
    { L1: 'Food', L2: 'Dining', L3: 'Restaurants' },
    { L1: 'Transport', L2: 'Fuel', L3: 'Petrol' },
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

  test('builds L3 options for a given L1 and L2', () => {
    const index = buildLabelIndex(rows, 3);
    expect(index.l3Options('Food', 'Groceries')).toEqual(['Dairy', 'Vegetables']);
  });

  test('supports 2-level depth', () => {
    const incomeRows = [
      { L1: 'Salary', L2: 'Monthly' },
      { L1: 'Salary', L2: 'Bonus' },
    ];
    const index = buildLabelIndex(incomeRows, 2);
    expect(index.l1Options).toEqual(['Salary']);
    expect(index.l2Options('Salary')).toEqual(['Bonus', 'Monthly']);
  });
});
