import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search, Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  describe('Basic Rendering', () => {
    it('should render with default title and description', () => {
      render(<EmptyState />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<EmptyState title="No vendors available" />);
      expect(screen.getByText('No vendors available')).toBeInTheDocument();
    });

    it('should render with custom description', () => {
      render(<EmptyState description="Start by adding your first vendor" />);
      expect(screen.getByText('Start by adding your first vendor')).toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      render(
        <EmptyState
          title="No results"
          description="Try adjusting your search criteria"
        />
      );
      expect(screen.getByText('No results')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render default icon when no icon provided', () => {
      const { container } = render(<EmptyState />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render custom icon component', () => {
      render(<EmptyState icon={<Search data-testid="search-icon" />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should render lucide icon', () => {
      render(<EmptyState icon={<Inbox data-testid="inbox-icon" />} />);
      expect(screen.getByTestId('inbox-icon')).toBeInTheDocument();
    });

    it('should apply correct icon styling', () => {
      const { container } = render(<EmptyState />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-12', 'w-12', 'text-muted-foreground');
    });
  });

  describe('Action Button', () => {
    it('should not render action button when action prop not provided', () => {
      render(<EmptyState />);
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should render action button with label', () => {
      const mockOnClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Add Vendor',
            onClick: mockOnClick,
          }}
        />
      );
      expect(screen.getByRole('button', { name: 'Add Vendor' })).toBeInTheDocument();
    });

    it('should call onClick when action button clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Create Item',
            onClick: mockOnClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Create Item' });
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should apply default variant to button', () => {
      const mockOnClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Add Item',
            onClick: mockOnClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply outline variant to button', () => {
      const mockOnClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Add Item',
            onClick: mockOnClick,
            variant: 'outline',
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toHaveClass('border-input');
    });

    it('should apply secondary variant to button', () => {
      const mockOnClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Add Item',
            onClick: mockOnClick,
            variant: 'secondary',
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toHaveClass('bg-secondary');
    });
  });

  describe('Styling', () => {
    it('should apply custom className to container', () => {
      const { container } = render(<EmptyState className="custom-class" />);
      const emptyStateContainer = container.firstChild;
      expect(emptyStateContainer).toHaveClass('custom-class');
    });

    it('should maintain base classes with custom className', () => {
      const { container } = render(<EmptyState className="custom-class" />);
      const emptyStateContainer = container.firstChild;
      expect(emptyStateContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'custom-class');
    });

    it('should center content with flexbox', () => {
      const { container } = render(<EmptyState />);
      const emptyStateContainer = container.firstChild;
      expect(emptyStateContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('should apply text-center to text content', () => {
      const { container } = render(<EmptyState title="Test" />);
      const titleElement = screen.getByText('Test');
      expect(titleElement).toHaveClass('text-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const { container } = render(<EmptyState />);
      const emptyStateContainer = container.firstChild;
      expect(emptyStateContainer).toHaveAttribute('role', 'status');
    });

    it('should have aria-live attribute', () => {
      const { container } = render(<EmptyState />);
      const emptyStateContainer = container.firstChild;
      expect(emptyStateContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label with title', () => {
      const { container } = render(<EmptyState title="No results found" />);
      const emptyStateContainer = container.firstChild;
      expect(emptyStateContainer).toHaveAttribute('aria-label', 'No results found');
    });
  });

  describe('Text Styling', () => {
    it('should apply correct styles to title', () => {
      render(<EmptyState title="Test Title" />);
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-center');
    });

    it('should apply correct styles to description', () => {
      render(<EmptyState description="Test description" />);
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground', 'text-center');
    });
  });

  describe('Complete Examples', () => {
    it('should render complete empty state with all props', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(
        <EmptyState
          title="No vendors found"
          description="Start by adding your first vendor to begin comparing options"
          icon={<Search data-testid="search-icon" />}
          action={{
            label: 'Add Vendor',
            onClick: mockOnClick,
            variant: 'default',
          }}
          className="min-h-[400px]"
        />
      );

      // Verify all elements are present
      expect(screen.getByText('No vendors found')).toBeInTheDocument();
      expect(screen.getByText('Start by adding your first vendor to begin comparing options')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Add Vendor' });
      expect(button).toBeInTheDocument();

      // Verify interaction
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });
});
