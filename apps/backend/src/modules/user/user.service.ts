import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import type { UpdateUserDto } from "./dto/update-user.dto";
import { UserStatus, UserRole } from "../../common/enums/enums";
import { CreateUserDto } from "./dto/create-user.dto";
import { sendSMS } from "../../common/utils/sms-sender";
import { normalizeEtPhone } from "../../common/utils/validator";
import { hashPassword } from "../../common/utils/password.util";
import { UserFilterDto } from "./dto/user-filter.dto";
import {
  ServiceResponse,
  successResponse,
} from "../../common/types/service-response";
import { generateRandomCode } from "../../common/utils/generator";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /* ---------------- REGISTER DASHBOARD USER ---------------- */
  async register(dto: CreateUserDto): Promise<ServiceResponse> {
    const normalizedPhone = dto.phoneNumber
      ? normalizeEtPhone(dto.phoneNumber)
      : null;
    const normalizedEmail = dto.email?.trim().toLowerCase();

    if (!normalizedPhone && !normalizedEmail) {
      throw new BadRequestException(
        "Either valid phone number or email is required",
      );
    }

    const existing = await this.userRepository.findOne({
      where: [
        ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    });

    if (existing) {
      throw new ConflictException(
        "User with this phone or email already exists",
      );
    }

    const userRole = dto.role ?? UserRole.SYSTEM_ADMIN;

    // Only allow dashboard roles here — patrol/citizen have their own endpoints
    if (userRole === UserRole.PATROL || userRole === UserRole.CITIZEN) {
      throw new BadRequestException(
        "Use the /patrols or /citizens endpoints to register patrol officers or citizens.",
      );
    }

    const isStaff = true; // All users in the `users` table are staff/admin

    const user = this.userRepository.create({
      fullName: dto.fullName,
      userCode: generateRandomCode(8),
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      role: userRole,
      isStaffUser: isStaff,
      profileImage: dto.profileImage,
      permissions: dto.permissions || [],
      status: UserStatus.PENDING,
      isPasswordSet: false,
      isPhoneVerified: false,
      isEmailVerified: false,
    });

    const saved = await this.userRepository.save(user);

    // Notify via SMS
    try {
      if (saved.phoneNumber) {
        await sendSMS({
          recipient: saved.phoneNumber,
          messageBody: `[EcoGuard] Your admin account has been created.\nEmail: ${saved.email ?? "N/A"}\nPlease login to the dashboard and set your password.`,
        });
      }
    } catch {
      console.error("Failed to send registration SMS");
    }

    return successResponse("Admin user created successfully.", {
      id: saved.id,
      userCode: saved.userCode,
      fullName: saved.fullName,
      phoneNumber: saved.phoneNumber,
      email: saved.email,
      role: saved.role,
      status: saved.status,
    });
  }

  /* ---------------- GET PROFILE ---------------- */
  async getUserProfile(
    userId: string,
  ): Promise<ServiceResponse<Omit<User, "password">>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return successResponse(
      "Profile retrieved successfully",
      this.sanitizeUser(user),
    );
  }

  /* ---------------- UPDATE PROFILE ---------------- */
  async updateUserProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<ServiceResponse<Omit<User, "password">>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    if (dto.phoneNumber) {
      const normalizedPhone = normalizeEtPhone(dto.phoneNumber);
      if (!normalizedPhone)
        throw new BadRequestException("Invalid phone number format");
      dto.phoneNumber = normalizedPhone;
    }
    if (dto.email) {
      dto.email = dto.email.trim().toLowerCase();
    }

    Object.assign(user, dto);
    const updated = await this.userRepository.save(user);
    return successResponse(
      "Profile updated successfully",
      this.sanitizeUser(updated),
    );
  }

  /* ---------------- GET ALL USERS (PAGINATED) ---------------- */
  async getAllUsers(filterDto: UserFilterDto): Promise<any> {
    const {
      role,
      status,
      search,
      isStaffUser,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = filterDto;

    const query = this.userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.userCode",
        "user.fullName",
        "user.phoneNumber",
        "user.email",
        "user.role",
        "user.status",
        "user.isPhoneVerified",
        "user.isEmailVerified",
        "user.profileImage",
        "user.isStaffUser",
        "user.permissions",
        "user.createdAt",
        "user.updatedAt",
      ]);

    // Dashboard displays admin roles only — exclude patrol/citizen
    query.andWhere("user.role NOT IN (:...mobileRoles)", {
      mobileRoles: [UserRole.PATROL, UserRole.CITIZEN],
    });

    if (role) query.andWhere("user.role = :role", { role });
    if (status) query.andWhere("user.status = :status", { status });

    if (isStaffUser !== undefined) {
      query.andWhere("user.isStaffUser = :isStaffUser", { isStaffUser });
    }
    if (startDate)
      query.andWhere("user.createdAt >= :startDate", { startDate });
    if (endDate) query.andWhere("user.createdAt <= :endDate", { endDate });

    if (search && search.trim()) {
      query.andWhere(
        `(user.fullName ILIKE :search
          OR user.email ILIKE :search
          OR user.userCode ILIKE :search
          OR user.phoneNumber ILIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    query.orderBy(`user.${sortBy}`, sortOrder as "ASC" | "DESC");
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: "Users retrieved successfully",
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages,
      previousPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    };
  }

  /* ---------------- GET SINGLE USER BY PARAMS ---------------- */
  async getUser(
    params: Record<string, any>,
  ): Promise<ServiceResponse<Omit<User, "password">>> {
    if (!params || Object.keys(params).length === 0) {
      throw new BadRequestException(
        "At least one parameter is required to fetch a user",
      );
    }

    const normalizedParams: Record<string, any> = { ...params };
    if (normalizedParams.email) {
      normalizedParams.email = normalizedParams.email.trim().toLowerCase();
    }
    if (normalizedParams.phoneNumber) {
      normalizedParams.phoneNumber = normalizeEtPhone(
        normalizedParams.phoneNumber,
      );
    }

    const qb = this.userRepository.createQueryBuilder("user");
    Object.entries(normalizedParams).forEach(([key, value], index) => {
      qb.andWhere(`user.${key} = :v${index}`, { [`v${index}`]: value });
    });

    const user = await qb.getOne();
    if (!user) throw new NotFoundException("User not found");
    return successResponse(
      "User retrieved successfully",
      this.sanitizeUser(user),
    );
  }

  /* ---------------- TOGGLE STATUS ---------------- */
  async toggleUserStatus(
    id: string,
  ): Promise<ServiceResponse<Omit<User, "password">>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    user.status =
      user.status === UserStatus.ACTIVE
        ? UserStatus.DISABLED
        : UserStatus.ACTIVE;
    const updated = await this.userRepository.save(user);
    return successResponse(
      "User status updated successfully",
      this.sanitizeUser(updated),
    );
  }

  /* ---------------- RESET PASSWORD BY ADMIN (dashboard users only) ---------------- */
  async resetUserPassword(
    adminId: string,
    targetId: string,
  ): Promise<ServiceResponse> {
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    const user = await this.userRepository.findOne({ where: { id: targetId } });

    if (!user) throw new NotFoundException("User not found");
    if (!admin) throw new NotFoundException("Admin not found");

    const isSystemAdmin =
      admin.role === UserRole.SYSTEM_SUPER_ADMIN ||
      admin.role === UserRole.SYSTEM_ADMIN;
    if (!isSystemAdmin) {
      throw new BadRequestException("Only system admins can reset passwords");
    }

    // Patrol / Citizen users are in separate tables — they should use the auth PIN reset
    if (user.role === UserRole.PATROL || user.role === UserRole.CITIZEN) {
      throw new BadRequestException(
        "Patrol and Citizen PINs are managed via the auth PIN endpoints or /patrols/:id and /citizens/:id.",
      );
    }

    const tempPassword = generateRandomCode(8);
    user.password = await hashPassword(tempPassword);
    user.isPasswordSet = true;
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    if (user.phoneNumber) {
      const recipient = normalizeEtPhone(user.phoneNumber);
      if (recipient) {
        await sendSMS({
          recipient,
          messageBody: `[EcoGuard] Your password has been reset by admin. Temporary password: ${tempPassword}\nPlease login to the dashboard and change your password immediately.`,
        }).catch(() => void 0);
      }
    }

    return successResponse(
      "Password reset successfully. New password sent via SMS.",
      { tempPassword },
    );
  }

  /* ---------------- SANITIZER ---------------- */
  private sanitizeUser(user: User): Omit<User, "password"> {
    const { password, ...rest } = user as any;
    return rest;
  }
}
