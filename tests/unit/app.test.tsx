import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import App from '../../src/app/App';

it('renders the application entry point', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'ツール一覧' })).toBeInTheDocument();
});
