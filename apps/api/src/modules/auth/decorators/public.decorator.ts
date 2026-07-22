import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public()
 * ---------------------------------------------------------------------
 * Marks a route as publicly accessible, bypassing the global JWT guard.
 * Use on endpoints like login, register, course listing, etc.
 * ---------------------------------------------------------------------
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
