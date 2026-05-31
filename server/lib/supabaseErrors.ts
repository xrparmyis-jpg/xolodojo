type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function formatSupabaseError(error: SupabaseLikeError): string {
  const parts = [error.message, error.code, error.details, error.hint].filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  );
  return parts.length > 0 ? parts.join(' — ') : 'Supabase query failed';
}

export function throwIfSupabaseError(error: SupabaseLikeError | null): void {
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    return formatSupabaseError(error as SupabaseLikeError);
  }
  return String(error);
}
