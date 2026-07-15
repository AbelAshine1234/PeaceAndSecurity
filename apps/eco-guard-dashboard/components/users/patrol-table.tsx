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
import { Mail, Phone, User as UserIcon, MapPin, Clock, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Props = {
    owners: User[];
    loading?: boolean;
    onDetail: (owner: User) => void;
    onEdit?: (owner: User) => void;
    onDelete?: (owner: User) => void;
    onResetPassword?: (owner: User) => void;
    onPush?: (owner: User) => void;
};

export function PatrolTable({
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
            header: "Patrol Officer",
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
            key: "location",
            header: "Location",
            render: (row) => (
                <div className="flex flex-col gap-1.5">
                    {/* Office / Station */}
                    {(row as any).officeAddress && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Building2 size={12} className="text-emerald-500 shrink-0" />
                            <span className="text-emerald-700 font-semibold truncate max-w-[160px]" title={(row as any).officeAddress}>
                                {(row as any).officeAddress}
                            </span>
                        </div>
                    )}
                    {/* Live GPS */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <MapPin size={12} className="text-primary shrink-0" />
                        {row.latitude && row.longitude ? (
                            <span className="text-slate-700">
                                {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
                            </span>
                        ) : (
                            <span className="text-slate-400 italic text-[10px]">Live location not shared</span>
                        )}
                    </div>
                    {row.lastLocationUpdate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock size={10} />
                            Last seen {formatDistanceToNow(new Date(row.lastLocationUpdate))} ago
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "area",
            header: "Assigned Area",
            render: (row) => (
                <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 text-[10px] font-bold">
                    {row.assignedArea || "Not Assigned"}
                </Badge>
            ),
        },
        {
            key: "role",
            header: "Role",
            render: () => (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    Patrol Officer
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
            emptyText={loading ? "Loading patrols..." : "No patrol officers found"}
        />
    );
}
