import React from 'react';
import dayjs from 'dayjs';
import { fireEvent, render, screen } from '@testing-library/react';
import DateTime from './DateTime';

jest.mock('@mui/x-date-pickers/internals/demo', () => ({
  DemoContainer: ({ children }) => children,
  DemoItem: ({ children }) => children,
}));

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2026, 10, 19, 16, 30));
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  jest.useRealTimers();
});

function openMobileClock(value) {
  render(
    <DateTime
      id="test-date-time"
      label="Date Time"
      value={value}
      handler={jest.fn()}
      e_handler={jest.fn()}
    />
  );
  fireEvent.click(screen.getByRole('textbox', { name: /^Choose date/ }));
  fireEvent.click(screen.getByRole('tab', { name: 'pick time' }));
}

test('a past date allows hours later than the current time of day', () => {
  openMobileClock(dayjs().subtract(1, 'day'));

  expect(screen.getByRole('option', { name: '11 hours' })).not.toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('button', { name: '30' }));
  expect(screen.getByRole('option', { name: '55 minutes' })).not.toHaveAttribute('aria-disabled', 'true');
});

test('today still blocks future hours', () => {
  openMobileClock(dayjs());

  expect(screen.getByRole('option', { name: '11 hours' })).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('button', { name: '30' }));
  expect(screen.getByRole('option', { name: '55 minutes' })).toHaveAttribute('aria-disabled', 'true');
});
