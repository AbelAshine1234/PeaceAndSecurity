import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Camera } from "./camera.entity";

export enum CameraAlertStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  CLOSED = "CLOSED",
}

@Entity("camera_alerts")
export class CameraAlert extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  cameraId: string;

  @ManyToOne(() => Camera)
  @JoinColumn({ name: "cameraId" })
  camera: Camera;

  @Column()
  violationType: string;

  @Column({ type: "text", nullable: true })
  evidenceUrl: string;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 4,
    nullable: true,
    default: 0,
  })
  confidenceScore: number;

  @Column({
    type: "enum",
    enum: CameraAlertStatus,
    default: CameraAlertStatus.OPEN,
  })
  status: CameraAlertStatus;

  @Column({ nullable: true })
  assignedReportId: string;

  @CreateDateColumn()
  createdAt: Date;
}
