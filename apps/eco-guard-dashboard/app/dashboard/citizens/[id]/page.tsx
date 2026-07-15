"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { citizenService } from "@/lib/services/citizen-service";
import { UserResponse } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DetailLayout,
    DetailSection,
    DetailItem,
} from "@/components/layouts/detail-layout";
import { toast } from "sonner";
import {
    Mail,
    Phone,
    User as UserIcon,
    Shield,
    Calendar,
    AlertCircle,
    Hash,
    MapPin,
    Trophy
} from "lucide-react";
import { getImageUrl, cn } from "@/lib/utils";

export default function CitizenDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [citizen, setCitizen] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await citizenService.getCitizenById(id as string);
            if (response.data) {
                setCitizen(response.data);
            } else {
                toast.error("Citizen not found");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load citizen details");
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date?: Date | string) =>
        date ? new Date(date).toLocaleString() : "—";

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading citizen details...</p>
                </div>
            </div>
        );
    }

    if (!citizen) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500 font-bold text-lg">Citizen not found</p>
                </div>
            </div>
        );
    }

    return (
        <DetailLayout
            backLink={{ label: "Citizen Management", href: "/dashboard/citizens" }}
            title="Citizen Profile"
            subtitle={`User Code: ${citizen.userCode || "N/A"}`}
            actions={
                <div className="flex items-center gap-3">
                    <Badge
                        className={`h-10 px-5 rounded flex items-center justify-center font-black uppercase text-[10px] tracking-widest border-none ${citizen.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {String(citizen.status || "")}
                    </Badge>
                </div>
            }
        >
            <DetailSection title="Citizen Identification">
                <div className="col-span-1 md:col-span-2 lg:col-span-1 row-span-2">
                    <div className="relative aspect-square w-48 rounded-lg overflow-hidden border-2 border-slate-100 shadow bg-slate-50 mx-auto lg:mx-0 p-1">
                        <Avatar className="h-full w-full rounded-lg">
                            <AvatarImage src={getImageUrl(citizen.profileImage)} />
                            <AvatarFallback className="bg-primary/5 text-primary text-5xl font-black">
                                {String(citizen.fullName || "")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("") || <UserIcon className="h-20 w-20" />}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <DetailItem label="Full Name" value={String(citizen.fullName || "")} />
                    <DetailItem
                        label="User Code"
                        value={
                            <Badge
                                variant="outline"
                                className="uppercase tracking-wider font-bold text-primary border-primary/20 bg-primary/5"
                            >
                                <Hash className="h-3 w-3 mr-1" />
                                {citizen.userCode}
                            </Badge>
                        }
                    />

                    <DetailItem
                        label="Phone Number"
                        value={
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="font-mono text-sm">
                                    {citizen.phoneNumber ? String(citizen.phoneNumber) : "Not registered"}
                                </span>
                            </div>
                        }
                    />

                    <DetailItem
                        label="Reputation Points"
                        value={
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <span className="font-bold">0 Points</span>
                            </div>
                        }
                    />

                    <DetailItem
                        label="Last Known Location"
                        value={
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span className="text-sm">
                                    {citizen.latitude && citizen.longitude
                                        ? `${citizen.latitude.toFixed(4)}, ${citizen.longitude.toFixed(4)}`
                                        : "Unknown"}
                                </span>
                            </div>
                        }
                    />
                </div>

                <DetailItem
                    label="Registration Date"
                    value={
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {formatDateTime(citizen.createdAt)}
                        </div>
                    }
                />
            </DetailSection>

            <DetailSection title="Activity Summary">
                <div className="col-span-full py-8 text-center bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-slate-500 text-sm">Citizen activity tracking (reports submitted, comments, etc.) will be displayed here.</p>
                </div>
            </DetailSection>
        </DetailLayout>
    );
}
