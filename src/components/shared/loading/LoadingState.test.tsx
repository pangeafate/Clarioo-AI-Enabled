import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader2, Clock } from 'lucide-react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  describe('Basic Rendering', () => {
    it('should render with default message', () => {
      render(<LoadingState />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingState message="Loading vendors" />);
      expect(screen.getByText('Loading vendors')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(
        <LoadingState
          message="Loading vendors"
          description="This may take a few moments"
        />
      );
      expect(screen.getByText('Loading vendors')).toBeInTheDocument();
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render default Loader2 icon', () => {
      const { container } = render(<LoadingState />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('animate-spin');
    });

    it('should render custom icon', () => {
      render(<LoadingState icon={Clock} />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });

    it('should apply animate-spin class to default icon', () => {
      const { container } = render(<LoadingState />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('Progress Bar', () => {
    it('should not show progress bar by default', () => {
      const { container } = render(<LoadingState />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should show progress bar when showProgress is true', () => {
      render(<LoadingState showProgress={true} progress={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display correct progress value', () => {
      render(<LoadingState showProgress={true} progress={75} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should default to 0 progress when not specified', () => {
      render(<LoadingState showProgress={true} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should have aria-valuemin and aria-valuemax attributes', () => {
      render(<LoadingState showProgress={true} progress={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Size Variants', () => {
    it('should apply default (md) size classes', () => {
      const { container } = render(<LoadingState />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('should apply sm size classes', () => {
      const { container } = render(<LoadingState size="sm" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('should apply md size classes', () => {
      const { container } = render(<LoadingState size="md" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('should apply lg size classes', () => {
      const { container } = render(<LoadingState size="lg" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Styling', () => {
    it('should apply custom className to container', () => {
      const { container } = render(<LoadingState className="custom-class" />);
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveClass('custom-class');
    });

    it('should maintain base classes with custom className', () => {
      const { container } = render(<LoadingState className="custom-class" />);
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'custom-class');
    });

    it('should center content with flexbox', () => {
      const { container } = render(<LoadingState />);
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const { container } = render(<LoadingState />);
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveAttribute('role', 'status');
    });

    it('should have aria-live attribute', () => {
      const { container } = render(<LoadingState />);
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label with message', () => {
      const { container } = render(<LoadingState message="Loading data" />);
      const loadingContainer = container.firstChild;
      expect(loadingContainer).toHaveAttribute('aria-label', 'Loading data');
    });
  });

  describe('Text Styling', () => {
    it('should apply correct text size for message based on size prop', () => {
      const { container, rerender } = render(<LoadingState size="sm" />);
      let messageEl = screen.getByText('Loading...');
      expect(messageEl).toHaveClass('text-sm');

      rerender(<LoadingState size="md" />);
      messageEl = screen.getByText('Loading...');
      expect(messageEl).toHaveClass('text-base');

      rerender(<LoadingState size="lg" />);
      messageEl = screen.getByText('Loading...');
      expect(messageEl).toHaveClass('text-lg');
    });

    it('should style description text correctly', () => {
      render(<LoadingState description="Please wait" />);
      const description = screen.getByText('Please wait');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });
});
