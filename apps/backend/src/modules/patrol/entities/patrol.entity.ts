import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { UserStatus } from "../../../common/enums/enums";
import { BaseEntity } from "../../../common/baseentity/base.entity";

@Entity("patrols")
export class Patrol extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: true })
  userCode: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ unique: true, nullable: true })
  email: string;


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

  /** Sub-city or district this officer covers */
  @Column({ nullable: true })
  assignedArea: string;

  /** Office / station address — used for proximity-based report filtering */
  @Column({ nullable: true })
  officeAddress: string;

  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  officeLatitude: number;

  @Column({ type: "decimal", precision: 11, scale: 8, nullable: true })
  officeLongitude: number;

  /** Real-time GPS location (updated from app) */
  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: "timestamp", nullable: true })
  lastLocationUpdate: Date;

  @Column({ nullable: true })
  fcmToken: string;
}
