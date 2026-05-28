import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavoriteButton } from '@/shared/components/FavoriteButton';

const pushMock = jest.fn();
const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();
const addMutateAsyncMock = jest.fn();
const removeMutateAsyncMock = jest.fn();

let mockUser: { id: string; email: string } | null = null;
let mockIsFavorite = false;
let addPending = false;
let removePending = false;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

jest.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('@/shared/lib/queries', () => ({
  useIsFavorite: () => ({ data: mockIsFavorite, isLoading: false }),
  useAddFavorite: () => ({
    mutateAsync: addMutateAsyncMock,
    isPending: addPending,
  }),
  useRemoveFavorite: () => ({
    mutateAsync: removeMutateAsyncMock,
    isPending: removePending,
  }),
}));

beforeEach(() => {
  pushMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  addMutateAsyncMock.mockReset();
  removeMutateAsyncMock.mockReset();
  mockUser = null;
  mockIsFavorite = false;
  addPending = false;
  removePending = false;
});

describe('FavoriteButton', () => {
  it('redirects to /login and shows error toast when not authenticated', async () => {
    const user = userEvent.setup();
    render(<FavoriteButton mangaId="m-1" />);
    await user.click(screen.getByRole('button'));
    expect(toastErrorMock).toHaveBeenCalledWith('Please login to add favorites');
    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(addMutateAsyncMock).not.toHaveBeenCalled();
  });

  it('adds a favorite when authenticated and not yet favorited', async () => {
    mockUser = { id: 'u1', email: 'a@b.com' };
    mockIsFavorite = false;
    addMutateAsyncMock.mockResolvedValue({});
    const user = userEvent.setup();
    render(<FavoriteButton mangaId="m-1" />);
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(addMutateAsyncMock).toHaveBeenCalledWith('m-1')
    );
    expect(toastSuccessMock).toHaveBeenCalledWith('Added to favorites');
  });

  it('removes a favorite when authenticated and already favorited', async () => {
    mockUser = { id: 'u1', email: 'a@b.com' };
    mockIsFavorite = true;
    removeMutateAsyncMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<FavoriteButton mangaId="m-1" />);
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(removeMutateAsyncMock).toHaveBeenCalledWith('m-1')
    );
    expect(toastSuccessMock).toHaveBeenCalledWith('Removed from favorites');
  });

  it('exposes "Add to favorites" aria-label when not yet favorited', () => {
    mockUser = { id: 'u1', email: 'a@b.com' };
    mockIsFavorite = false;
    render(<FavoriteButton mangaId="m-1" />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Add to favorites'
    );
  });

  it('exposes "Remove from favorites" aria-label when already favorited', () => {
    mockUser = { id: 'u1', email: 'a@b.com' };
    mockIsFavorite = true;
    render(<FavoriteButton mangaId="m-1" />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Remove from favorites'
    );
  });

  it('disables the button while a mutation is pending', () => {
    mockUser = { id: 'u1', email: 'a@b.com' };
    addPending = true;
    render(<FavoriteButton mangaId="m-1" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows the backend error message when the mutation rejects', async () => {
    mockUser = { id: 'u1', email: 'a@b.com' };
    mockIsFavorite = false;
    addMutateAsyncMock.mockRejectedValue({
      response: { data: { error: 'Already in favorites' } },
    });
    const user = userEvent.setup();
    render(<FavoriteButton mangaId="m-1" />);
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith('Already in favorites')
    );
  });
});
