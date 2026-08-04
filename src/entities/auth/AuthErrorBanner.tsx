type AuthErrorBannerProps = { code: string; errors: Record<string, string> };

export function AuthErrorBanner({ code, errors }: AuthErrorBannerProps) {
  const message = errors[code] ?? errors.unknownError;
  return (
    <p className="mb-4 border border-border bg-sand px-4 py-3 text-sm text-foreground">
      {message}
    </p>
  );
}
