import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "@auth/core/providers";
import type { Profile } from "@auth/core/types";
import { prisma } from "@/lib/prisma";

const INITIAL_ADMIN_EMAILS = (process.env.INITIAL_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ssoConfigured =
  !!process.env.SSO_ISSUER && !!process.env.SSO_CLIENT_ID && !!process.env.SSO_CLIENT_SECRET;
const passwordLoginEnabled = process.env.DISABLE_PASSWORD_LOGIN !== "true";

const providers: Provider[] = [];

if (passwordLoginEnabled) {
  providers.push(
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  );
}

if (ssoConfigured) {
  providers.push({
    id: "sso",
    name: process.env.SSO_PROVIDER_NAME ?? "Single Sign-On",
    type: "oidc",
    issuer: process.env.SSO_ISSUER,
    clientId: process.env.SSO_CLIENT_ID,
    clientSecret: process.env.SSO_CLIENT_SECRET,
    // Runs only when no existing Account link is found, i.e. first-ever
    // sign-in for this person — later logins reuse the stored User row
    // untouched, so role/active-status changes made in Admin → Team stick.
    profile(profile: Profile) {
      if (!profile.sub || !profile.email) {
        throw new Error("SSO provider did not return a subject id and email.");
      }
      const email = profile.email.toLowerCase();
      return {
        id: profile.sub,
        email,
        name: profile.name ?? email,
        role: INITIAL_ADMIN_EMAILS.includes(email) ? "ADMIN" : "EMPLOYEE",
        isActive: true,
      };
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    jwt: async ({ token, user }) => {
      const userId = (user?.id as string | undefined) ?? (token.id as string | undefined);
      if (!userId) return token;

      // Re-read on every request (not just at sign-in) so a role change or
      // deactivation made in Admin → Team takes effect on the user's very
      // next request, instead of waiting for their JWT to expire.
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      });
      if (!current || !current.isActive) return null;

      token.id = userId;
      token.role = current.role;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
      }
      return session;
    },
  },
});
