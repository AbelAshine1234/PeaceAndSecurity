import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Citizen } from "../../citizen/entities/citizen.entity";
import { Patrol } from "../../patrol/entities/patrol.entity";
import { ReportType } from "../../report-types/entities/report-type.entity";
import { ReportStatus, NoiseAreaType } from "../../../common/enums/enums";

@Entity("reports")
export class Report extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: true })
  caseId: string; // e.g., REP-123456

  @Column({ nullable: true })
  reporterId: string;

  @ManyToOne(() => Citizen, { nullable: true })
  @JoinColumn({ name: "reporterId" })
  reporter: Citizen;


  @Column({ nullable: true })
  reporterPhoneNumber: string;


  @Column({ nullable: true })
  reportTypeId: string;

  @ManyToOne(() => ReportType, { nullable: true })
  @JoinColumn({ name: "reportTypeId" })
  reportType: ReportType;

  @Column({ nullable: true })
  violationType: string;

  @Column({ type: "text", nullable: true })
  reportDescription: string;

  // Location
  @Column("decimal", { precision: 10, scale: 7 })
  latitude: number;

  @Column("decimal", { precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  area: string;

  // Evidence from Citizen App — split by media type for gallery rendering
  @Column("text", { array: true, default: [] })
  imageUrls: string[];

  @Column("text", { array: true, default: [] })
  videoUrls: string[];

  @Column("text", { array: true, default: [] })
  audioUrls: string[];

  // Legacy / combined accessor (all media in one list)
  @Column("text", { array: true, default: [] })
  evidenceUrls: string[];

  // For Noise reports (measured via app)
  @Column("float", { nullable: true })
  decibelLevel: number;

  @Column({
    type: "enum",
    enum: NoiseAreaType,
    nullable: true,
  })
  noiseAreaType: NoiseAreaType | string; // Residential or Commercial

  @Column({ nullable: true })
  noisePollutionStatus: string; // Pollution or Not Pollution

  // Anonymity preference
  @Column({ default: false })
  isAnonymous: boolean;

  // Status
  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.SUBMITTED,
  })
  status: ReportStatus;

  // Patrol Assignment
  @Column({ nullable: true })
  assignedPatrolId: string;

  @ManyToOne(() => Patrol, { nullable: true })
  @JoinColumn({ name: "assignedPatrolId" })
  assignedPatrol: Patrol;

  @Column({ nullable: true })
  assignedAt: Date;

  // Patrol Inspection
  @Column({ nullable: true })
  inspectionStartedAt: Date;

  @Column({ nullable: true })
  inspectionCompletedAt: Date;

  @Column("text", { nullable: true })
  patrolNotes: string;

  // Patrol follow-up evidence — split by type
  @Column("text", { array: true, default: [] })
  patrolImageUrls: string[];

  @Column("text", { array: true, default: [] })
  patrolVideoUrls: string[];

  @Column("text", { array: true, default: [] })
  patrolAudioUrls: string[];

  @Column("text", { array: true, default: [] })
  patrolEvidenceUrls: string[];

  // Admin rejection reason
  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
