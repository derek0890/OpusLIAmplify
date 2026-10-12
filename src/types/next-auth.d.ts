import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EDITOR" | "EMPLOYEE";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "EDITOR" | "EMPLOYEE";
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EDITOR" | "EMPLOYEE";
  }
}
