import { useEffect, useState } from "react";
import { User, UserRole } from "@/lib/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PermissionSelector } from "./permission-selector";
import {
  User as UserIcon,
  Shield,
  Info,
  Upload,
  X,
  Loader2,
  Search as SearchIcon,
  Check,
  ChevronRight,
  MapPin,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { getImageUrl, cn } from "@/lib/utils";

import {
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
  DEFAULT_PERMISSIONS_BY_ROLE,
} from "@/lib/permissions";


type Props = {
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormData) => void;
  initialData?: Partial<User>;
  isNew?: boolean;
  isLoading?: boolean;
  defaultRole?: string;
};

export function UserForm({
  onOpenChange,
  onSave,
  initialData,
  isNew = true,
  isLoading = false,
  defaultRole,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>((defaultRole as UserRole) || UserRole.SYSTEM_ADMIN);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permSearch, setPermSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Patrol-specific fields
  const [pin, setPin] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officeLatitude, setOfficeLatitude] = useState("");
  const [officeLongitude, setOfficeLongitude] = useState("");
  const [assignedArea, setAssignedArea] = useState("");

  const isPatrol = role === UserRole.PATROL;

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || "");
      setEmail(initialData.email || "");
      let phone = initialData.phoneNumber || "";
      if (phone.startsWith("+251")) phone = phone.substring(4);
      else if (phone.startsWith("251")) phone = phone.substring(3);
      else if (phone.startsWith("0")) phone = phone.substring(1);

      setPhoneNumber(phone);
      setRole((initialData.role as UserRole) || UserRole.SYSTEM_ADMIN);
      setOfficeAddress((initialData as any).officeAddress || "");
      setOfficeLatitude(String((initialData as any).officeLatitude || ""));
      setOfficeLongitude(String((initialData as any).officeLongitude || ""));
      setAssignedArea((initialData as any).assignedArea || "");
      if (
        initialData.profileImage &&
        typeof initialData.profileImage === "string"
      ) {
        setPreview(initialData.profileImage);
      }
      // Handle permissions if backend returns it as array
      if (initialData.permissions && Array.isArray(initialData.permissions)) {
        setPermissions(initialData.permissions);
      }
    } else {
      // Pre-fill for new users
      setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[role] || []);
    }
  }, [initialData]);

  // Handle role change pre-filling for new users
  useEffect(() => {
    if (!initialData && role) {
      setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[role] || []);
    }
  }, [role, initialData]);

  useEffect(() => {
    if (!profileImage) return;
    const url = URL.createObjectURL(profileImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileImage]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    // Email is optional for patrol (they login with phone+PIN)
    if (!isPatrol && !email.trim()) newErrors.email = "Email is required";
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (phoneNumber.length !== 9) {
      newErrors.phoneNumber = "Enter exactly 9 digits (9xxxxxxx or 7xxxxxxx)";
    } else if (!/^[97]/.test(phoneNumber)) {
      newErrors.phoneNumber = "Must start with 9 or 7";
    }
    if (!role) newErrors.role = "Role is required";

    // Patrol-specific coordinate validation
    if (isPatrol) {
      if (officeLatitude && String(officeLatitude).trim()) {
        const lat = Number(officeLatitude);
        if (isNaN(lat)) newErrors.officeLatitude = "Latitude must be a number";
        else if (lat < -90 || lat > 90) newErrors.officeLatitude = "Latitude must be between -90 and 90";
      }
      if (officeLongitude && String(officeLongitude).trim()) {
        const lon = Number(officeLongitude);
        if (isNaN(lon)) newErrors.officeLongitude = "Longitude must be a number";
        else if (lon < -180 || lon > 180) newErrors.officeLongitude = "Longitude must be between -180 and 180";
      }
    }

    setErrors(newErrors);
    const hasErrors = Object.keys(newErrors).length > 0;

    if (hasErrors) {
      const fieldNames = Object.keys(newErrors).map(k => {
        if (k === 'fullName') return 'Full Name';
        if (k === 'phoneNumber') return 'Phone Number';
        if (k === 'email') return 'Email';
        if (k === 'officeLatitude') return 'Latitude';
        if (k === 'officeLongitude') return 'Longitude';
        return k;
      }).join(', ');

      console.log("Validation failed for fields:", newErrors);
    }

    return !hasErrors;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error("Validation failed. Please check the fields marked in red.");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    if (email.trim()) formData.append("email", email);
    // Prepend +251 for backend
    formData.append("phoneNumber", `+251${phoneNumber}`);
    formData.append("role", role);
    formData.append("isStaffUser", "true");


    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    // Patrol-specific fields
    if (isPatrol) {
      if (officeAddress.trim()) formData.append("officeAddress", officeAddress.trim());
      if (officeLatitude.trim()) formData.append("officeLatitude", officeLatitude.trim());
      if (officeLongitude.trim()) formData.append("officeLongitude", officeLongitude.trim());
      if (assignedArea.trim()) formData.append("assignedArea", assignedArea.trim());
    }

    // Add Permissions
    if (!isPatrol && permissions.length > 0) {
      permissions.forEach((p) => formData.append("permissions", p));
    }

    onSave(formData);
  };

  const togglePermission = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const toggleCategory = (categoryPermissions: string[]) => {
    const allSelected = categoryPermissions.every((p) =>
      permissions.includes(p),
    );
    if (allSelected) {
      setPermissions((prev) =>
        prev.filter((p) => !categoryPermissions.includes(p)),
      );
    } else {
      setPermissions((prev) => {
        const newPerms = [...prev];
        categoryPermissions.forEach((p) => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
        return newPerms;
      });
    }
  };
  return (
    <div className="fixed inset-0 z-100 bg-white overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-5 shrink-0 bg-white border-b shadow-sm z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isNew
              ? (isPatrol ? "Register Patrol Officer" : "Create System User")
              : (isPatrol ? "Update Patrol Officer" : "Update User Account")}
          </h2>
          <p className="text-sm text-slate-700 font-bold mt-1">
            {isPatrol
              ? "Register a new officer for field operations"
              : "Manage staff access and permissions for the dashboard"}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10 p-0 rounded-full hover:bg-primary hover:text-white text-slate-500 flex items-center justify-center border border-slate-200 shadow-sm transition-all"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content Area - Single-scroll, no excess padding */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="max-w-4xl w-full mx-auto px-4 md:px-10 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-8 md:p-12 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Role Selection - Conditional based on context */}
                {!defaultRole && (
                  <div className="col-span-1 md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Shield className="h-3 w-3 text-primary" />
                      System Access Level *
                    </Label>
                    <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                      <SelectTrigger className="h-14 w-full rounded-xl border-slate-200 bg-slate-50/30 font-bold hover:bg-slate-50 transition-colors">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value={UserRole.SYSTEM_SUPER_ADMIN} className="font-bold">SUPER ADMINISTRATOR</SelectItem>
                        <SelectItem value={UserRole.SYSTEM_ADMIN} className="font-bold">SYSTEM ADMINISTRATOR</SelectItem>
                        {/* Only show PATROL option if explicitly requested or already assigned */}
                        {(defaultRole === UserRole.PATROL || initialData?.role === UserRole.PATROL) && (
                          <SelectItem value={UserRole.PATROL} className="font-bold">FIELD OFFICER (PATROL)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Profile Identity - Integrated */}
                <div className="col-span-1 md:col-span-2 space-y-3 pb-4">
                  <Label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <UserIcon className="h-3 w-3 text-primary" />
                    Profile Identity / Image
                  </Label>
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden relative group cursor-pointer ring-offset-4 hover:ring-2 ring-primary transition-all">
                      {preview ? <img src={getImageUrl(preview)} className="h-full w-full object-cover" /> : <UserIcon className="h-8 w-8 m-auto mt-6 text-slate-300" />}
                      <label htmlFor="profileImage" className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="h-5 w-5 text-white" />
                      </label>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-slate-900 font-black cursor-pointer hover:text-primary transition-colors" onClick={() => document.getElementById('profileImage')?.click()}>Choose Photo</p>
                      <p className="text-[10px] text-slate-400 font-medium">Recommended: Square PNG/JPG</p>
                    </div>
                    <input id="profileImage" type="file" accept="image/*" className="hidden" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Full Name *</Label>
                  <Input
                    className={`h-14 w-full rounded-xl border-slate-200 bg-slate-50/30 px-5 font-bold focus:ring-4 focus:ring-primary/10 transition-all ${errors.fullName ? "border-red-500 bg-red-50 text-red-600" : ""}`}
                    placeholder="Full Legal Name"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: "" }); }}
                  />
                  {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.fullName}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Email {isPatrol ? "(Optional)" : "*"}</Label>
                  <Input
                    className={`h-14 w-full rounded-xl border-slate-200 bg-slate-50/30 px-5 font-bold focus:ring-4 focus:ring-primary/10 transition-all ${errors.email ? "border-red-500 bg-red-50" : ""}`}
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Contact Number *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 flex items-center gap-1.5 pointer-events-none">
                      <span className="text-base" role="img" aria-label="Ethiopia Flag">🇪🇹</span>
                      <span>+251</span>
                    </span>
                    <Input
                      className={`h-14 w-full rounded-xl border-slate-200 bg-slate-50/30 pl-20 pr-5 font-bold focus:ring-4 focus:ring-primary/10 transition-all ${errors.phoneNumber ? "border-red-500 bg-red-50 text-red-600" : ""}`}
                      placeholder="911 000 000"
                      value={phoneNumber}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        // Strip leading 0 if user types it (e.g. 09... -> 9...)
                        if (val.startsWith("0")) val = val.substring(1);
                        // Also strip 251 if user types it (+251 is already there)
                        if (val.startsWith("251")) val = val.substring(3);

                        // Limit to 9 digits for Ethiopia (9xxxxxxx or 7xxxxxxx)
                        if (val.length <= 9) {
                          setPhoneNumber(val);
                          if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: "" });
                        }
                      }}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.phoneNumber}</p>}
                </div>

                {isPatrol && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary" />
                        Station Address
                      </Label>
                      <Input
                        className={`h-14 w-full rounded-xl border-slate-200 bg-slate-50/30 px-5 font-bold focus:ring-4 focus:ring-primary/10 transition-all ${errors.officeAddress ? "border-red-500 bg-red-50" : ""}`}
                        placeholder="District/Station"
                        value={officeAddress}
                        onChange={(e) => { setOfficeAddress(e.target.value); if (errors.officeAddress) setErrors({ ...errors, officeAddress: "" }); }}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Navigation className="h-3 w-3 text-primary" />
                        Lat/Long (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          className="h-14 rounded-xl border-slate-200 bg-slate-50/30 px-4 font-bold flex-1"
                          placeholder="Lat: 9.0"
                          value={officeLatitude}
                          onChange={(e) => setOfficeLatitude(e.target.value)}
                        />
                        <Input
                          className="h-14 rounded-xl border-slate-200 bg-slate-50/30 px-4 font-bold flex-1"
                          placeholder="Long: 38.0"
                          value={officeLongitude}
                          onChange={(e) => setOfficeLongitude(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Permissions for non-patrol */}
                {!isPatrol && (
                  <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                    <Label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Dashboard Access Control</Label>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-1">
                      <PermissionSelector
                        permissions={permissions}
                        onPermissionsChange={setPermissions}
                        categories={PERMISSION_CATEGORIES}
                        placeholder="Assign Permissions"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* In-Card Footer Actions */}
            <div className="px-8 md:px-12 py-5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Registration Phase 1</p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-14 px-8 rounded-xl font-black text-slate-500 hover:text-slate-900 hover:bg-white transition-all w-full sm:w-auto"
                >
                  Discard
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="h-14 px-10 rounded-xl bg-primary text-white font-black min-w-full sm:min-w-48 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isNew ? (isPatrol ? "Register Officer" : "Create Account") : "Save Changes"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
