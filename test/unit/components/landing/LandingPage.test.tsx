/**
 * UNIT TESTS: LandingPage Component
 *
 * Purpose: Test authentication-gated visibility of landing page sections
 *
 * Coverage:
 * - ArtifactVisualization visibility based on auth state
 * - Section should be visible when user is NOT authenticated
 * - Section should be hidden when user IS authenticated
 *
 * User Story: US-11.1
 * @see 00_PLAN/USER_STORIES.md - Epic 11: Landing Page Experience
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPage } from '@/components/landing/LandingPage';
import { useAuth } from '@/hooks/useAuth';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock child components to simplify testing
vi.mock('@/components/landing/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero</div>
}));

vi.mock('@/components/landing/RegistrationToggle', () => ({
  RegistrationToggle: () => <div data-testid="registration-toggle">Toggle</div>
}));

vi.mock('@/components/landing/AnimatedInputs', () => ({
  AnimatedInputs: () => <div data-testid="animated-inputs">Inputs</div>
}));

vi.mock('@/components/landing/ArtifactVisualization', () => ({
  ArtifactVisualization: () => (
    <section data-testid="artifact-visualization">
      <h2>See Every Step of the Process</h2>
    </section>
  )
}));

vi.mock('@/components/landing/CardCarousel', () => ({
  CardCarousel: () => <div data-testid="card-carousel">Carousel</div>
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ArtifactVisualization Section Visibility (US-11.1)', () => {
    it('should display ArtifactVisualization when user is NOT authenticated', () => {
      // Arrange: Mock user as null (not authenticated)
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn()
      });

      // Act: Render LandingPage
      render(<LandingPage />);

      // Assert: ArtifactVisualization section should be visible
      const artifactSection = screen.queryByTestId('artifact-visualization');
      expect(artifactSection).toBeInTheDocument();
      expect(artifactSection).toHaveTextContent('See Every Step of the Process');
    });

    it('should hide ArtifactVisualization when user IS authenticated', () => {
      // Arrange: Mock user as authenticated
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {}
        },
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn()
      });

      // Act: Render LandingPage
      render(<LandingPage />);

      // Assert: ArtifactVisualization section should NOT be visible
      const artifactSection = screen.queryByTestId('artifact-visualization');
      expect(artifactSection).not.toBeInTheDocument();
    });
  });

  describe('Other Landing Page Sections', () => {
    it('should always render HeroSection regardless of auth state', () => {
      // Test with unauthenticated user
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn()
      });

      const { rerender } = render(<LandingPage />);
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();

      // Test with authenticated user
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {}
        },
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn()
      });

      rerender(<LandingPage />);
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should always render CardCarousel regardless of auth state', () => {
      // Test with unauthenticated user
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn()
      });

      const { rerender } = render(<LandingPage />);
      expect(screen.getByTestId('card-carousel')).toBeInTheDocument();

      // Test with authenticated user
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {}
        },
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn()
      });

      rerender(<LandingPage />);
      expect(screen.getByTestId('card-carousel')).toBeInTheDocument();
    });
  });
});
