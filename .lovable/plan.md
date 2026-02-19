
# Plan: Remove Next Best Actions from Plan Tab

## Summary
Remove the "Next Best Actions" column from the Plan tab's Kanban view. This will simplify the layout and allow the Kanban columns to use the full width of the page.

## Changes Required

### 1. Update Plan.tsx
**File:** `src/pages/Plan.tsx`

**Actions:**
- Remove the import for `NextBestActionsColumn` (line 3)
- Remove the import for `NextBestAction` type from dashboardData (line 4)
- Remove the state for `selectedAction` (line 66)
- Update the Kanban grid layout from `grid-cols-5` to remove the NBA column wrapper
- Remove the `NextBestActionsColumn` component rendering (lines 318-324)
- Change the Kanban columns wrapper from `col-span-4` to full width

**Layout change:**
- Current: 5-column grid with 1 column for NBA + 4 columns for Kanban
- New: 4-column grid with only Kanban columns (Backlog, Doing, Review, Done)

### 2. Delete NextBestActionsColumn Component (Optional Cleanup)
**File:** `src/components/plan/NextBestActionsColumn.tsx`

Since this component is no longer used anywhere in the application, it can be safely deleted to keep the codebase clean.

---

## Technical Details

### Code Removals in Plan.tsx

```typescript
// Remove these imports:
import { NextBestActionsColumn } from '@/components/plan/NextBestActionsColumn';
import { NextBestAction } from '@/data/dashboardData';

// Remove this state:
const [selectedAction, setSelectedAction] = useState<NextBestAction | null>(null);

// Change grid from 5 cols to simpler layout
// Before:
<div className="grid grid-cols-5 gap-4">
  <div className="col-span-1 h-[600px]">
    <NextBestActionsColumn ... />
  </div>
  <div className="col-span-4">
    <DndContext ...>
      <div className="grid grid-cols-4 gap-4">
        ...
      </div>
    </DndContext>
  </div>
</div>

// After:
<DndContext ...>
  <div className="grid grid-cols-4 gap-4">
    ...
  </div>
</DndContext>
```

### Files Affected
| File | Action |
|------|--------|
| `src/pages/Plan.tsx` | Edit - Remove NBA column and related state |
| `src/components/plan/NextBestActionsColumn.tsx` | Delete - No longer used |

### No Breaking Changes
- The NBA data and types in `src/data/dashboardData.ts` will remain untouched (they may be used elsewhere)
- All drag-and-drop functionality for tasks will continue to work
- List and Calendar views are unaffected
