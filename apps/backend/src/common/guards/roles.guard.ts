import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../enums/enums";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { errorResponse, ServiceResponse } from "../types/service-response";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      const request = context.switchToHttp().getRequest();

      if (!requiredRoles) {
        return true;
      }

      const user = request.user;

      // Super admins and system admins are always allowed
      if (
        user &&
        (user.role === UserRole.SYSTEM_SUPER_ADMIN ||
          user.role === UserRole.SYSTEM_ADMIN)
      ) {
        return true;
      }

      if (!user || !user.role) {
        throw new ForbiddenException("Access denied: User or role missing");
      }

      const userRoleStr = String(user.role).toUpperCase();
      const hasRole = requiredRoles.some(role => String(role).toUpperCase() === userRoleStr);

      if (!hasRole) {
        throw new ForbiddenException("Access denied: Insufficient permissions");
      }

      return true;
    } catch (error) {
      console.error("RolesGuard error:", error);

      if (error instanceof ForbiddenException) {
        throw error;
      }

      const response: ServiceResponse = errorResponse(
        "Unexpected error in RolesGuard",
        error,
        500,
      );
      throw Object.assign(new ForbiddenException(response.message), {
        response,
      });
    }
  }
}
