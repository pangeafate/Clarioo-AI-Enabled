import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AddVendorFormData {
  name: string;
  website: string;
  description?: string;
}

export interface AddVendorFormProps {
  /**
   * Callback fired when form is submitted with valid data
   */
  onSubmit: (data: AddVendorFormData) => void | Promise<void>;

  /**
   * Callback fired when cancel button is clicked
   */
  onCancel: () => void;

  /**
   * Whether the form is in loading state (e.g., submitting)
   */
  isLoading?: boolean;

  /**
   * Initial values for editing an existing vendor
   */
  initialValues?: Partial<AddVendorFormData>;
}

/**
 * AddVendorForm - Reusable vendor form component
 *
 * A form component for adding or editing vendor information with validation.
 *
 * @example
 * ```tsx
 * // Adding new vendor
 * <AddVendorForm
 *   onSubmit={(data) => handleAddVendor(data)}
 *   onCancel={() => setShowDialog(false)}
 * />
 *
 * // Editing existing vendor
 * <AddVendorForm
 *   onSubmit={(data) => handleUpdateVendor(data)}
 *   onCancel={() => setShowDialog(false)}
 *   initialValues={{
 *     name: 'Acme Corp',
 *     website: 'https://acme.com',
 *     description: 'Leading provider'
 *   }}
 *   isLoading={isUpdating}
 * />
 * ```
 */
export const AddVendorForm: React.FC<AddVendorFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialValues,
}) => {
  const [formData, setFormData] = useState<AddVendorFormData>({
    name: initialValues?.name || '',
    website: initialValues?.website || '',
    description: initialValues?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name || '',
        website: initialValues.website || '',
        description: initialValues.description || '',
      });
    }
  }, [initialValues]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    if (!formData.website.trim()) {
      newErrors.website = 'Website is required';
    } else {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.website)) {
        newErrors.website = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);

    // Clear form after successful submission (only if not editing)
    if (!initialValues) {
      setFormData({
        name: '',
        website: '',
        description: '',
      });
      setErrors({});
    }
  };

  const handleChange = (field: keyof AddVendorFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isEditing = !!initialValues;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {/* Vendor Name */}
      <div className="space-y-2">
        <Label htmlFor="vendor-name">
          Vendor Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="vendor-name"
          value={formData.name}
          onChange={handleChange('name')}
          placeholder="Enter vendor name"
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="vendor-website">
          Website <span className="text-destructive">*</span>
        </Label>
        <Input
          id="vendor-website"
          value={formData.website}
          onChange={handleChange('website')}
          placeholder="https://example.com"
          disabled={isLoading}
          aria-invalid={!!errors.website}
          aria-describedby={errors.website ? 'website-error' : undefined}
        />
        {errors.website && (
          <p id="website-error" className="text-sm text-destructive">
            {errors.website}
          </p>
        )}
      </div>

      {/* Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="vendor-description">Description</Label>
        <Input
          id="vendor-description"
          value={formData.description}
          onChange={handleChange('description')}
          placeholder="Brief description"
          disabled={isLoading}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : isEditing ? 'Update Vendor' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  );
};
