import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendingUp, Users, Award, DollarSign } from 'lucide-react';
import { StatsCard } from './StatsCard';

describe('StatsCard', () => {
  describe('Basic Rendering', () => {
    it('should render with value and label', () => {
      render(<StatsCard value="100" label="Total Items" icon={Users} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Total Items')).toBeInTheDocument();
    });

    it('should render with numeric value', () => {
      render(<StatsCard value={42} label="Score" icon={Award} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render with string value', () => {
      render(<StatsCard value="$1,234" label="Revenue" icon={DollarSign} />);
      expect(screen.getByText('$1,234')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} />
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should apply default icon color (primary)', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} />
      );
      const iconContainer = container.querySelector('[class*="bg-primary"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply success icon color', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} iconColor="success" />
      );
      const iconContainer = container.querySelector('[class*="bg-green"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply warning icon color', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} iconColor="warning" />
      );
      const iconContainer = container.querySelector('[class*="bg-yellow"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply destructive icon color', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} iconColor="destructive" />
      );
      const iconContainer = container.querySelector('[class*="bg-red"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply muted icon color', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} iconColor="muted" />
      );
      const iconContainer = container.querySelector('[class*="bg-muted"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Trend Rendering', () => {
    it('should not render trend when not provided', () => {
      render(<StatsCard value="10" label="Count" icon={Users} />);
      const trend = screen.queryByText(/\+|-/);
      expect(trend).not.toBeInTheDocument();
    });

    it('should render positive trend', () => {
      render(
        <StatsCard
          value="100"
          label="Sales"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
      );
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    it('should render negative trend', () => {
      render(
        <StatsCard
          value="50"
          label="Errors"
          icon={Award}
          trend={{ value: 5.2, isPositive: false }}
        />
      );
      expect(screen.getByText('-5.2%')).toBeInTheDocument();
    });

    it('should apply correct color to positive trend', () => {
      render(
        <StatsCard
          value="100"
          label="Sales"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
      );
      const trendElement = screen.getByText('+12.5%');
      expect(trendElement).toHaveClass('text-green-600');
    });

    it('should apply correct color to negative trend', () => {
      render(
        <StatsCard
          value="50"
          label="Errors"
          icon={Award}
          trend={{ value: 5.2, isPositive: false }}
        />
      );
      const trendElement = screen.getByText('-5.2%');
      expect(trendElement).toHaveClass('text-red-600');
    });

    it('should render trend icon for positive', () => {
      const { container } = render(
        <StatsCard
          value="100"
          label="Sales"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
      );
      // TrendingUp icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1); // Main icon + trend icon
    });

    it('should render trend icon for negative', () => {
      const { container } = render(
        <StatsCard
          value="50"
          label="Errors"
          icon={Award}
          trend={{ value: 5.2, isPositive: false }}
        />
      );
      // TrendingDown icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1); // Main icon + trend icon
    });
  });

  describe('Styling', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} className="custom-class" />
      );
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should maintain base Card classes', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} />
      );
      const card = container.querySelector('[class*="border"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Text Styling', () => {
    it('should apply correct styles to value', () => {
      render(<StatsCard value="1,234" label="Total" icon={Users} />);
      const value = screen.getByText('1,234');
      expect(value).toHaveClass('text-2xl', 'font-bold');
    });

    it('should apply correct styles to label', () => {
      render(<StatsCard value="100" label="Items" icon={Users} />);
      const label = screen.getByText('Items');
      expect(label).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('Complete Examples', () => {
    it('should render complete stats card with all props', () => {
      render(
        <StatsCard
          value="1,234"
          label="Total Users"
          icon={Users}
          iconColor="primary"
          trend={{ value: 15.3, isPositive: true }}
          className="min-w-[200px]"
        />
      );

      // Verify all elements
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('+15.3%')).toBeInTheDocument();
    });

    it('should render stats card with negative trend', () => {
      render(
        <StatsCard
          value="42"
          label="Open Issues"
          icon={Award}
          iconColor="destructive"
          trend={{ value: 8.1, isPositive: false }}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Open Issues')).toBeInTheDocument();
      expect(screen.getByText('-8.1%')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should use horizontal flex layout', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} />
      );
      const content = container.querySelector('[class*="flex"]');
      expect(content).toBeInTheDocument();
    });

    it('should have proper spacing between elements', () => {
      const { container } = render(
        <StatsCard value="10" label="Count" icon={Users} />
      );
      const content = container.querySelector('[class*="gap"]');
      expect(content).toBeInTheDocument();
    });
  });
});
