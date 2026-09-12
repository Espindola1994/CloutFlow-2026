import React from "react";
import { cn } from "@/lib/utils";

export interface AdminTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function AdminTable({
  children,
  className,
  wrapperClassName,
  ...props
}: AdminTableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-xs",
        wrapperClassName
      )}
    >
      <table
        className={cn("w-full text-left border-collapse text-[13px]", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function AdminTableHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-[var(--admin-card-hover)] border-b border-[var(--admin-border)] text-[var(--admin-text-muted)] text-[11px] font-semibold uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function AdminTableBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("divide-y divide-[var(--admin-divider)] text-[var(--admin-text)]", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export interface AdminTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export function AdminTableRow({
  children,
  className,
  clickable = false,
  ...props
}: AdminTableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors",
        clickable ? "cursor-pointer hover:bg-[var(--admin-card-hover)]" : "hover:bg-[var(--admin-card-hover)]/60",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTableHead({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 py-3 font-semibold text-[var(--admin-text-secondary)] whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function AdminTableCell({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 align-middle text-[var(--admin-text)]", className)}
      {...props}
    >
      {children}
    </td>
  );
}
