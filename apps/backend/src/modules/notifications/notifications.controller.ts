import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";

import { NotificationsGateway } from "./notifications.gateway";
import { NotificationType, UserRole } from "../../common/enums/enums";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    @Get()
    @ApiOperation({ summary: "Get user notifications" })
    async getNotifications(@Request() req, @Query("limit") limit?: any) {
        const userId = req.user.id;
        const role = req.user.role;

        // Ensure limit is a valid number or undefined
        const parsedLimit = limit ? parseInt(String(limit), 10) : undefined;
        const finalLimit = isNaN(parsedLimit) ? 20 : parsedLimit;

        if (role === "PATROL") {
            return this.notificationsService.getUserNotifications(undefined, userId, undefined, finalLimit);
        } else if (role === "CITIZEN") {
            return this.notificationsService.getUserNotifications(undefined, undefined, userId, finalLimit);
        } else {
            return this.notificationsService.getUserNotifications(userId, undefined, undefined, finalLimit);
        }
    }

    @Get("unread-count")
    @ApiOperation({ summary: "Get unread notification count" })
    async getUnreadCount(@Request() req) {
        const userId = req.user.id;
        const role = req.user.role;

        let count = 0;
        if (role === "PATROL") {
            count = await this.notificationsService.getUnreadCount(undefined, userId);
        } else if (role === "CITIZEN") {
            count = await this.notificationsService.getUnreadCount(undefined, undefined, userId);
        } else {
            count = await this.notificationsService.getUnreadCount(userId);
        }
        return { count };
    }

    @Post(":id/mark-read")
    @ApiOperation({ summary: "Mark notification as read" })
    async markAsRead(@Param("id") id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Post("mark-all-read")
    @ApiOperation({ summary: "Mark all notifications as read" })
    async markAllAsRead(@Request() req) {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === "PATROL") {
            return this.notificationsService.markAllAsRead(undefined, userId);
        } else if (role === "CITIZEN") {
            return this.notificationsService.markAllAsRead(undefined, undefined, userId);
        } else {
            return this.notificationsService.markAllAsRead(userId);
        }
    }

    @Post("fcm-token")
    @ApiOperation({ summary: "Update FCM push token" })
    async updateFcmToken(@Request() req, @Body() body: { token?: string; fcmToken?: string }) {
        const userId = req.user.id;
        const role = req.user.role;
        const token = body.token || body.fcmToken;

        if (!token) {
            throw new Error("Token is required");
        }

        // This is a bit hacky, but we need to update the correct entity based on role
        const manager = this.notificationsService['notificationRepo'].manager;
        let repoName = "User";
        if (role === "PATROL") repoName = "Patrol";
        else if (role === "CITIZEN") repoName = "Citizen";

        await manager.getRepository(repoName).update(userId, { fcmToken: token });
        return { success: true };
    }

    @Get("test-notify")
    @ApiOperation({ summary: "Internal: trigger a test notification" })
    async triggerTestNotify(@Request() req) {
        const userId = req.user.id;
        const role = req.user.role;

        const payload = {
            title: "Test Alert",
            message: "Testing current notification functionality.",
            type: NotificationType.GENERAL,
            data: { test: true }
        };

        await this.notificationsGateway.notifyUser(userId, role, payload);

        return { success: true, message: "Test notification created and sent" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Admin: Send push to a specific patrol or citizen
    // ─────────────────────────────────────────────────────────────────────────

    @Post("send")
    @UseGuards(RolesGuard)
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.SYSTEM_SUPER_ADMIN)
    @ApiOperation({
        summary: "Send a push notification to a specific patrol or citizen (Admin only)",
        description: "Sends a DB-persisted notification + FCM push to a single user and emits it in real-time via socket.",
    })
    @ApiBody({
        schema: {
            type: "object",
            required: ["targetId", "role", "title", "message"],
            properties: {
                targetId: { type: "string", description: "ID of the patrol or citizen" },
                role: { type: "string", enum: ["PATROL", "CITIZEN"] },
                title: { type: "string" },
                message: { type: "string" },
                type: {
                    type: "string",
                    enum: Object.values(NotificationType),
                    default: NotificationType.GENERAL,
                },
                extraData: { type: "object", description: "Optional key-value pairs to attach to the notification" },
            },
        },
    })
    async sendToUser(
        @Body() body: {
            targetId: string;
            role: "PATROL" | "CITIZEN";
            title: string;
            message: string;
            type?: NotificationType;
            extraData?: Record<string, any>;
        },
    ) {
        const type = body.type || NotificationType.GENERAL;

        // Persist to DB + send FCM
        const notification = await this.notificationsService.sendPushToUser({
            targetId: body.targetId,
            role: body.role,
            title: body.title,
            message: body.message,
            type,
            extraData: body.extraData,
        });

        // Real-time socket delivery
        await this.notificationsGateway.notifyUser(body.targetId, body.role, {
            title: body.title,
            message: body.message,
            type,
            data: body.extraData,
        });

        return { success: true, notification };
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Admin: Broadcast push to ALL patrols or ALL citizens
    // ─────────────────────────────────────────────────────────────────────────

    @Post("broadcast")
    @UseGuards(RolesGuard)
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.SYSTEM_SUPER_ADMIN)
    @ApiOperation({
        summary: "Broadcast a notification to all patrols or all citizens (Admin only)",
        description: "Creates individual notification records for every recipient and sends FCM pushes. Also emits via socket to all connected users of the target role.",
    })
    @ApiBody({
        schema: {
            type: "object",
            required: ["role", "title", "message"],
            properties: {
                role: { type: "string", enum: ["PATROL", "CITIZEN"] },
                title: { type: "string" },
                message: { type: "string" },
                type: {
                    type: "string",
                    enum: Object.values(NotificationType),
                    default: NotificationType.GENERAL,
                },
                extraData: { type: "object" },
            },
        },
    })
    async broadcastToRole(
        @Body() body: {
            role: "PATROL" | "CITIZEN";
            title: string;
            message: string;
            type?: NotificationType;
            extraData?: Record<string, any>;
        },
    ) {
        const type = body.type || NotificationType.GENERAL;

        // Bulk FCM + DB records
        const result = await this.notificationsService.broadcastToRole({
            role: body.role,
            title: body.title,
            message: body.message,
            type,
            extraData: body.extraData,
        });

        // Real-time socket broadcast to the role room
        this.notificationsGateway.sendToRole(body.role, "notification", {
            title: body.title,
            message: body.message,
            type,
            data: body.extraData,
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        return { success: true, ...result };
    }
}

