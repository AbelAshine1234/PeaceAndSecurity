import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportTypesService } from "./report-types.service";
import { ReportTypesController } from "./report-types.controller";
import { ReportType } from "./entities/report-type.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ReportType])],
  controllers: [ReportTypesController],
  providers: [ReportTypesService],
  exports: [ReportTypesService],
})
export class ReportTypesModule {}
