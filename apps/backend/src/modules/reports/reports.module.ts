import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { Report } from "./entities/report.entity";
import { ReportLog } from "./entities/report-log.entity";
import { Patrol } from "../patrol/entities/patrol.entity";
import { Citizen } from "../citizen/entities/citizen.entity";
import { User } from "../user/entities/user.entity";
import { ReportTypesModule } from "../report-types/report-types.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportLog, Patrol, Citizen, User]),
    ReportTypesModule,
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }
