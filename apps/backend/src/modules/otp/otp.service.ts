import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Otp } from "./entities/otp.entity";
import { CreateOtpDto } from "./dto/create-otp.dto";
import { normalizeEmail, normalizeEtPhone } from "common/utils/validator";
import { OTPStatus, OTPType } from "common/enums/enums";
import {
  Repository,
  LessThan,
  FindOneOptions,
  FindOptionsWhere,
} from "typeorm";

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp) private readonly otpRepository: Repository<Otp>,
  ) { }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getExpiryTime(): Date {
    return new Date(Date.now() + 2 * 60 * 1000);
  }

  async createOtp(dto: CreateOtpDto) {
    const { userId, otpType } = dto;

    const email = normalizeEmail(dto.email);
    const phone = normalizeEtPhone(dto.phoneNumber);

    if (!email && !phone) {
      throw new BadRequestException(
        "Provide a valid email or phoneNumber for OTP.",
      );
    }

    // Rate limiting & Lockout: Check for existing requested/expired OTP
    const existing = await this.otpRepository.findOne({
      where: { userId, otpType },
      order: { createdAt: "DESC" },
    });

    if (existing) {
      const now = new Date();
      const diffSeconds = (now.getTime() - existing.createdAt.getTime()) / 1000;

      // 1. Lockout check: If last OTP had too many failures, block for 15 minutes
      if (existing.attemptCount >= 3) {
        const lockDiffMinutes = (now.getTime() - existing.createdAt.getTime()) / (1000 * 60);
        if (lockDiffMinutes < 15) {
          throw new BadRequestException(`Too many failed attempts. Your account is temporarily locked for OTP requests. Please try again in ${Math.round(15 - lockDiffMinutes)} minutes.`);
        }
      }

      // 2. Cooldown check: 60 seconds between resends
      if (existing.status === OTPStatus.REQUESTED && diffSeconds < 60) {
        throw new BadRequestException(`Please wait ${Math.round(60 - diffSeconds)} seconds before requesting a new OTP.`);
      }

      // Mark old OTP as expired if we are about to create a new one
      if (existing.status === OTPStatus.REQUESTED) {
        existing.status = OTPStatus.EXPIRED;
        await this.otpRepository.save(existing);
      }
    }

    const otp = this.otpRepository.create({
      userId,
      otpType,
      email: email ?? null,
      phoneNumber: phone ?? null,
      code: this.generateOtpCode(),
      status: OTPStatus.REQUESTED,
      attemptCount: 0,
      expiresAt: this.getExpiryTime(),
    });

    await this.otpRepository.save(otp);

    return {
      message: "OTP sent successfully",
      otpCode: otp.code,
      expiresAt: otp.expiresAt,
      channel: phone ? "PHONE" : "EMAIL",
    };
  }

  async verifyOtp(userId: string, otpType: OTPType, code: string): Promise<Otp> {
    const otp = await this.otpRepository.findOne({
      where: { userId, otpType, status: OTPStatus.REQUESTED },
      order: { createdAt: "DESC" },
    });

    if (!otp) throw new BadRequestException("No active OTP found. Please request a new one.");

    if (otp.expiresAt && otp.expiresAt <= new Date()) {
      otp.status = OTPStatus.EXPIRED;
      await this.otpRepository.save(otp);
      throw new BadRequestException("OTP has expired.");
    }

    if (otp.attemptCount >= 3) {
      otp.status = OTPStatus.EXPIRED;
      await this.otpRepository.save(otp);
      throw new BadRequestException("Too many failed attempts. Please request a new OTP.");
    }

    if (otp.code !== code) {
      otp.attemptCount += 1;
      await this.otpRepository.save(otp);

      const remaining = 3 - otp.attemptCount;
      if (remaining <= 0) {
        throw new BadRequestException("Too many failed attempts. Account locked for this session. Request a new OTP.");
      }
      throw new BadRequestException(`Invalid OTP code. ${remaining} attempts remaining.`);
    }

    // Success
    otp.status = OTPStatus.USED;
    await this.otpRepository.save(otp);
    return otp;
  }

  async removeBulkOtps(where: Partial<Otp>) {
    await this.otpRepository.delete(where);
  }

  async cleanupExpiredOtps() {
    await this.otpRepository.delete({ expiresAt: LessThan(new Date()) });
  }

  async findOneOtp(
    criteria: Partial<Otp> | Partial<Otp>[],
  ): Promise<Otp | null> {
    if (Array.isArray(criteria) && criteria.length === 0) {
      throw new BadRequestException("where cannot be an empty array");
    }
    if (!Array.isArray(criteria) && Object.keys(criteria).length === 0) {
      throw new BadRequestException("where cannot be empty");
    }

    const options: FindOneOptions<Otp> = {
      where: criteria as FindOptionsWhere<Otp> | FindOptionsWhere<Otp>[],
      order: { createdAt: "DESC" },
    };

    return this.otpRepository.findOne(options);
  }

  async deleteOneOtpLatest(
    criteria: Partial<Otp> | Partial<Otp>[],
  ): Promise<Otp | null> {
    if (Array.isArray(criteria) && criteria.length === 0) {
      throw new BadRequestException("where cannot be an empty array");
    }
    if (!Array.isArray(criteria) && Object.keys(criteria).length === 0) {
      throw new BadRequestException("where cannot be empty");
    }

    const entity = await this.otpRepository.findOne({
      where: criteria as FindOptionsWhere<Otp> | FindOptionsWhere<Otp>[],
      order: { createdAt: "DESC" },
    });
    if (!entity) return null;

    await this.otpRepository.remove(entity);
    return entity;
  }
}
