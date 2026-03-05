import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "senku-dev-secret",
});

export const config = {
  matcher: ["/dashboard/:path*", "/accounts/:path*", "/trades/:path*", "/stats/:path*", "/journal/:path*", "/calendar/:path*", "/settings/:path*", "/onboarding/:path*"],
};
