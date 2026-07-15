import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { User } from "../user/entities/user.entity";
import { Report } from "../reports/entities/report.entity";
import { Camera } from "../cameras/entities/camera.entity";
import { ReportType } from "../report-types/entities/report-type.entity";
import { Citizen } from "../citizen/entities/citizen.entity";
import { Patrol } from "../patrol/entities/patrol.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Report,
      Camera,
      ReportType,
      Citizen,
      Patrol,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
