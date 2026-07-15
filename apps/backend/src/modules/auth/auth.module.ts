import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { User } from "../user/entities/user.entity";
import { Patrol } from "../patrol/entities/patrol.entity";
import { Citizen } from "../citizen/entities/citizen.entity";
import { OtpModule } from "../otp/otp.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Patrol, Citizen]),
    PassportModule,
    JwtModule.register({}),
    OtpModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
