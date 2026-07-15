import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { NotificationType } from "../../common/enums/enums";
import * as admin from "firebase-admin";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class NotificationsService implements OnModuleInit {
    private firebaseApp: admin.app.App;

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit() {
        const firebaseConfig = this.configService.get("FIREBASE_SERVICE_ACCOUNT");
        if (firebaseConfig) {
            try {
                const serviceAccount = JSON.parse(firebaseConfig);
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }
                this.firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("Firebase Admin initialized successfully");
            } catch (error) {
                console.error("Failed to parse Firebase Service Account:", error.message);
            }
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT not found in environment. Push notifications will be disabled.");
        }
    }

    async create(data: {
        userId?: string;
        patrolId?: string;
        citizenId?: string;
        title: string;
        message: string;
        type: NotificationType;
        data?: any;
        fcmToken?: string;
    }) {
        let fcmToken = data.fcmToken;

        // If no FCM token provided, try to fetch from DB
        if (!fcmToken) {
            const manager = this.notificationRepo.manager;
            try {
                if (data.userId) {
                    const user = await manager.getRepository("User").findOne({ where: { id: data.userId } }) as any;
                    fcmToken = user?.fcmToken;
                } else if (data.patrolId) {
                    const patrol = await manager.getRepository("Patrol").findOne({ where: { id: data.patrolId } }) as any;
                    fcmToken = patrol?.fcmToken;
                } else if (data.citizenId) {
                    const citizen = await manager.getRepository("Citizen").findOne({ where: { id: data.citizenId } }) as any;
                    fcmToken = citizen?.fcmToken;
                }
            } catch (err) {
                console.warn("Failed to fetch FCM token from DB:", err.message);
            }
        }

        const notification = this.notificationRepo.create({
            userId: data.userId,
            patrolId: data.patrolId,
            citizenId: data.citizenId,
            title: data.title,
            message: data.message,
            type: data.type,
            data: data.data,
        });

        const saved = await this.notificationRepo.save(notification);

        // Send Push Notification if FCM token is available
        if (this.firebaseApp && fcmToken) {
            try {
                await admin.messaging(this.firebaseApp).send({
                    token: fcmToken,
                    notification: {
                        title: data.title,
                        body: data.message,
                    },
                    data: {
                        notificationId: saved.id,
                        type: data.type,
                        ...(data.data ? Object.keys(data.data).reduce((acc, key) => {
                            acc[key] = String(data.data[key]);
                            return acc;
                        }, {}) : {}),
                    },
                });
            } catch (error) {
                console.error("FCM Send Error:", error.message);
            }
        }

        return saved;
    }

    async getUnreadCount(userId?: string, patrolId?: string, citizenId?: string) {
        const query = this.notificationRepo.createQueryBuilder("notification")
            .where("notification.isRead = :isRead", { isRead: false });

        if (userId) query.andWhere("notification.userId = :userId", { userId });
        if (patrolId) query.andWhere("notification.patrolId = :patrolId", { patrolId });
        if (citizenId) query.andWhere("notification.citizenId = :citizenId", { citizenId });

        return await query.getCount();
    }

    async getUserNotifications(userId?: string, patrolId?: string, citizenId?: string, limit = 20) {
        const where: any = {};
        if (userId) where.userId = userId;
        if (patrolId) where.patrolId = patrolId;
        if (citizenId) where.citizenId = citizenId;

        return await this.notificationRepo.find({
            where,
            order: { createdAt: "DESC" },
            take: limit,
        });
    }

    async markAsRead(id: string) {
        await this.notificationRepo.update(id, { isRead: true });
        return { success: true };
    }

    async markAllAsRead(userId?: string, patrolId?: string, citizenId?: string) {
        const where: any = { isRead: false };
        if (userId) where.userId = userId;
        if (patrolId) where.patrolId = patrolId;
        if (citizenId) where.citizenId = citizenId;

        await this.notificationRepo.update(where, { isRead: true });
        return { success: true };
    }

    /**
     * Send a targeted push notification to a single patrol or citizen by their ID.
     * Creates a DB record and sends FCM if a token is registered.
     */
    async sendPushToUser(data: {
        targetId: string;
        role: 'PATROL' | 'CITIZEN';
        title: string;
        message: string;
        type: NotificationType;
        extraData?: any;
    }) {
        const manager = this.notificationRepo.manager;
        let fcmToken: string | undefined;
        let notifPayload: any;

        if (data.role === 'PATROL') {
            const patrol = await manager.getRepository('Patrol').findOne({ where: { id: data.targetId } }) as any;
            if (!patrol) throw new Error(`Patrol ${data.targetId} not found`);
            fcmToken = patrol.fcmToken;
            notifPayload = { patrolId: data.targetId };
        } else {
            const citizen = await manager.getRepository('Citizen').findOne({ where: { id: data.targetId } }) as any;
            if (!citizen) throw new Error(`Citizen ${data.targetId} not found`);
            fcmToken = citizen.fcmToken;
            notifPayload = { citizenId: data.targetId };
        }

        const notification = this.notificationRepo.create({
            ...notifPayload,
            title: data.title,
            message: data.message,
            type: data.type,
            data: data.extraData,
        });
        const saved = await this.notificationRepo.save(notification) as unknown as import('./entities/notification.entity').Notification;


        if (this.firebaseApp && fcmToken) {
            try {
                await admin.messaging(this.firebaseApp).send({
                    token: fcmToken,
                    notification: { title: data.title, body: data.message },
                    data: {
                        notificationId: saved.id,
                        type: data.type,
                        ...(data.extraData
                            ? Object.keys(data.extraData).reduce((acc, k) => {
                                acc[k] = String(data.extraData[k]);
                                return acc;
                            }, {} as Record<string, string>)
                            : {}),
                    },
                });
                console.log(`FCM sent to ${data.role} ${data.targetId}`);
            } catch (err) {
                console.error('FCM send error:', err.message);
            }
        }

        return saved;
    }

    /**
     * Broadcast a push notification to ALL patrols or ALL citizens that have an FCM token.
     * Creates individual DB notification records for each recipient.
     */
    async broadcastToRole(data: {
        role: 'PATROL' | 'CITIZEN';
        title: string;
        message: string;
        type: NotificationType;
        extraData?: any;
    }) {
        const manager = this.notificationRepo.manager;
        const repoName = data.role === 'PATROL' ? 'Patrol' : 'Citizen';
        const idField = data.role === 'PATROL' ? 'patrolId' : 'citizenId';

        const recipients: any[] = await manager.getRepository(repoName).find();

        const results = await Promise.allSettled(
            recipients.map(async (recipient) => {
                const notification = this.notificationRepo.create({
                    [idField]: recipient.id,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    data: data.extraData,
                });
                const saved = await this.notificationRepo.save(notification);

                if (this.firebaseApp && recipient.fcmToken) {
                    await admin.messaging(this.firebaseApp).send({
                        token: recipient.fcmToken,
                        notification: { title: data.title, body: data.message },
                        data: {
                            notificationId: saved.id,
                            type: data.type,
                            ...(data.extraData
                                ? Object.keys(data.extraData).reduce((acc, k) => {
                                    acc[k] = String(data.extraData[k]);
                                    return acc;
                                }, {} as Record<string, string>)
                                : {}),
                        },
                    }).catch(err => console.error(`FCM error for ${recipient.id}:`, err.message));
                }

                return saved;
            }),
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        return { success: true, sent, failed, total: recipients.length };
    }
}
