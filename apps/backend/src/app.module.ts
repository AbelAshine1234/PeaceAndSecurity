import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { OtpModule } from "./modules/otp/otp.module";
import { UserModule } from "./modules/user/user.module";
import { ConfigService } from "@nestjs/config";
import { SeederModule } from "database/seeds/seeder.module";
import { DashboardModule } from "modules/dashboard/dashboard.module";

import { ThrottlerModule } from "@nestjs/throttler";

import { ScheduleModule } from "@nestjs/schedule";
import { ReportsModule } from "./modules/reports/reports.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { CitizenModule } from "./modules/citizen/citizen.module";
import { PatrolModule } from "./modules/patrol/patrol.module";
import { ReportTypesModule } from "./modules/report-types/report-types.module";
import { CamerasModule } from "./modules/cameras/cameras.module";

import { MediaModule } from "./modules/media/media.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const dbConfig = {
          type: "postgres" as const,
          host: cfg.get<string>("DB_HOST") || "localhost",
          port: cfg.get<number>("DB_PORT") || 5432,
          username: cfg.get<string>("DB_USERNAME") || "",
          password: String(cfg.get("DB_PASSWORD") || ""),
          database: cfg.get<string>("DB_NAME") || "",
          autoLoadEntities: true,
          synchronize: true,
        };

        // Log connection attempt (without password for security)
        console.log("Database connection config:", {
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          database: dbConfig.database,
          passwordLength: dbConfig.password.length,
        });

        return dbConfig;
      },
    }),
    SeederModule,
    OtpModule,
    UserModule,
    AuthModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    CitizenModule,
    PatrolModule,
    ReportTypesModule,
    CamerasModule,
    MediaModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule { }
