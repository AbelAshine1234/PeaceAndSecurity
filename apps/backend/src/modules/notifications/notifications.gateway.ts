import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { NotificationsService } from "./notifications.service";
import { NotificationType } from "../../common/enums/enums";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("authenticate")
  async handleAuthenticate(client: Socket, data: { userId: string; role: string }) {
    const { userId, role } = data;

    // Join rooms for targeted notifications
    await client.join(`user:${userId}`);
    await client.join(`role:${role}`);

    console.log(`User ${userId} authenticated and joined rooms: user:${userId}, role:${role}`);

    // Send initial unread count
    let count = 0;
    if (role === "PATROL") count = await this.notificationsService.getUnreadCount(undefined, userId);
    else if (role === "CITIZEN") count = await this.notificationsService.getUnreadCount(undefined, undefined, userId);
    else count = await this.notificationsService.getUnreadCount(userId);

    this.server.to(client.id).emit("unread_count", { count });

    return { status: "authenticated", count };
  }

  async notifyUser(userId: string, role: string, payload: {
    title: string;
    message: string;
    type: NotificationType;
    data?: any;
    fcmToken?: string;
  }) {
    // Save to DB and handle push notification
    const notification = await this.notificationsService.create({
      ...payload,
      userId: (role === "SYSTEM_ADMIN" || role === "SYSTEM_SUPER_ADMIN") ? userId : undefined,
      patrolId: role === "PATROL" ? userId : undefined,
      citizenId: role === "CITIZEN" ? userId : undefined,
    });

    // Get updated unread count
    const count = await this.notificationsService.getUnreadCount(
      (role === "SYSTEM_ADMIN" || role === "SYSTEM_SUPER_ADMIN") ? userId : undefined,
      role === "PATROL" ? userId : undefined,
      role === "CITIZEN" ? userId : undefined,
    );

    // Emit to user's room (reaches all devices for this user)
    this.server.to(`user:${userId}`).emit("notification", notification);
    this.server.to(`user:${userId}`).emit("unread_count", { count });
  }

  async sendToRole(role: string, event: string, data: any) {
    // Emit only to users in this role room
    this.server.to(`role:${role}`).emit(event, data);
    this.server.to(`role:${role}`).emit("notification", data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
