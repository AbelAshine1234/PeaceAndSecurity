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
} from "@nestjs/common";
import { ReportTypesService } from "./report-types.service";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/enums";
import { successResponse } from "../../common/types/service-response";
import { CreateReportTypeDto, UpdateReportTypeDto } from "./dto/report-type.dto";

@ApiTags("Report Types")
@Controller("report-types")
export class ReportTypesController {
  constructor(private readonly reportTypesService: ReportTypesService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new report type (Admin only)" })
  async create(@Body() dto: CreateReportTypeDto) {
    const reportType = await this.reportTypesService.create(dto);
    return successResponse("Report type created", reportType);
  }

  @Get()
  @ApiOperation({ summary: "Get report types (supports search and status filter)" })
  async findAll(@Query() query: { search?: string; isActive?: string }) {
    const reportTypes = await this.reportTypesService.findAll(query);
    return successResponse("Report types retrieved", reportTypes);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get report type by ID" })
  async findOne(@Param("id") id: string) {
    const reportType = await this.reportTypesService.findOne(id);
    return successResponse("Report type retrieved", reportType);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a report type (Admin only)" })
  async update(@Param("id") id: string, @Body() dto: UpdateReportTypeDto) {
    const reportType = await this.reportTypesService.update(id, dto);
    return successResponse("Report type updated", reportType);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a report type (Admin only)" })
  async remove(@Param("id") id: string) {
    await this.reportTypesService.remove(id);
    return successResponse("Report type deleted");
  }
}
