// NEXT_PUBLIC_ 접두사를 붙이면 이 목록이 브라우저 번들에 그대로 박혀
// 누구나 관리자 이메일을 알아낼 수 있다. 서버에서만 읽는다.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
