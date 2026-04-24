export function getPublicSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  return value;
}

export function getPublicSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return value;
}

export function getServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return value;
}

export function getBigModelApiKey() {
  const value = process.env.BIGMODEL_API_KEY;
  if (!value) {
    throw new Error('Missing BIGMODEL_API_KEY');
  }
  return value;
}

export function getBigModelApiUrl() {
  return process.env.BIGMODEL_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
}

export function getBigModelVisionModel() {
  return process.env.BIGMODEL_VISION_MODEL || 'glm-4.6v-flash';
}

export function getMiniMaxApiKey() {
  const value = process.env.MINIMAX_API_KEY;
  if (!value) {
    throw new Error('Missing MINIMAX_API_KEY');
  }
  return value;
}

export function getMiniMaxApiUrl() {
  return process.env.MINIMAX_API_URL || 'https://api.minimaxi.com/anthropic';
}

export function getMiniMaxModel() {
  return process.env.MINIMAX_MODEL || 'MiniMax-M2.7';
}

export function hasListingAiEnv() {
  return Boolean(process.env.BIGMODEL_API_KEY && process.env.MINIMAX_API_KEY);
}

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getAdminEmails() {
  return (process.env.RELAY_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function getSystemShowcaseUsername() {
  return process.env.SYSTEM_SHOWCASE_USERNAME?.trim() || 'SYSTEM';
}
