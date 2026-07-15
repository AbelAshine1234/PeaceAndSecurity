import React from "react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
};

export interface ReusableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string | number;
  emptyText?: string;
  isLoading?: boolean;
}

export type TableActions<T> = {
  onDetail?: (row: T) => void;
  detailPermission?: string;
  onEdit?: (row: T) => void;
  editPermission?: string;
  editLabel?: string;
  onDelete?: (row: T) => void;
  deletePermission?: string;
  onResetPassword?: (row: T) => void;
  resetPasswordPermission?: string;
  onPush?: (row: T) => void;
  pushPermission?: string;
};
