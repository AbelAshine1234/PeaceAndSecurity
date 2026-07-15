"use client";

import { TableActions } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Pencil, Trash2, Key, Send } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";

export function ActionButtons<T>({
  row,
  actions,
}: {
  row: T;
  actions: TableActions<T>;
}) {
  const { hasPermission } = useAuth();

  const showDetail = actions.onDetail && (!actions.detailPermission || hasPermission(actions.detailPermission));
  const showEdit = actions.onEdit && (!actions.editPermission || hasPermission(actions.editPermission));
  const showResetPassword = actions.onResetPassword && (!actions.resetPasswordPermission || hasPermission(actions.resetPasswordPermission));
  const showPush = actions.onPush && (!actions.pushPermission || hasPermission(actions.pushPermission));
  const showDelete = actions.onDelete && (!actions.deletePermission || hasPermission(actions.deletePermission));

  if (!showDetail && !showEdit && !showResetPassword && !showDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {showDetail && (
          <DropdownMenuItem onClick={() => actions.onDetail!(row)}>
            <Eye className="mr-2 h-4 w-4 text-slate-400" />
            <span>View Detail</span>
          </DropdownMenuItem>
        )}
        {showEdit && (
          <DropdownMenuItem onClick={() => actions.onEdit!(row)}>
            <Pencil className="mr-2 h-4 w-4 text-slate-400" />
            <span>{actions.editLabel || "Edit Profile"}</span>
          </DropdownMenuItem>
        )}
        {showResetPassword && (
          <DropdownMenuItem onClick={() => actions.onResetPassword!(row)}>
            <Key className="mr-2 h-4 w-4 text-slate-400" />
            <span>Reset Password</span>
          </DropdownMenuItem>
        )}
        {showPush && (
          <DropdownMenuItem onClick={() => actions.onPush!(row)}>
            <Send className="mr-2 h-4 w-4 text-slate-400" />
            <span>Send Push Notif</span>
          </DropdownMenuItem>
        )}
        {showDelete && (
          <>
            {(showDetail || showEdit || showResetPassword) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => actions.onDelete!(row)}
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Change Status</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
