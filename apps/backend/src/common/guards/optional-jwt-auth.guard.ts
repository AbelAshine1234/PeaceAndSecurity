import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // Override handleRequest to not throw an error if no token is provided
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If there's an error or no user, just return null (allow anonymous access)
    // The user will be null in req.user, which the controller can handle
    return user || null;
  }

  // Override canActivate to always return true (allow the request to proceed)
  canActivate(context: ExecutionContext) {
    // Try to authenticate, but don't fail if it doesn't work
    return super.canActivate(context) as Promise<boolean> | boolean;
  }
}
