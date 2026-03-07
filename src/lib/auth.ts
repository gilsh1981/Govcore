import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";

function isPhone(value: string): boolean {
  return /^\d{8,15}$/.test(value.replace(/[\s\-().+]/g, ""));
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const id = credentials?.identifier?.trim();
        const pw = credentials?.password;
        console.log("[auth] authorize called with identifier:", JSON.stringify(id));
        if (!id || !pw) {
          console.log("[auth] missing identifier or password");
          return null;
        }

        // Normalize phone: strip non-digits
        const normalized = id.replace(/[\s\-().+]/g, "");

        let user;
        if (isEmail(id)) {
          console.log("[auth] detected email, looking up:", id);
          user = await db.user.findFirst({
            where: { email: id },
            select: { id: true, email: true, phone: true, name: true, orgId: true, role: true },
          });
        } else if (isPhone(id)) {
          console.log("[auth] detected phone, looking up:", normalized);
          user = await db.user.findFirst({
            where: { phone: normalized },
            select: { id: true, email: true, phone: true, name: true, orgId: true, role: true },
          });
        } else {
          console.log("[auth] identifier is neither email nor phone");
          return null;
        }

        console.log("[auth] user found:", user ? JSON.stringify({ id: user.id, email: user.email }) : "null");
        if (!user) return null;

        // Temporary password gate until proper hashing is added
        const pwMatch = pw === "admin123";
        console.log("[auth] password match:", pwMatch);
        if (!pwMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          orgId: user.orgId,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.orgId = u.orgId;
        token.role = u.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.orgId = token.orgId;
      session.user.role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
