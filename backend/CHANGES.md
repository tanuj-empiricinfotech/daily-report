# Backend Changes - Time Format Migration

## Summary
Changed time handling from decimal hours (3.5) to HH:MM text format ("3:30"). Now supports 0 or blank values.

## New Files Created

1. **src/utils/time.util.ts**
   - `parseTimeToDecimal()` - Convert "HH:MM" to decimal
   - `formatDecimalToTime()` - Convert decimal to "HH:MM"
   - `isValidTimeFormat()` - Validate HH:MM format
   - `normalizeTimeInput()` - Handle both formats

2. **src/db/migrations/003_change_time_format.sql**
   - Changes `actual_time_spent` from DECIMAL(10,2) to VARCHAR(10)
   - Changes `tracked_time` from DECIMAL(10,2) to VARCHAR(10)
   - Converts existing data: 3.5 → "3:30"
   - Adds CHECK constraints for HH:MM format validation

3. **TIME_FORMAT_MIGRATION_GUIDE.md**
   - Detailed migration instructions
   - API examples
   - Testing checklist
   - Rollback plan

4. **IMPLEMENTATION_SUMMARY.md**
   - Quick reference guide
   - Validation rules
   - Benefits and next steps

## Modified Files

### Types & Interfaces

**src/types/index.ts**
```diff
- actual_time_spent: number;
- tracked_time: number;
+ actual_time_spent: string;  // HH:MM format
+ tracked_time: string;  // HH:MM format
```

**src/types/teams.types.ts**
```diff
- actualTime: number;
- trackedTime: number;
+ actualTime: string | number;  // Supports both formats
+ trackedTime: string | number;  // Supports both formats
```

### Validators

**src/validators/log.validator.ts**
- Added custom `validateTimeFormat()` function
- Updated all validators to accept HH:MM format
- Allows empty string as valid (represents 0)
- Error message: "Time must be in HH:MM format (e.g., "3:30") or empty for 0"

### Services

**src/services/logs.service.ts**
- Removed negative time validation (now in validators)
- Added comments explaining validation is in middleware

**src/services/teams-summary.service.ts**
- Added `addTimeValues()` helper function
- Updated time calculations to use HH:MM format
- Returns times as strings in HH:MM format
- Handles backward compatibility with old decimal format

### Display

**src/utils/teams-card-formatter.util.ts**
- Replaced `formatHours()` with `formatTime()` function
- Line 115: Project time display now shows HH:MM format
- Handles both string (HH:MM) and number (decimal) for backward compatibility

## Database Schema Changes

**Before:**
```sql
actual_time_spent DECIMAL(10, 2) NOT NULL CHECK (actual_time_spent >= 0)
tracked_time DECIMAL(10, 2) NOT NULL CHECK (tracked_time >= 0)
```

**After:**
```sql
actual_time_spent VARCHAR(10) NOT NULL CHECK (actual_time_spent ~ '^\d+:[0-5]\d$')
tracked_time VARCHAR(10) NOT NULL CHECK (tracked_time ~ '^\d+:[0-5]\d$')
```

## API Changes

**Request (Before):**
```json
{
  "actual_time_spent": 3.5,
  "tracked_time": 4.25
}
```

**Request (After):**
```json
{
  "actual_time_spent": "3:30",
  "tracked_time": "4:15"
}
```

**For zero time:**
```json
{
  "actual_time_spent": "",
  "tracked_time": "0:00"
}
```

## Validation Changes

**Old Validation:**
- Must be a positive number (>= 0)
- Type: number

**New Validation:**
- Must match regex: `^\d+:[0-5]\d$`
- Can be empty string (represents 0)
- Type: string

**Valid Examples:**
- `"3:30"` - 3 hours 30 minutes
- `"0:45"` - 45 minutes
- `"12:15"` - 12 hours 15 minutes
- `"0:00"` - 0 hours
- `""` - Empty (0 hours)

**Invalid Examples:**
- `"3:60"` - Minutes must be 0-59
- `"3.5"` - Decimal format not accepted
- `"3"` - Must include minutes
- `"abc"` - Invalid format

## Clean Code Principles Applied

1. **DRY** - Created reusable time utility functions
2. **Single Responsibility** - Separate functions for parsing, formatting, validation
3. **Type Safety** - Strong TypeScript types with string | number union types
4. **Extensibility** - Functions handle both old and new formats for smooth migration
5. **No Magic Strings** - Clear constants and validation patterns
6. **Error Handling** - Descriptive error messages with examples
7. **Documentation** - Well-documented functions with JSDoc comments

## Testing Required

- [ ] Run database migration
- [ ] Verify existing data converted correctly
- [ ] Test creating logs with HH:MM format
- [ ] Test creating logs with empty/0:00 time
- [ ] Test updating logs
- [ ] Test validation rejecting invalid formats
- [ ] Test Teams summary with new format
- [ ] Verify Teams card displays HH:MM correctly
- [ ] Update frontend to use HH:MM format

## Breaking Changes

**API Input Format:**
- Frontend must send time as string in "HH:MM" format instead of decimal number
- Empty string or "0:00" for zero time

**API Response Format:**
- Time fields return as strings ("3:30") instead of numbers (3.5)

## Migration Command

```bash
# Backup database first
pg_dump -U your_user -d your_database > backup_before_migration.sql

# Run migrations
npm run migrate
```

## Rollback

If needed, see `TIME_FORMAT_MIGRATION_GUIDE.md` for detailed rollback SQL.

## Notes

- TypeScript compilation: PASSING ✓
- Backward compatibility maintained during transition
- Database constraints ensure data integrity
- All existing code paths updated
