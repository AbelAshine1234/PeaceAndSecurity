import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../modules/user/entities/user.entity";
import { ReportType } from "../../modules/report-types/entities/report-type.entity";
import { AdminSeederService } from "./admin-seeder.service";
import { ReportTypeSeederService } from "./report-type-seeder.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, ReportType])],
  providers: [AdminSeederService, ReportTypeSeederService],
  exports: [AdminSeederService, ReportTypeSeederService],
})
export class SeederModule { }
