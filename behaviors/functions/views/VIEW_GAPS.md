# Domain View Gaps

Captured 2026-03-18 after orbital-verify screenshots of all 15 non-game organisms.

## FIXED

### Grid layouts now work
Products (3-col), tasks (2-col), deals (2-col), sprints (2-col), courses (2-col), devices (3-col), providers (2-col), media (3-col) all render as proper CSS grids with card borders, shadows, rounded corners.

### Card styling present
DataGrid cards have borders, hover shadows, rounded corners. DataList `variant: 'card'` wraps items in a bordered container with dividers between rows.

### Field hierarchy and formatting
h3 titles, badge fields inline, body fields as label:value pairs, caption fields muted. Currency fields show $X.XX. Date fields formatted. Number fields locale-formatted.

### Actions visible
View, Edit, Delete actions render directly on cards (DataGrid) and list items (DataList) without hover requirement.

### Chat message layout
Chat uses `variant: 'message'` with left-aligned bubbles, sender name, timestamp.

---

## REMAINING GAPS

### Gap 1: No images
Products, media assets, providers, courses have no imagery. DataGrid supports `imageField` prop but no entity field holds image URLs. Need to add `imageUrl` fields to entities or use placeholder images.

### Gap 2: Forms lack input type differentiation
Every field renders as plain text input. The Form component already supports type-based input selection (`determineInputType()`), but the `form-section` pattern in behaviors passes fields as string names without type metadata. The form-section needs to receive field type info from the entity definition.

### Gap 3: Delete button placement
Delete shows as red text button inline with View/Edit. On grid cards it crowds the header. Could move dangerous actions to a kebab menu or separate footer zone.

### Gap 4: Data refresh after create
Pre-existing issue: "row count did not increase" after modal save. The browse trait's refresh events fire but the list doesn't visibly update. Affects all organisms equally.

### Gap 5: Label formatting
Field labels show raw camelCase names ("Contact Id", "Story Points", "Due Date") instead of properly formatted labels. The DataGrid/DataList auto-capitalize but don't handle camelCase splitting well.

### Gap 6: Boolean fields show "true"/"false"
Products show `inStock` as "true"/"false" badge text instead of a visual indicator. DataGrid's `format: 'boolean'` exists but renders as text. Could use a colored dot or icon instead.

### Gap 7: No domain-specific empty states
All organisms use generic "No X yet" empty state. Each domain should have contextual empty states (e.g., "No patients registered. Start by admitting a patient." vs "No tickets filed. Your support queue is clear.").
