import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnId } from '@/hooks/useColumnVisibility';
import { IconColumns } from '@tabler/icons-react';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  required: boolean;
  adminOnly?: boolean;
}

interface ColumnVisibilityMenuProps {
  visibleColumns: Set<ColumnId>;
  onToggleColumn: (columnId: ColumnId) => void;
  isAdmin: boolean;
  availableColumns: ColumnConfig[];
}

/**
 * Component for managing column visibility in the logs table
 * Following clean code principles - single responsibility, reusable
 */
export function ColumnVisibilityMenu({
  visibleColumns,
  onToggleColumn,
  isAdmin,
  availableColumns,
}: ColumnVisibilityMenuProps) {
  // Filter columns based on admin status
  const visibleColumnsForUser = availableColumns.filter(
    (column) => !column.adminOnly || isAdmin
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconColumns className="size-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleColumnsForUser.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={visibleColumns.has(column.id)}
            onCheckedChange={() => onToggleColumn(column.id)}
            disabled={column.required}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
