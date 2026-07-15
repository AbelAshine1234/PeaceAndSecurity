import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { processUploads } from "../../common/utils/file-upload.util";
import { PatrolService } from "./patrol.service";
import { CreatePatrolDto, CreatePatrolFormDto } from "./dto/create-patrol.dto";
import { UpdatePatrolDto, UpdatePatrolFormDto } from "./dto/update-patrol.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/enums";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("Patrols")
@Controller("patrols")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PatrolController {
  constructor(private readonly patrolService: PatrolService) { }

  /**
   * Register a new patrol officer from the Admin Dashboard.
   * Accepts multipart/form-data (for profile image upload) or JSON.
   */
  @Post()
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Register a new patrol officer (Admin Dashboard)" })
  @ApiResponse({
    status: 201,
    description: "Patrol officer registered successfully.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreatePatrolFormDto })
  @UseInterceptors(FileInterceptor("profileImage", { storage: memoryStorage() }))
  async create(
    @Body() dto: CreatePatrolDto,
    @UploadedFile() file?: any,
  ) {
    return this.patrolService.create(dto, file);
  }

  @Get()
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Get all patrol officers (paginated, filterable)" })
  @ApiResponse({
    status: 200,
    description: "Patrol officers retrieved successfully.",
  })
  findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    },
  ) {
    return this.patrolService.findAll(query);
  }

  @Get("nearby")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Get nearby patrol officers based on coordinates" })
  @ApiResponse({
    status: 200,
    description: "Nearby patrol officers retrieved successfully.",
  })
  findNearby(
    @Query() query: { latitude: string; longitude: string; radiusKm?: string },
  ) {
    return this.patrolService.findNearby(
      Number(query.latitude),
      Number(query.longitude),
      query.radiusKm ? Number(query.radiusKm) : 10,
    );
  }

  @Get(":id")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Get a patrol officer by ID" })
  @ApiResponse({
    status: 200,
    description: "Patrol officer retrieved successfully.",
  })
  findOne(@Param("id") id: string) {
    return this.patrolService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Update a patrol officer's details" })
  @ApiResponse({
    status: 200,
    description: "Patrol officer updated successfully.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UpdatePatrolFormDto })
  @UseInterceptors(FileInterceptor("profileImage", { storage: memoryStorage() }))
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePatrolDto,
    @UploadedFile() file?: any,
  ) {
    return this.patrolService.update(id, dto, file);
  }

  @Delete(":id")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Delete a patrol officer" })
  @ApiResponse({
    status: 200,
    description: "Patrol officer deleted successfully.",
  })
  remove(@Param("id") id: string) {
    return this.patrolService.remove(id);
  }

  @Patch("location")
  @Roles(UserRole.PATROL)
  @ApiOperation({
    summary: "Update patrol officer's real-time location (from mobile app)",
  })
  @ApiResponse({ status: 200, description: "Location updated successfully." })
  async updateLocation(@Request() req: any, @Body() dto: UpdateLocationDto) {
    return this.patrolService.updateLocation(
      req.user.id,
      dto.latitude,
      dto.longitude,
    );
  }

  @Get("me/profile")
  @Roles(UserRole.PATROL)
  @ApiOperation({ summary: "Get currently logged-in patrol officer's profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully." })
  async getProfile(@Request() req: any) {
    return this.patrolService.getPatrolProfile(req.user.id);
  }

  @Patch("me/profile")
  @Roles(UserRole.PATROL)
  @ApiOperation({
    summary: "Update currently logged-in patrol officer's profile",
  })
  @ApiResponse({ status: 200, description: "Profile updated successfully." })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UpdatePatrolFormDto })
  @UseInterceptors(FileInterceptor("profileImage", { storage: memoryStorage() }))
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdatePatrolDto,
    @UploadedFile() file?: any,
  ) {
    if (file) {
      const [asset] = await processUploads(
        file,
        { baseDir: "uploads", publicBase: "/", makeThumb: false, quality: 82 },
        "profiles",
      );
      dto.profileImage = asset?.url;
    }
    return this.patrolService.updatePatrolProfile(req.user.id, dto);
  }
}
