"use client";
import {
  ReusableTable,
  indexColumn,
  statusColumn,
  actionsColumn,
  Column,
} from "@/components/tables";
import { User } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, User as UserIcon } from "lucide-react";

type Props = {
  owners: User[];
  loading?: boolean;
  onDetail: (owner: User) => void;
  onEdit?: (owner: User) => void;
  onDelete?: (owner: User) => void;
  onResetPassword?: (owner: User) => void;
};

export function UserTable({
  owners,
  loading,
  onDetail,
  onEdit,
  onDelete,
  onResetPassword,
}: Props) {
  const columns: Column<User>[] = [
    {
      key: "fullName",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
            {row.profileImage ? (
              <img src={getImageUrl(row.profileImage)} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400">
                <UserIcon size={18} />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{row.fullName}</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {row.id.substring(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Mail size={12} className="text-slate-400" />
            {row.email || "—"}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Phone size={12} className="text-slate-400" />
            {row.phoneNumber || "—"}
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "Role / Access",
      render: (row) => (
        <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest bg-slate-50 border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg">
          {row.role?.replace(/-/g, " ")}
        </Badge>
      ),
    },
    statusColumn<User>(),
    actionsColumn<User>({
      onDetail,
      detailPermission: PERMISSIONS.USER_VIEW,
      onEdit,
      editPermission: PERMISSIONS.USER_UPDATE,
      onDelete,
      deletePermission: PERMISSIONS.USER_DELETE,
      onResetPassword,
      resetPasswordPermission: PERMISSIONS.SETTINGS_RESET_PASSWORD,
    }),
  ];

  return (
    <ReusableTable
      data={owners}
      columns={columns}
      getRowKey={(row) => row.id}
      isLoading={loading}
      emptyText={loading ? "Loading users..." : "No users found"}
    />
  );
}
