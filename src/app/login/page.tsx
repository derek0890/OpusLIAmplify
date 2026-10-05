import { LoginPageClient } from "@/components/login-form";

export default function LoginPage() {
  const ssoEnabled =
    !!process.env.SSO_ISSUER && !!process.env.SSO_CLIENT_ID && !!process.env.SSO_CLIENT_SECRET;
  const passwordEnabled = process.env.DISABLE_PASSWORD_LOGIN !== "true";

  return (
    <LoginPageClient
      ssoEnabled={ssoEnabled}
      ssoProviderName={process.env.SSO_PROVIDER_NAME ?? "Single Sign-On"}
      passwordEnabled={passwordEnabled}
    />
  );
}
