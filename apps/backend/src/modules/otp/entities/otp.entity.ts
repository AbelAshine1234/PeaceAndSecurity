import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Check,
} from "typeorm";
import { OTPStatus, OTPType } from "../../../common/enums/enums";

@Entity("otps")
@Index("idx_otps_user_type_created", ["userId", "otpType", "createdAt"])
@Index("idx_otps_phone_type_created", ["phoneNumber", "otpType", "createdAt"])
@Check(`"email" IS NOT NULL OR "phoneNumber" IS NOT NULL`)
export class Otp {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "varchar", length: 20, nullable: true })
  phoneNumber?: string | null;

  @Index()
  @Column({ type: "varchar", length: 160, nullable: true })
  email?: string | null;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 6 })
  code: string;

  @Index()
  @Column({ type: "enum", enum: OTPType })
  otpType: OTPType;

  @Column({ type: "enum", enum: OTPStatus, default: OTPStatus.REQUESTED })
  status: OTPStatus;

  @Index()
  @Column({
    type: "timestamptz",
    nullable: true,
    default: () => `CURRENT_TIMESTAMP + INTERVAL '5 minutes'`,
  })
  expiresAt: Date | null;

  @Column({ type: "int", default: 0 })
  attemptCount: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
