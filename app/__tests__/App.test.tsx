// Import necessary libraries
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import App from './App';

// Test for Player Inputs
test('enters player names and verifies display', () => {
  render(<App />);
  const player1Input = screen.getByPlaceholderText('Player 1');
  const player2Input = screen.getByPlaceholderText('Player 2');

  fireEvent.change(player1Input, { target: { value: 'Alice' } });
  fireEvent.change(player2Input, { target: { value: 'Bob' } });

  expect(player1Input).toHaveValue('Alice');
  expect(player2Input).toHaveValue('Bob');
});

// Test for Bidding Inputs
test('enters bids and verifies display', () => {
  render(<App />);
  const bid1Input = screen.getByPlaceholderText('Player 1');
  const bid2Input = screen.getByPlaceholderText('Player 2');

  fireEvent.change(bid1Input, { target: { value: '3' } });
  fireEvent.change(bid2Input, { target: { value: '4' } });

  expect(bid1Input).toHaveValue('3');
  expect(bid2Input).toHaveValue('4');
});

// Test for Points Calculation
test('calculates points based on bids', async () => {
  render(<App />);
  const madeBidToggles = screen.getAllByLabelText('Made bid:');

  fireEvent.click(madeBidToggles[0]);

  const pointsDisplay1 = screen.getByText('Score: 10');
  const pointsDisplay2 = screen.getByText('Score: 0');

  await waitFor(() => {
      expect(screen.getByText('Score: 10')).toBeInTheDocument();
      expect(screen.getByText('Score: 0')).toBeInTheDocument();
    });
});

// Test for Finish Game Button
test('logs game data when finish game button is clicked', () => {
  const consoleSpy = jest.spyOn(console, 'log');
  render(<App />);

  const finishGameButton = screen.getByText('Finish Game');
  fireEvent.click(finishGameButton);

  expect(consoleSpy).toHaveBeenCalledWith(expect.any(Object));
  consoleSpy.mockRestore();
});