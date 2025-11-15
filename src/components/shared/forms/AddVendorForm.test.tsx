import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddVendorForm } from './AddVendorForm';

describe('AddVendorForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render all form fields', () => {
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/vendor name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /add vendor/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have required markers on required fields', () => {
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameLabel = screen.getByText(/vendor name/i);
      const websiteLabel = screen.getByText(/website/i);

      expect(nameLabel.textContent).toContain('*');
      expect(websiteLabel.textContent).toContain('*');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when name is empty', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      expect(await screen.findByText(/vendor name is required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error when website is empty', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/vendor name/i);
      await user.type(nameInput, 'Test Vendor');

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      expect(await screen.findByText(/website is required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid website URL', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/vendor name/i);
      const websiteInput = screen.getByLabelText(/website/i);

      await user.type(nameInput, 'Test Vendor');
      await user.type(websiteInput, 'not-a-valid-url');

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      expect(await screen.findByText(/please enter a valid url/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/vendor name/i);
      const websiteInput = screen.getByLabelText(/website/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(nameInput, 'Acme Corp');
      await user.type(websiteInput, 'https://acme.com');
      await user.type(descriptionInput, 'Leading provider');

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Acme Corp',
          website: 'https://acme.com',
          description: 'Leading provider',
        });
      });
    });

    it('should call onSubmit without description if not provided', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/vendor name/i);
      const websiteInput = screen.getByLabelText(/website/i);

      await user.type(nameInput, 'Acme Corp');
      await user.type(websiteInput, 'https://acme.com');

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Acme Corp',
          website: 'https://acme.com',
          description: '',
        });
      });
    });

    it('should handle async onSubmit', async () => {
      const user = userEvent.setup();
      const asyncOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<AddVendorForm onSubmit={asyncOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/vendor name/i);
      const websiteInput = screen.getByLabelText(/website/i);

      await user.type(nameInput, 'Acme Corp');
      await user.type(websiteInput, 'https://acme.com');

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(asyncOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable form when isLoading is true', () => {
      render(
        <AddVendorForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const nameInput = screen.getByLabelText(/vendor name/i);
      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /adding/i });

      expect(nameInput).toBeDisabled();
      expect(websiteInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should show loading text on submit button when isLoading', () => {
      render(
        <AddVendorForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
    });
  });

  describe('Initial Values', () => {
    it('should populate form with initialValues', () => {
      const initialValues = {
        name: 'Existing Vendor',
        website: 'https://existing.com',
        description: 'Existing description',
      };

      render(
        <AddVendorForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
        />
      );

      expect(screen.getByDisplayValue('Existing Vendor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://existing.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });

    it('should update submit button text when editing', () => {
      const initialValues = {
        name: 'Existing Vendor',
        website: 'https://existing.com',
      };

      render(
        <AddVendorForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
        />
      );

      expect(screen.getByRole('button', { name: /update vendor/i })).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      render(<AddVendorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/vendor name/i) as HTMLInputElement;
      const websiteInput = screen.getByLabelText(/website/i) as HTMLInputElement;

      await user.type(nameInput, 'Acme Corp');
      await user.type(websiteInput, 'https://acme.com');

      const submitButton = screen.getByRole('button', { name: /add vendor/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(websiteInput.value).toBe('');
      });
    });
  });
});
