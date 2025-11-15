# EmptyState Component

A reusable empty state component for when there's no data to display, with optional call-to-action button.

## Features

- ✅ Consistent empty UI across the application
- ✅ Optional action button with configurable variants
- ✅ Customizable icon, title, and description
- ✅ Fully accessible with ARIA attributes
- ✅ TypeScript support with comprehensive prop types

## Usage

### Basic Usage

```tsx
import { EmptyState } from '@/components/shared/empty/EmptyState';

function MyComponent() {
  return <EmptyState />;
}
```

### With Custom Title and Description

```tsx
<EmptyState
  title="No vendors found"
  description="Start by adding your first vendor to begin comparing options"
/>
```

### With Custom Icon

```tsx
import { Search } from 'lucide-react';

<EmptyState
  icon={<Search className="h-12 w-12 text-muted-foreground" />}
  title="No search results"
  description="Try adjusting your search criteria"
/>
```

### With Action Button

```tsx
<EmptyState
  title="No projects yet"
  description="Create your first project to get started"
  action={{
    label: 'Create Project',
    onClick: () => handleCreateProject(),
    variant: 'default'
  }}
/>
```

### With All Props

```tsx
import { Inbox } from 'lucide-react';

<EmptyState
  icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
  title="No messages"
  description="When you receive messages, they'll appear here"
  action={{
    label: 'Compose Message',
    onClick: () => openComposer(),
    variant: 'outline'
  }}
  className="min-h-[400px]"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"No items found"` | The title to display |
| `description` | `string` | `"There are no items to display at this time."` | Optional description text shown below the title |
| `icon` | `React.ReactNode` | `<FileQuestion />` | Custom icon or React node to display |
| `action` | `object` | `undefined` | Optional action button configuration (see below) |
| `className` | `string` | `undefined` | Additional CSS classes for the container |

### Action Object

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | *required* | Button text |
| `onClick` | `() => void` | *required* | Click handler function |
| `variant` | `'default' \| 'outline' \| 'secondary'` | `'default'` | Button style variant |

## Action Button Variants

### Default (`default`)
- Primary button with filled background
- Use case: Primary call-to-action (Create, Add, etc.)

### Outline (`outline`)
- Outlined button with transparent background
- Use case: Secondary actions

### Secondary (`secondary`)
- Secondary styled button
- Use case: Tertiary actions or less prominent CTAs

## Accessibility

The component implements proper accessibility features:

- `role="status"` - Indicates empty state to screen readers
- `aria-live="polite"` - Announces changes without interrupting
- `aria-label` - Provides accessible name using the title
- Icon includes `aria-hidden="true"` to prevent redundant announcements

## Migration from Inline Empty States

### Before (Inline Implementation)

```tsx
{vendors.length === 0 && (
  <div className="text-center py-8">
    <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-lg font-semibold">No vendors found</p>
    <p className="text-sm text-muted-foreground mt-2">
      Start by adding your first vendor
    </p>
  </div>
)}
```

### After (Using EmptyState)

```tsx
{vendors.length === 0 && (
  <EmptyState
    title="No vendors found"
    description="Start by adding your first vendor"
  />
)}
```

## Testing

The component includes comprehensive tests covering:

- Basic rendering with default and custom props
- Icon rendering
- Action button rendering and interaction
- Button variants
- Custom styling
- Accessibility attributes
- Text styling

Run tests with:

```bash
npm test EmptyState.test.tsx
```

## Examples from Codebase

### VendorSelection - No Vendors Available

**Before:**
```tsx
{vendors.length === 0 && (
  <div className="text-center py-12">
    <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-lg font-semibold">No vendors found</p>
    <p className="text-sm text-muted-foreground mt-2">
      Try adjusting your search criteria or add a new vendor manually
    </p>
  </div>
)}
```

**After:**
```tsx
{vendors.length === 0 && (
  <EmptyState
    title="No vendors found"
    description="Try adjusting your search criteria or add a new vendor manually"
  />
)}
```

### VendorTable - No Search Results

**Before:**
```tsx
{filteredVendors.length === 0 && (
  <div className="text-center py-12">
    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-lg font-semibold">No vendors match your criteria</p>
    <p className="text-sm text-muted-foreground mt-2">
      Try adjusting your filters or search terms
    </p>
  </div>
)}
```

**After:**
```tsx
{filteredVendors.length === 0 && (
  <EmptyState
    icon={<Search className="h-12 w-12 text-muted-foreground" />}
    title="No vendors match your criteria"
    description="Try adjusting your filters or search terms"
  />
)}
```

### With Action Button Example

```tsx
{projects.length === 0 && (
  <EmptyState
    title="No projects yet"
    description="Create your first project to start discovering vendors"
    action={{
      label: 'Create Project',
      onClick: () => setShowCreateDialog(true),
      variant: 'default'
    }}
    className="min-h-[400px]"
  />
)}
```

## Best Practices

1. **Use descriptive titles** - Clearly state what's empty
   ```tsx
   // Good
   <EmptyState title="No vendors found" />

   // Less helpful
   <EmptyState title="Empty" />
   ```

2. **Provide actionable descriptions** - Guide users on next steps
   ```tsx
   <EmptyState
     title="No search results"
     description="Try different keywords or check your spelling"
   />
   ```

3. **Add action buttons for common workflows**
   ```tsx
   <EmptyState
     title="No vendors yet"
     description="Add vendors to start comparing options"
     action={{
       label: 'Add Vendor',
       onClick: openAddVendorDialog,
       variant: 'default'
     }}
   />
   ```

4. **Choose appropriate icons for context**
   - Search results: `<Search />` icon
   - No items: `<FileQuestion />` (default) or `<Inbox />`
   - No data: `<Database />` or `<Table />`
   - Empty list: `<List />` or `<Folder />`

5. **Apply container padding via className**
   ```tsx
   <EmptyState
     title="No data"
     className="min-h-[400px] py-12"
   />
   ```

## Button Variant Selection Guide

| Scenario | Variant | Example |
|----------|---------|---------|
| Primary action (create, add) | `default` | "Create Project", "Add Vendor" |
| Secondary action (filter, search) | `outline` | "Clear Filters", "Try Different Search" |
| Tertiary action | `secondary` | "Learn More", "View Examples" |

## Related Components

- `LoadingState` - For when data is loading
- `Button` - Standalone button component
- Card components - For container styling

## Dependencies

- `lucide-react` - For the FileQuestion icon
- `@/components/ui/button` - For the action button
- `@/lib/utils` - For the `cn` utility function
