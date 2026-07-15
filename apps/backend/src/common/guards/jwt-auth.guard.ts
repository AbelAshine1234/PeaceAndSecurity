import {
  Injectable,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import {
  errorResponse,
  ServiceResponse,
} from "../../common/types/service-response";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      try {
        await super.canActivate(context);
      } catch (err) {
        // Silently fail for public routes - request continues without user
      }
      return true;
    }

    const result = await super.canActivate(context);
    return result as boolean;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return user || null;
    }

    const request = context.switchToHttp().getRequest();

    // Log authentication errors for debugging
    if (err || !user) {
      console.error("JWT Authentication Failed:", {
        error: err?.message || "No error",
        info: info?.message || "No info",
        user: user ? "User exists" : "No user",
        request: {
          url: request.url,
          method: request.method,
          headers: {
            authorization: request.headers.authorization
              ? "Present"
              : "Missing",
          },
        },
      });

      // Throw UnauthorizedException but attach ServiceResponse format
      const response: ServiceResponse = errorResponse(
        "Authentication failed",
        err || info?.message || "Unauthorized",
        401,
      );

      throw Object.assign(new UnauthorizedException(response.message), {
        response,
      });
    }

    return user;
  }
}
