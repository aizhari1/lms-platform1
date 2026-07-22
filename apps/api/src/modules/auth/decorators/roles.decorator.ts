import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles(Role.ADMIN, Role.TEACHER)
 * ---------------------------------------------------------------------
 * Attaches allowed roles metadata to a route handler or controller.
 * Read by RolesGuard to enforce RBAC (Role-Based Access Control).
 * ---------------------------------------------------------------------
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
