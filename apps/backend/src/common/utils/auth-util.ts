export function extractBearer(authHeader?: string): string {
  if (!authHeader) return "";
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return "";
  console.log("token value", value);
  return value.trim();
}
