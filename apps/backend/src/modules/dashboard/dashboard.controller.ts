import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { successResponse } from "../../common/types/service-response";

@ApiTags("Dashboard")
@ApiBearerAuth()
@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics and trends" })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
  })
  async getStats(@Req() req: any) {
    const stats = await this.dashboardService.getStats(req.user);
    return successResponse("Dashboard statistics retrieved", stats);
  }

  @Get("fleet-locations")
  @ApiOperation({ summary: "Get real-time locations of all active patrols and citizens" })
  @ApiResponse({
    status: 200,
    description: "Fleet locations retrieved successfully",
  })
  async getFleetLocations() {
    const data = await this.dashboardService.getFleetLocations();
    return successResponse("Fleet locations retrieved", data);
  }

  @Get("recent-reports")
  @ApiOperation({ summary: "Get latest 10 reports" })
  @ApiResponse({
    status: 200,
    description: "Recent reports retrieved successfully",
  })
  async getRecentReports() {
    const data = await this.dashboardService.getRecentReports();
    return successResponse("Recent reports retrieved", data);
  }
}
