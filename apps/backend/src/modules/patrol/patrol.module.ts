import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { PatrolController } from "./patrol.controller";
import { PatrolService } from "./patrol.service";
import { Patrol } from "./entities/patrol.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Patrol]),
    MulterModule.register({ storage: require("multer").memoryStorage() }),
  ],
  controllers: [PatrolController],
  providers: [PatrolService],
  exports: [PatrolService],
})
export class PatrolModule {}
