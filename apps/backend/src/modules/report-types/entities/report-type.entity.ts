import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { ReportTypeEnum } from "../../../common/enums/enums";

@Entity("report_types")
export class ReportType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ReportTypeEnum,
    default: ReportTypeEnum.OTHERS,
    unique: true,
  })
  name: ReportTypeEnum;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "float", nullable: true, default: 45.0 })
  residentialDecibelThreshold: number;

  @Column({ type: "float", nullable: true, default: 55.0 })
  commercialDecibelThreshold: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
