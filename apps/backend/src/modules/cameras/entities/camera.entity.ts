import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";

@Entity("cameras")
export class Camera extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  cameraId: string; // Hardware ID or similar

  @Column()
  locationName: string;

  @Column("decimal", { precision: 10, scale: 7 })
  latitude: number;

  @Column("decimal", { precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  streamUrl: string; // RTSP or HLS URL

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastMaintenanceDate: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata: any; // Additional camera info

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
