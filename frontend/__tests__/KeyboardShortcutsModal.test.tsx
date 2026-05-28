import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsModal } from '@/features/reader/components/KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  it('lists every shortcut entry', () => {
    render(<KeyboardShortcutsModal onClose={() => {}} />);
    expect(screen.getByText('Next page')).toBeInTheDocument();
    expect(screen.getByText('Previous page')).toBeInTheDocument();
    expect(screen.getByText('Toggle quality')).toBeInTheDocument();
    expect(screen.getByText('First page')).toBeInTheDocument();
    expect(screen.getByText('Last page')).toBeInTheDocument();
    expect(screen.getByText('Back to manga')).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<KeyboardShortcutsModal onClose={onClose} />);
    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledOnce?.() ?? expect(onClose).toHaveBeenCalledTimes(1);
  });
});
