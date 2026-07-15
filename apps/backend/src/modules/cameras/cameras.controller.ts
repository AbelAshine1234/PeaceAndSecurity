import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { CamerasService } from "./cameras.service";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/enums";
import { successResponse } from "../../common/types/service-response";

@ApiTags("Cameras")
@Controller("cameras")
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a new camera" })
  async create(@Body() createCameraDto: any) {
    const camera = await this.camerasService.create(createCameraDto);
    return successResponse("Camera registered successfully", camera);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all cameras" })
  async findAll() {
    const cameras = await this.camerasService.findAll();
    return successResponse("Cameras retrieved", cameras);
  }

  // ⚠️ IMPORTANT: These alert routes MUST come before /:id to avoid "alerts" being treated as a camera ID
  @Get("alerts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all camera AI detection alerts" })
  async findAllAlerts() {
    const alerts = await this.camerasService.findAllAlerts();
    return successResponse("Camera alerts retrieved", alerts);
  }

  @Post("alerts")
  @ApiOperation({
    summary: "Create a camera alert (called by AI detection system)",
  })
  async createAlert(
    @Body()
    dto: {
      cameraId: string;
      violationType?: string;
      reportType?: string; // Backward compatibility
      evidenceUrl?: string;
      confidenceScore?: number;
    },
  ) {
    const alert = await this.camerasService.createAlert(
      dto.cameraId,
      dto.violationType || dto.reportType,
      dto.evidenceUrl,
      dto.confidenceScore,
    );
    return successResponse("Camera alert created", alert);
  }

  @Patch("alerts/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update alert status (e.g. OPEN -> REVIEWED)" })
  async updateAlertStatus(
    @Param("id") id: string,
    @Body() dto: { status: string },
  ) {
    const alert = await this.camerasService.updateAlertStatus(
      id,
      dto.status as any,
    );
    return successResponse("Alert status updated", alert);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a single camera by ID" })
  async findOne(@Param("id") id: string) {
    const camera = await this.camerasService.findOne(id);
    return successResponse("Camera retrieved", camera);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update camera details" })
  async update(@Param("id") id: string, @Body() updateCameraDto: any) {
    const camera = await this.camerasService.update(id, updateCameraDto);
    return successResponse("Camera updated successfully", camera);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a camera" })
  async remove(@Param("id") id: string) {
    await this.camerasService.remove(id);
    return successResponse("Camera deleted successfully");
  }
}
