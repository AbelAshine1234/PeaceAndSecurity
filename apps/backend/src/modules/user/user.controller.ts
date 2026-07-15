import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
  Inject,
  UploadedFile,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";

import { UserService } from "./user.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserFilterDto } from "./dto/user-filter.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateUserFormDto } from "./dto/create-user-form.dto";
import { UpdateUserFormDto } from "./dto/update-user-form.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/enums";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  processUploads,
  type MulterFile,
} from "../../common/utils/file-upload.util";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const profileImageMulter = { storage: memoryStorage() };

@ApiTags("Users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  @Post("register")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: "Register internal user and trigger OTP verification (Admin only)",
  })
  @ApiResponse({
    status: 201,
    description: "User created (or OTP re-sent) and registration token issued",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: CreateUserFormDto,
    description: "Form data with optional profile image",
  })
  @UseInterceptors(FileInterceptor("profileImage", profileImageMulter))
  async registerUser(
    @Body() dto: CreateUserDto,
    @UploadedFile() file?: MulterFile,
  ) {
    const profileUrl = await this.handleProfileImageUpload(file);
    if (profileUrl) {
      dto.profileImage = profileUrl;
    }
    return this.userService.register(dto);
  }

  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  @Get("all")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: "Get all users with filtering and pagination (Admin only)",
  })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  async getAllUsers(@Query() filterDto: UserFilterDto) {
    return this.userService.getAllUsers(filterDto);
  }

  @Get("profile")
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  async getProfile(@Request() req: any) {
    const userId = req.user.id;
    return this.userService.getUserProfile(userId);
  }

  @Patch("profile")
  @ApiOperation({ summary: "Update user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: UpdateUserFormDto,
    description: "Form data with optional profile image",
  })
  @UseInterceptors(FileInterceptor("profileImage", profileImageMulter))
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
    @UploadedFile() file?: MulterFile,
  ) {
    const profileUrl = await this.handleProfileImageUpload(file);
    if (profileUrl) {
      updateUserDto.profileImage = profileUrl;
    }
    const userId = req.user.id;
    return this.userService.updateUserProfile(userId, updateUserDto);
  }

  @Get(":id")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Get user by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  async getUserById(@Param("id") id: string) {
    return this.userService.getUser({ id });
  }

  @Put(":id/toggle-status")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Toggle user active status (Admin only)" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  async toggleUserStatus(@Param("id") id: string) {
    return this.userService.toggleUserStatus(id);
  }

  @Patch(":id")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Update user profile (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "User profile updated successfully",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: UpdateUserFormDto,
    description: "Form data with optional profile image",
  })
  @UseInterceptors(FileInterceptor("profileImage", profileImageMulter))
  async adminUpdateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: MulterFile,
  ) {
    const profileUrl = await this.handleProfileImageUpload(file);
    if (profileUrl) {
      updateUserDto.profileImage = profileUrl;
    }
    return this.userService.updateUserProfile(id, updateUserDto);
  }

  @Post(":id/reset-password")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Reset user password by admin" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  async resetUserPassword(@Param("id") id: string, @Request() req: any) {
    return this.userService.resetUserPassword(req.user.id, id);
  }

  private async handleProfileImageUpload(file?: MulterFile) {
    if (!file) return undefined;
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException("Only JPG and PNG images are allowed");
    }
    const [asset] = await processUploads(
      file,
      { baseDir: "uploads", publicBase: "/", makeThumb: false, quality: 82 },
      "profiles",
    );
    return asset?.url;
  }
}
