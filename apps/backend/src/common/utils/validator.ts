export function normalizeEmail(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  return v ? v.toLowerCase() : null;
}

export function normalizeEtPhone(input?: string): string | null {
  if (!input) return null;
  // Remove all spaces, dashes, parentheses, and handle 'o'/'O' as '0' typo
  let s = String(input).replace(/[\s\-()]/g, "").replace(/[oO]/g, "0");

  // If it starts with '+', remove it for normalization logic
  if (s.startsWith("+")) {
    s = s.substring(1);
  }

  // Check if it matches Ethiopian mobile patterns
  // 911... -> 251911...
  // 0911... -> 251911...
  // 251911... -> 251911...

  if (/^(9\d{8}|7\d{8})$/.test(s)) {
    return `+251${s}`;
  }
  if (/^0(9\d{8}|7\d{8})$/.test(s)) {
    return `+251${s.substring(1)}`;
  }
  if (/^251(9\d{8}|7\d{8})$/.test(s)) {
    return `+${s}`;
  }

  // If it doesn't match specific Ethiopian format but looks like a phone number, return as is with +
  if (/^\d{8,15}$/.test(s)) {
    return `+${s}`;
  }

  console.log(
    `Validator: normalizeEtPhone returned null for input: ${input}, processed: ${s}`,
  );
  return null;
}

export function getExpiryTime(minutes = 5): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}
