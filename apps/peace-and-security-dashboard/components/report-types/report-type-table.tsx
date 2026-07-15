"use client";

import {
    ReusableTable,
    indexColumn,
    Column,
    actionsColumn,
} from "@/components/tables";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PERMISSIONS } from "@/lib/permissions";
import { AlertCircle, ClipboardList } from "lucide-react";

type ReportType = {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    residentialDecibelThreshold?: number;
    commercialDecibelThreshold?: number;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    data: ReportType[];
    loading?: boolean;
    onDetail: (type: ReportType) => void;
    onEdit: (type: ReportType) => void;
    onDelete: (type: ReportType) => void;
};

export function ReportTypeTable({
    data,
    loading,
    onDetail,
    onEdit,
    onDelete,
}: Props) {
    const columns: Column<ReportType>[] = [
        indexColumn<ReportType>(),
        {
            key: "name",
            header: "Report Type",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                        {row.name.toLowerCase().includes('noise') ? <AlertCircle size={18} /> : <ClipboardList size={18} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {row.id.substring(0, 8)}</span>
                    </div>
                </div>
            ),
        },
        {
            key: "description",
            header: "Description",
            render: (row) => (
                <div className="max-w-[300px]">
                    <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">
                        {row.description || 'No description provided.'}
                    </p>
                </div>
            ),
        },
        {
            key: "thresholds",
            header: "Thresholds",
            render: (row) => (
                (row.name.toLowerCase().includes('noise') || row.name.toLowerCase().includes('sound')) ? (
                    <div className="flex gap-2">
                        <div className="bg-rose-50 px-2 py-1 rounded-lg border border-rose-100/50">
                            <span className="text-[9px] font-bold text-rose-700">{row.residentialDecibelThreshold} dB (R)</span>
                        </div>
                        <div className="bg-rose-50 px-2 py-1 rounded-lg border border-rose-100/50">
                            <span className="text-[9px] font-bold text-rose-700">{row.commercialDecibelThreshold} dB (C)</span>
                        </div>
                    </div>
                ) : <span className="text-slate-300">—</span>
            )
        },
        {
            key: "isActive",
            header: "Status",
            render: (row) => (
                <Badge className={row.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}>
                    {row.isActive ? 'Active' : 'Hidden'}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Created",
            render: (row) => (
                <div className="flex flex-col text-[11px]">
                    <span className="text-slate-700 font-bold">{format(new Date(row.createdAt), "MMM dd, yyyy")}</span>
                    <span className="text-slate-400 font-medium">{format(new Date(row.createdAt), "HH:mm a")}</span>
                </div>
            ),
        },
        {
            key: "updatedAt",
            header: "Updated",
            render: (row) => (
                <div className="flex flex-col text-[11px]">
                    <span className="text-slate-700 font-bold">{format(new Date(row.updatedAt), "MMM dd, yyyy")}</span>
                    <span className="text-slate-400 font-medium">{format(new Date(row.updatedAt), "HH:mm a")}</span>
                </div>
            ),
        },
        actionsColumn<ReportType>({
            onDetail,
            detailPermission: PERMISSIONS.VIOLATION_VIEW,
            onEdit,
            editPermission: PERMISSIONS.VIOLATION_UPDATE,
            editLabel: "Edit Type",
            onDelete,
            deletePermission: PERMISSIONS.VIOLATION_DELETE,
        }),
    ];

    return (
        <ReusableTable
            data={data}
            columns={columns}
            getRowKey={(row) => row.id}
            isLoading={loading}
            emptyText={loading ? "Loading categories..." : "No report categories found"}
        />
    );
}
