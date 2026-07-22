import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * @CurrentUser() user: AuthenticatedUser
 * ---------------------------------------------------------------------
 * Extracts the authenticated user object (attached by JwtStrategy)
 * directly into a controller method parameter, avoiding repetitive
 * `req.user` access in every handler.
 *
 * Usage:
 *   getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 *   getUserId(@CurrentUser('id') userId: string) { ... }
 * ---------------------------------------------------------------------
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    return data ? user?.[data] : user;
  },
);
