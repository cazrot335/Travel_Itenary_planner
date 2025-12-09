/**
 * verify is the application-wide JWT verification hook.
 * @param request The incoming request object.
 * @param env The handler environment object.
 *  **Note**: adds `jwt` property to `env` if verification is successful.
 * @returns true to allow request to continue.
 */
export declare const verify: any;
/**
 * authorize is the application-wide authorization hook.
 * @param request The incoming request object.
 * @param env The handler environment object with env.jwt set by verify.
 * @returns true if authorized, false otherwise.
 */
export declare const authorize: any;
//# sourceMappingURL=auth.d.ts.map