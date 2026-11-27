import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import dayjs from 'dayjs';
import TransactionReportGrid from './TransactionReportGrid';

const mockUpdateExpense = jest.fn();
const mockDeleteExpense = jest.fn();
const mockUpdateIncome = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock('../../stores/api/expenseApi', () => ({
  useUpdateExpenseMutation: () => [mockUpdateExpense, { isLoading: false }],
  useDeleteExpenseMutation: () => [mockDeleteExpense, { isLoading: false }],
}));

jest.mock('../../stores/api/incomeApi', () => ({
  useUpdateIncomeMutation: () => [mockUpdateIncome, { isLoading: false }],
  useDeleteIncomeMutation: () => [jest.fn(), { isLoading: false }],
}));

jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData, columnDefs }) => {
    const Actions = columnDefs.find(({ colId }) => colId === 'transactionActions').cellRenderer;
    return (
      <>
        <div role="row">
          {columnDefs.map(({ colId, field, headerName }) => (
            <span key={colId ?? field} role="columnheader">{headerName}</span>
          ))}
        </div>
        {rowData.map((row) => <Actions key={row.transactionId} data={row} />)}
      </>
    );
  },
}));

const expenseLabels = [
  { id: 'food', L1: 'Food', L2: 'Groceries', L3: 'Produce', Active: 'N' },
  { id: 'fuel', L1: 'Travel', L2: 'Car', L3: 'Fuel' },
  { id: 'parking', L1: 'Travel', L2: 'Car', L3: 'Parking' },
  { id: 'ticket', L1: 'Travel', L2: 'Train', L3: 'Ticket' },
  { id: 'inactive', L1: 'Travel', L2: 'Car', L3: 'Old label', Active: 'N' },
];

function renderTransactions(rows, type = 'expense', labels = expenseLabels) {
  render(<TransactionReportGrid
    rows={rows}
    columns={[{ field: 'Expense', headerName: 'Amount' }]}
    type={type}
    labels={labels}
    onBehalfUsers={{ userKeyByName: { Me: 'me' } }}
  />);
}

function recentExpense() {
  return {
    transactionId: 'entry-1',
    version: '"original-version"',
    editExpiresAt: new Date(Date.now() + 60000).toISOString(),
    Expense: '12.50',
    Timestamp: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    labelId: 'food',
    onBehalfId: 'me',
  };
}

beforeEach(() => {
  const success = { unwrap: () => Promise.resolve() };
  mockUpdateExpense.mockReset().mockReturnValue(success);
  mockDeleteExpense.mockReset().mockReturnValue(success);
  mockUpdateIncome.mockReset().mockReturnValue(success);
});

function openActionMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Transaction actions' }));
  return within(screen.getByRole('menu', { name: 'Transaction actions' }));
}

test('eligible transactions show a menu in the last column', () => {
  const recent = recentExpense();
  renderTransactions([
    recent,
    { ...recent, transactionId: 'expired', editExpiresAt: new Date(Date.now() - 60000).toISOString() },
    { ...recent, transactionId: 'legacy', editExpiresAt: undefined },
  ]);
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Amount', 'Actions']);
  expect(screen.getAllByRole('button', { name: 'Transaction actions' })).toHaveLength(1);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  const menu = openActionMenu();
  expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
});

test('editing other fields preserves the current inactive label', async () => {
  const expense = recentExpense();
  renderTransactions([expense]);
  fireEvent.click(openActionMenu().getByRole('menuitem', { name: 'Edit' }));
  expect(screen.getByRole('combobox', { name: 'L1' })).toHaveTextContent('Food');
  expect(screen.getByRole('combobox', { name: 'L2' })).toHaveTextContent('Groceries');
  expect(screen.getByRole('combobox', { name: 'L3' })).toHaveTextContent('Produce');
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: '15.25' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalledWith({
    id: expense.transactionId,
    version: expense.version,
    changes: { amount: '15.25' },
  }));
});

test('editing rejects future dates and still accepts past timestamps', async () => {
  const expense = recentExpense();
  renderTransactions([expense]);
  fireEvent.click(openActionMenu().getByRole('menuitem', { name: 'Edit' }));
  const dateField = screen.getByLabelText(/Date and time/);
  const save = screen.getByRole('button', { name: 'Save changes' });
  const future = dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
  fireEvent.change(dateField, { target: { value: future } });
  expect(dateField.validity.rangeOverflow).toBe(true);
  fireEvent.submit(save.form);
  expect(screen.getByRole('alert')).toHaveTextContent('cannot be in the future');
  expect(mockUpdateExpense).not.toHaveBeenCalled();

  const past = dayjs().subtract(2, 'day');
  fireEvent.change(dateField, { target: { value: past.format('YYYY-MM-DDTHH:mm:ss') } });
  fireEvent.click(save);
  await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalledWith({
    id: expense.transactionId,
    version: expense.version,
    changes: { timestamp: past.format('YYYY-MM-DD HH:mm:ss') },
  }));
});

function openLabelDropdown(level) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: level }));
  return within(screen.getByRole('listbox', { name: level }));
}

test('changing expense label levels clears dependent choices and saves the selected label ID', async () => {
  const expense = recentExpense();
  renderTransactions([expense]);
  fireEvent.click(openActionMenu().getByRole('menuitem', { name: 'Edit' }));
  fireEvent.click(openLabelDropdown('L1').getByRole('option', { name: 'Travel' }));
  expect(screen.getByRole('combobox', { name: 'L2' })).not.toHaveTextContent('Groceries');
  expect(screen.getByRole('combobox', { name: 'L3' })).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Select all label levels.');
  expect(mockUpdateExpense).not.toHaveBeenCalled();

  const subcategories = openLabelDropdown('L2');
  expect(subcategories.queryByRole('option', { name: 'Groceries' })).not.toBeInTheDocument();
  fireEvent.click(subcategories.getByRole('option', { name: 'Car' }));
  const labels = openLabelDropdown('L3');
  expect(labels.queryByRole('option', { name: 'Ticket' })).not.toBeInTheDocument();
  expect(labels.queryByRole('option', { name: 'Old label' })).not.toBeInTheDocument();
  fireEvent.click(labels.getByRole('option', { name: 'Parking' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalledWith({
    id: expense.transactionId,
    version: expense.version,
    changes: { labelId: 'parking' },
  }));
});

test('income uses two label levels', async () => {
  const income = { ...recentExpense(), Income: '125.00', labelId: 'salary' };
  renderTransactions([income], 'income', [
    { id: 'salary', L1: 'Work', L2: 'Salary' },
    { id: 'bonus', L1: 'Work', L2: 'Bonus' },
  ]);
  fireEvent.click(openActionMenu().getByRole('menuitem', { name: 'Edit' }));
  expect(screen.queryByRole('combobox', { name: 'L3' })).not.toBeInTheDocument();
  fireEvent.click(openLabelDropdown('L2').getByRole('option', { name: 'Bonus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(mockUpdateIncome).toHaveBeenCalledWith({
    id: income.transactionId,
    version: income.version,
    changes: { labelId: 'bonus' },
  }));
});

test('deleting requires confirmation', async () => {
  const expense = recentExpense();
  renderTransactions([expense]);
  fireEvent.click(openActionMenu().getByRole('menuitem', { name: 'Delete' }));
  expect(mockDeleteExpense).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(mockDeleteExpense).toHaveBeenCalledWith({
    id: expense.transactionId,
    version: expense.version,
  }));
});
