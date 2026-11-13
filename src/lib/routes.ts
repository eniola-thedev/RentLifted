// The signed-in account area: no site menu in the header, no marketing footer.
export const ACCOUNT_ROUTES = ["/dashboard", "/tenant", "/landlord", "/kyc", "/admin", "/profile"];
// Sign-in screens: focused, so no marketing footer either.
export const AUTH_ROUTES = ["/login", "/signup", "/verify"];
export const inRoutes = (path: string, routes: string[]) => routes.some((p) => path === p || path.startsWith(p + "/"));
