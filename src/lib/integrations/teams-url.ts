export function teamsRedirectUri(): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/integrations/teams/callback`;
}
