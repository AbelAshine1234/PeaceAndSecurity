"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/auth-context";
import { userService } from "@/lib/services/user-service";
import { authService } from "@/lib/services/auth-service";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User as UserIcon,
  Loader2,
  Camera,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layouts/page-header";
import { getImageUrl } from "@/lib/utils";

export default function SettingsPage() {
  const { user, loginWithData, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profileData, setProfileData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    profileImage: "",
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setFetching(true);
      const response = await userService.getUserProfile();
      if (response.success && response.data) {
        const u = response.data;
        setProfileData({
          fullName: u.fullName || "",
          phoneNumber: u.phoneNumber || "",
          email: u.email || "",
          profileImage: u.profileImage || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("fullName", profileData.fullName);
      formData.append("phoneNumber", profileData.phoneNumber);

      const response = await userService.updateProfile(formData);
      if (response.success && response.data) {
        toast.success("Profile updated successfully");
        if (user) {
          loginWithData({
            ...user,
            fullName: response.data.fullName,
            phoneNumber: response.data.phoneNumber,
            profileImage: response.data.profileImage,
          });
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await userService.updateProfile(formData);
      if (response.success && response.data) {
        setProfileData((prev) => ({
          ...prev,
          profileImage: response.data.profileImage,
        }));
        if (user) {
          loginWithData({
            ...user,
            profileImage: response.data.profileImage,
          });
        }
        toast.success("Profile image updated");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setPasswordLoading(true);
      const response = await authService.changePassword(
        currentPassword,
        newPassword,
      );
      if (response.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!hasPermission(PERMISSIONS.SETTINGS_VIEW)) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        Access Denied: Missing SETTINGS_VIEW permission
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your profile information and account security in one place."
        className="w-full!"
      />

      <div className="bg-white rounded border border-slate-100 shadow overflow-hidden w-full">
        {/* Profile Header Section with Banner-like Feel */}
        <div className="bg-slate-50/50 p-6 md:p-12 border-b border-slate-100 relative">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
            <div
              className="relative group cursor-pointer"
              onClick={() =>
                document.getElementById("profile-image-input")?.click()
              }
            >
              <Avatar className="h-28 w-28 md:h-40 md:w-40 border-8 border-white shadow group-hover:opacity-90 transition-all">
                <AvatarImage src={getImageUrl(profileData.profileImage)} />
                <AvatarFallback className="bg-primary/5 text-primary text-3xl md:text-4xl font-black">
                  {profileData.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/20 p-3 rounded-full backdrop-blur-sm">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <input
                id="profile-image-input"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {profileData.fullName}
                </h2>
                <span className="inline-flex items-center px-4 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow shadow-primary/20">
                  {user?.role.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4 text-primary/50" />{" "}
                {profileData.email || "No email available"}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" /> System Verified Account
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-10 space-y-10 md:space-y-12">
          {/* Section 1: Profile Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-slate-400" /> Account Details
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Update your public profile and contact info.
              </p>
            </div>

            <form
              onSubmit={handleUpdateProfile}
              className="lg:col-span-2 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-900 ml-1">
                    Full Name
                  </Label>
                  <Input
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fullName: e.target.value,
                      })
                    }
                    className="h-11 rounded bg-slate-50 border-slate-200 text-slate-700 font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                    placeholder="EcoGuard Admin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-900 ml-1">
                    Phone Number
                  </Label>
                  <Input
                    value={profileData.phoneNumber}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="h-11 rounded bg-slate-50 border-slate-200 text-slate-700 font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                    placeholder="+251 ..."
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-bold text-slate-400 ml-1">
                    Email (Immutable)
                  </Label>
                  <Input
                    value={profileData.email}
                    className="h-11 rounded bg-slate-100/50 border-slate-200 text-slate-400 font-medium cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex justify-start">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 rounded px-8 bg-primary hover:opacity-90 text-white font-bold text-sm shadow shadow-primary/10"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </div>

          {hasPermission(PERMISSIONS.SETTINGS_CHANGE_PASSWORD) && (
            <>
              <div className="h-px bg-slate-100 mx-auto w-full" />
              {/* Section 2: Password Security */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-slate-400" /> Security
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Protect your account with a strong password.
                  </p>
                </div>

                <form
                  onSubmit={handleChangePassword}
                  className="lg:col-span-2 space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-900 ml-1">
                        Current Password
                      </Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 rounded bg-slate-50 border-slate-200 font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-900 ml-1">
                          New Password
                        </Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11 rounded bg-slate-50 border-slate-200 font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                          placeholder="6+ chars"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-900 ml-1">
                          Confirm New Password
                        </Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 rounded bg-slate-50 border-slate-200 font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                          placeholder="Repeat new password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <Button
                      type="submit"
                      disabled={passwordLoading}
                      className="h-10 rounded px-8 bg-primary hover:opacity-90 text-white font-bold text-sm shadow shadow-primary/10"
                    >
                      {passwordLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Security
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
