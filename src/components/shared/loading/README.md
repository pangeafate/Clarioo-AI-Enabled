# LoadingState Component

A reusable loading indicator component with optional progress tracking and customizable appearance.

## Features

- ✅ Consistent loading UI across the application
- ✅ Optional progress bar for trackable operations
- ✅ Customizable icon, message, and description
- ✅ Three size variants (sm, md, lg)
- ✅ Fully accessible with ARIA attributes
- ✅ TypeScript support with comprehensive prop types

## Usage

### Basic Usage

```tsx
import { LoadingState } from '@/components/shared/loading/LoadingState';

function MyComponent() {
  return <LoadingState />;
}
```

### With Custom Message

```tsx
<LoadingState message="Loading vendors..." />
```

### With Description

```tsx
<LoadingState
  message="Processing data"
  description="This may take a moment"
/>
```

### With Progress Bar

```tsx
<LoadingState
  message="Uploading files..."
  showProgress={true}
  progress={75}
/>
```

### Custom Icon and Size

```tsx
import { Clock } from 'lucide-react';

<LoadingState
  icon={Clock}
  size="lg"
  message="Please wait"
/>
```

### With Custom Styling

```tsx
<LoadingState
  message="Loading..."
  className="min-h-[400px]"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `"Loading..."` | The message to display |
| `description` | `string` | `undefined` | Optional description text shown below the message |
| `icon` | `LucideIcon` | `Loader2` | Custom icon component |
| `showProgress` | `boolean` | `false` | Whether to show a progress bar |
| `progress` | `number` | `0` | Progress value (0-100). Only used when `showProgress` is true |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant for the loading indicator |
| `className` | `string` | `undefined` | Additional CSS classes for the container |

## Size Variants

### Small (`sm`)
- Icon: 24x24px (h-6 w-6)
- Text: text-sm
- Gap: gap-2
- Use case: Inline loading states, small containers

### Medium (`md`) - Default
- Icon: 32x32px (h-8 w-8)
- Text: text-base
- Gap: gap-3
- Use case: Standard loading states, modal dialogs

### Large (`lg`)
- Icon: 48x48px (h-12 w-12)
- Text: text-lg
- Gap: gap-4
- Use case: Full-page loading states, splash screens

## Accessibility

The component implements proper accessibility features:

- `role="status"` - Indicates loading state to screen readers
- `aria-live="polite"` - Announces changes without interrupting
- `aria-label` - Provides accessible name using the message
- Progress bar includes `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

## Migration from Inline Loading States

### Before (Inline Implementation)

```tsx
<div className="flex items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  <span className="ml-2">Loading vendors...</span>
</div>
```

### After (Using LoadingState)

```tsx
<LoadingState message="Loading vendors..." />
```

## Testing

The component includes comprehensive tests covering:

- Basic rendering with default and custom messages
- Icon rendering and animation
- Progress bar visibility and values
- Size variants
- Custom styling
- Accessibility attributes
- Text styling

Run tests with:

```bash
npm test LoadingState.test.tsx
```

## Examples from Codebase

### ProjectDashboard (src/components/ProjectDashboard.tsx:170-177)

**Before:**
```tsx
<div className="flex items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  <span className="ml-2">Loading project data...</span>
</div>
```

**After:**
```tsx
<LoadingState message="Loading project data..." />
```

### VendorSelection (src/components/vendor-discovery/VendorSelection.tsx:174-190)

**Before:**
```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  <span className="ml-2">Loading vendors...</span>
</div>
```

**After:**
```tsx
<LoadingState message="Loading vendors..." className="py-12" />
```

### CriteriaBuilder (src/components/vendor-discovery/CriteriaBuilder.tsx:551-566)

**Before:**
```tsx
<div className="flex items-center justify-center p-8">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  <span className="ml-2">Generating criteria...</span>
</div>
```

**After:**
```tsx
<LoadingState message="Generating criteria..." className="p-8" />
```

## Best Practices

1. **Use descriptive messages** - Tell users what's loading
   ```tsx
   // Good
   <LoadingState message="Loading vendor data..." />

   // Less helpful
   <LoadingState message="Loading..." />
   ```

2. **Add descriptions for long operations**
   ```tsx
   <LoadingState
     message="Processing data"
     description="This may take up to 30 seconds"
   />
   ```

3. **Use progress bars for trackable operations**
   ```tsx
   <LoadingState
     message="Uploading files..."
     showProgress={true}
     progress={uploadProgress}
   />
   ```

4. **Choose appropriate size for context**
   - Full-page loading: `size="lg"`
   - Modal/card loading: `size="md"` (default)
   - Inline/compact loading: `size="sm"`

5. **Apply container padding via className**
   ```tsx
   <LoadingState
     message="Loading..."
     className="min-h-[400px] py-8"
   />
   ```

## Related Components

- `EmptyState` - For when there's no data to display
- `Progress` - Standalone progress bar component
- `Skeleton` - For content placeholders during loading

## Dependencies

- `lucide-react` - For the Loader2 icon
- `@/components/ui/progress` - For the progress bar
- `@/lib/utils` - For the `cn` utility function
