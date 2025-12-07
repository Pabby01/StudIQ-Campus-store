import NextAuth from "next-auth";
import type { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { signinSchema } from "@/lib/validators";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) return null;
        // TODO: replace with real user lookup and password verification
        return { id: parsed.data.email, email: parsed.data.email } as User;
      },
    }),
  ],
});

export { handler as GET, handler as POST };
