import apiClient from "../api-client";
import { API_ENDPOINTS } from "../api-config";
import {
  ServiceResponse,
  LoginResponse,
  BackendUser,
} from "../api-types";
import { User } from "../auth";
import { UserRole } from "../enums";

export interface LoginCredentials {
  email?: string;
  phoneNumber?: string;
  password: string;
}

class AuthService {
  /**
   * Login with email or phone number
   */
  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ServiceResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.USER_LOGIN,
      credentials
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Login failed");
    }

    const { accessToken, refreshToken, user: backendUser } = response.data.data;

    // Store tokens
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Transform backend user to frontend user format
    const user = this.transformBackendUser(backendUser);

    return { user, accessToken, refreshToken };
  }

  /**
   * Pre-login check to see if password is set
   */
  async preLogin(
    email?: string,
    phoneNumber?: string
  ): Promise<{ isPasswordSet: boolean; setPasswordToken?: string }> {
    const response = await apiClient.post<
      ServiceResponse<{ isPasswordSet: boolean; resetToken?: string }>
    >(API_ENDPOINTS.AUTH.USER_PRE_LOGIN, { email, phoneNumber });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Pre-login failed");
    }

    return {
      isPasswordSet: response.data.data.isPasswordSet,
      setPasswordToken: response.data.data.resetToken,
    };
  }

  /**
   * Set user password using token
   */
  async setPassword(
    token: string,
    password: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ServiceResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.USER_SET_PASSWORD,
      { password },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to set password");
    }

    const { accessToken, refreshToken, user: backendUser } = response.data.data;

    // Store tokens
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Transform backend user to frontend user format
    const user = this.transformBackendUser(backendUser);

    return { user, accessToken, refreshToken };
  }

  /**
   * Transform backend user to frontend user format
   */
  private transformBackendUser(backendUser: any): User {
    if (!backendUser) {
      throw new Error("User data is missing from backend response");
    }

    // Map backend role to frontend role
    const role = backendUser.role as UserRole;

    return {
      id: backendUser.id,
      email: backendUser.email || backendUser.phoneNumber || "",
      fullName: backendUser.fullName,
      role,
      phoneNumber: backendUser.phoneNumber,
      profileImage: backendUser.profileImage,
      permissions: backendUser.permissions || [],
      createdAt: backendUser.createdAt || new Date().toISOString(),
      isPasswordSet: backendUser.isPasswordSet,
      isPhoneVerified: backendUser.isPhoneVerified,
      isEmailVerified: backendUser.isEmailVerified,
    };
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ServiceResponse<BackendUser>>(
        API_ENDPOINTS.USERS.GET_PROFILE
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return this.transformBackendUser(response.data.data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ServiceResponse<any>> {
    const response = await apiClient.patch<ServiceResponse<any>>(
      API_ENDPOINTS.AUTH.USER_PASSWORD_CHANGE,
      { currentPassword, newPassword }
    );
    return response.data;
  }
}

export const authService = new AuthService();
