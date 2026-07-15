import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";
import { UserStatus } from "../../../common/enums/enums";
import { BaseEntity } from "../../../common/baseentity/base.entity";


@Entity("citizens")
export class Citizen extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: true })
  userCode: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phoneNumber: string;

  /** Hashed PIN — used for mobile app login. Never exposed in responses. */
  @Column({ nullable: true, select: false })
  pin: string;

  @Column({ default: false })
  isPinSet: boolean;

  @Column({ nullable: true })
  profileImage: string;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  fcmToken: string;
}
