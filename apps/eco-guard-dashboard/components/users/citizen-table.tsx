"use client";
import {
    ReusableTable,
    statusColumn,
    actionsColumn,
    Column,
} from "@/components/tables";
import { User } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Phone, User as UserIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

type Props = {
    owners: User[];
    loading?: boolean;
    onDetail: (owner: User) => void;
    onEdit?: (owner: User) => void;
    onDelete?: (owner: User) => void;
    onResetPassword?: (owner: User) => void;
    onPush?: (owner: User) => void;
};

export function CitizenTable({
    owners,
    loading,
    onDetail,
    onEdit,
    onDelete,
    onResetPassword,
    onPush,
}: Props) {
    const columns: Column<User>[] = [
        {
            key: "fullName",
            header: "Citizen",
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
                        <Phone size={12} className="text-slate-400" />
                        {row.phoneNumber || "—"}
                    </div>
                </div>
            )
        },
        {
            key: "joined",
            header: "Joined Date",
            render: (row) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Calendar size={12} className="text-slate-400" />
                    {row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy") : "—"}
                </div>
            ),
        },
        {
            key: "role",
            header: "Role",
            render: () => (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    Citizen
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
            onPush,
        }),
    ];

    return (
        <ReusableTable
            data={owners}
            columns={columns}
            getRowKey={(row) => row.id}
            isLoading={loading}
            emptyText={loading ? "Loading citizens..." : "No citizens found"}
        />
    );
}
