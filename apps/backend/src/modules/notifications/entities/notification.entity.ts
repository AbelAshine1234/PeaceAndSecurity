import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { NotificationType } from "../../../common/enums/enums";

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    patrolId: string;

    @Column({ nullable: true })
    citizenId: string;

    @Column()
    title: string;

    @Column("text")
    message: string;

    @Column({
        type: "enum",
        enum: NotificationType,
        default: NotificationType.GENERAL,
    })
    type: NotificationType;

    @Column({ type: "jsonb", nullable: true })
    data: any;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
