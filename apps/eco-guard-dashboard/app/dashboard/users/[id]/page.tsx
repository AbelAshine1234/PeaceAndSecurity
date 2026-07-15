"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { userService } from "@/lib/services/user-service";
import { patrolService } from "@/lib/services/patrol-service";
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
  Building,
  Shield,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  MapPin,
  Navigation,
} from "lucide-react";
import { getImageUrl, cn } from "@/lib/utils";
import { PERMISSION_LABELS, PERMISSION_CATEGORIES } from "@/lib/permissions";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Try regular user first
      try {
        const response = await userService.getUserById(id as string, { skipToast: true });
        if (response && response.data) {
          setUser(response.data);
          return;
        }
      } catch (err) {
        // If not found, try patrol
        const patrolResp = await patrolService.getPatrolById(id as string, { skipToast: true });
        if (patrolResp && patrolResp.data) {
          setUser(patrolResp.data);
          return;
        }
      }

      toast.error("User not found");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    if (
      !confirm(
        `Are you sure you want to ${user.status === "ACTIVE" ? "disable" : "activate"
        } this user?`,
      )
    )
      return;

    try {
      const loadingToast = toast.loading("Updating status...");
      await userService.toggleUserStatus(user.id);
      toast.success("Status updated successfully", { id: loadingToast });
      loadData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const formatDateTime = (date?: Date | string) =>
    date ? new Date(date).toLocaleString() : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-bold text-lg">User not found</p>
        </div>
      </div>
    );
  }

  const userPermissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  return (
    <DetailLayout
      backLink={{
        label: user.role === "PATROL" ? "Patrol Management" : "Users",
        href: user.role === "PATROL" ? "/dashboard/patrols" : "/dashboard/users"
      }}
      title={user.role === "PATROL" ? "Patrol Officer Profile" : "System User Profile"}
      subtitle={`ID: ${String(user.id || "")
        .substring(0, 12)
        .toUpperCase()}`}
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleToggleStatus}
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 rounded h-10 px-4 font-bold transition-all border border-slate-200"
          >
            {user.status === "ACTIVE" ? "Disable Account" : "Activate Account"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
            className="bg-primary hover:bg-primary/90 text-white rounded h-10 px-4 font-bold transition-all shadow-lg shadow-primary/10"
          >
            Edit Profile
          </Button>
          <Badge
            className={`h-10 px-5 rounded flex items-center justify-center font-black uppercase text-[10px] tracking-widest border-none ${user.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {String(user.status || "")}
          </Badge>
        </div>
      }
    >
      <DetailSection title="User Account Detail">
        <div className="col-span-1 md:col-span-2 lg:col-span-1 row-span-2">
          <div className="relative aspect-square w-48 rounded-lg overflow-hidden border-2 border-slate-100 shadow bg-slate-50 mx-auto lg:mx-0 p-1">
            <Avatar className="h-full w-full rounded-lg">
              <AvatarImage src={getImageUrl(user.profileImage)} />
              <AvatarFallback className="bg-primary/5 text-primary text-5xl font-black">
                {String(user.fullName || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("") || <UserIcon className="h-20 w-20" />}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <DetailItem label="Full Name" value={String(user.fullName || "")} />
          <DetailItem
            label="System Role"
            value={
              <Badge
                variant="outline"
                className="uppercase tracking-wider font-bold text-primary border-primary/20 bg-primary/5"
              >
                <Shield className="h-3 w-3 mr-1" />
                {String(user.role || "").replace(/_/g, " ")}
              </Badge>
            }
          />

          <DetailItem
            label="Email Address"
            value={
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-sm">
                  {String(user.email || "")}
                </span>
              </div>
            }
          />
          <DetailItem
            label="Phone Number"
            value={
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-sm">
                  {user.phoneNumber ? String(user.phoneNumber) : "Not provided"}
                </span>
              </div>
            }
          />

          <DetailItem
            label="Organization"
            value={
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400" />
                <span className="font-bold">PossibleTech</span>
              </div>
            }
          />
        </div>

        {user.role === "PATROL" && (
          <div className="col-span-full mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
            <DetailItem
              label="Office Address"
              value={
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span>{user.officeAddress || "Not set"}</span>
                </div>
              }
            />
            <DetailItem
              label="Assigned Area"
              value={
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>{user.assignedArea || "Not set"}</span>
                </div>
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Latitude"
                value={
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-sm">{user.officeLatitude || "—"}</span>
                  </div>
                }
              />
              <DetailItem
                label="Longitude"
                value={
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-sm">{user.officeLongitude || "—"}</span>
                  </div>
                }
              />
            </div>
          </div>
        )}

        <DetailItem
          label="Account Status"
          value={
            <Badge
              className={cn(
                "font-bold",
                user.isPasswordSet ||
                  user.isEmailVerified ||
                  user.isPhoneVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {user.isPasswordSet ||
                user.isEmailVerified ||
                user.isPhoneVerified
                ? "Active & Verified"
                : "Pending Setup"}
            </Badge>
          }
        />
        <DetailItem
          label="Email Verified"
          value={
            user.isEmailVerified ? (
              <Badge className="bg-green-100 text-green-700 font-bold">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 font-bold">
                Pending
              </Badge>
            )
          }
        />
        <DetailItem
          label="Phone Verified"
          value={
            user.isPhoneVerified ? (
              <Badge className="bg-green-100 text-green-700 font-bold">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 font-bold">
                Pending
              </Badge>
            )
          }
        />
        <DetailItem
          label="Password Set"
          value={
            user.isPasswordSet ? (
              <Badge className="bg-green-100 text-green-700 font-bold">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 font-bold">
                Not Set
              </Badge>
            )
          }
        />
        <DetailItem
          label="Registration Date"
          value={
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              {formatDateTime(user.createdAt)}
            </div>
          }
        />
        <DetailItem
          label="Last Updated"
          value={
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              {formatDateTime(user.updatedAt)}
            </div>
          }
        />

        <div className="col-span-full mt-8">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">
            Access Permissions
          </Label>
          {userPermissions.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(
                ([category, categoryPermissions]) => {
                  const userCategoryPerms = categoryPermissions.filter((p) =>
                    userPermissions.includes(p),
                  );

                  if (userCategoryPerms.length === 0) return null;

                  return (
                    <div
                      key={category}
                      className="border border-slate-100 rounded-2xl overflow-hidden bg-white"
                    >
                      <div className="flex items-center justify-between p-4 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-black text-slate-900">
                            {category}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-bold text-xs">
                          {userCategoryPerms.length}/
                          {categoryPermissions.length} permissions
                        </Badge>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {userCategoryPerms.map((permission) => (
                          <div
                            key={permission}
                            className="flex items-center gap-3 p-3 rounded bg-green-50 border border-green-200"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            <span className="text-sm font-bold text-slate-700">
                              {PERMISSION_LABELS[permission]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm mb-4">
                <Shield className="h-8 w-8 text-slate-300" />
              </div>
              <h4 className="text-slate-900 font-bold text-lg mb-2">
                No Specific Permissions Assigned
              </h4>
              <p className="text-slate-500 text-sm max-w-md">
                This user may have role-based default permissions or requires
                permission assignment.
              </p>
            </div>
          )}
        </div>
      </DetailSection>
    </DetailLayout>
  );
}

import { Label } from "@/components/ui/label";
