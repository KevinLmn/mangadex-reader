import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/shared/components/SearchBar';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
});

describe('SearchBar', () => {
  it('renders an empty input when no initialQuery', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search manga/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('renders the initialQuery if provided', () => {
    render(<SearchBar initialQuery="naruto" />);
    const input = screen.getByPlaceholderText(/search manga/i) as HTMLInputElement;
    expect(input.value).toBe('naruto');
  });

  it('does not show the clear button when input is empty', () => {
    render(<SearchBar />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the clear button after typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText(/search manga/i), 'one');
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('clears the input when X is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar initialQuery="bleach" />);
    const input = screen.getByPlaceholderText(/search manga/i) as HTMLInputElement;
    expect(input.value).toBe('bleach');
    await user.click(screen.getByRole('button'));
    expect(input.value).toBe('');
  });

  it('navigates to /search?q=... on submit, with URL encoding', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search manga/i);
    await user.type(input, 'one piece');
    await user.keyboard('{Enter}');
    expect(pushMock).toHaveBeenCalledWith('/search?q=one%20piece');
  });

  it('does not navigate when query is whitespace only', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText(/search manga/i), '   ');
    await user.keyboard('{Enter}');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('trims whitespace before submitting', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText(/search manga/i), '  naruto  ');
    await user.keyboard('{Enter}');
    expect(pushMock).toHaveBeenCalledWith('/search?q=naruto');
  });
});
