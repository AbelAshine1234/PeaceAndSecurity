import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Report } from "./report.entity";
import { User } from "../../user/entities/user.entity";
import { Citizen } from "../../citizen/entities/citizen.entity";
import { Patrol } from "../../patrol/entities/patrol.entity";
import { ReportStatus } from "../../../common/enums/enums";

@Entity("report_logs")
export class ReportLog extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  reportId: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: "reportId" })
  report: Report;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ nullable: true })
  patrolId: string;

  @ManyToOne(() => Patrol, { nullable: true })
  @JoinColumn({ name: "patrolId" })
  patrol: Patrol;

  @Column({ nullable: true })
  citizenId: string;

  @ManyToOne(() => Citizen, { nullable: true })
  @JoinColumn({ name: "citizenId" })
  citizen: Citizen;

  @Column("decimal", { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column("decimal", { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({
    type: "enum",
    enum: ReportStatus,
  })
  status: ReportStatus;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
