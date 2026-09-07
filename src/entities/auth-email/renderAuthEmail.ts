import type { Locale } from "@/shared/i18n/types";

export type AuthEmailType = "signup" | "recovery" | "magiclink";

export type RenderAuthEmailParams = {
  type: string;
  locale: Locale;
  link: string;
};

export type RenderedEmail = { subject: string; html: string };

type Copy = { subject: string; title: string; body: string; button: string; ignore: string };

const COPY: Record<AuthEmailType, Record<Locale, Copy>> = {
  signup: {
    ja: {
      subject: "【COMO】メールアドレスの確認",
      title: "メールアドレスをご確認ください",
      body: "COMOへのご登録ありがとうございます。下のボタンを押して登録を完了してください。",
      button: "メールアドレスを確認する",
      ignore: "このメールに心当たりがない場合は、そのまま破棄してください。",
    },
    ko: {
      subject: "[COMO] 이메일 주소를 확인해 주세요",
      title: "이메일 주소를 확인해 주세요",
      body: "COMO에 가입해 주셔서 감사합니다. 아래 버튼을 눌러 가입을 완료해 주세요.",
      button: "이메일 확인하기",
      ignore: "본인이 요청한 것이 아니라면 이 메일은 무시하셔도 됩니다.",
    },
  },
  recovery: {
    ja: {
      subject: "【COMO】パスワードの再設定",
      title: "パスワードを再設定する",
      body: "下のボタンから新しいパスワードを設定してください。リンクの有効期限は短く設定されています。",
      button: "パスワードを再設定する",
      ignore: "このメールに心当たりがない場合は、そのまま破棄してください。パスワードは変更されません。",
    },
    ko: {
      subject: "[COMO] 비밀번호 재설정",
      title: "비밀번호를 재설정하세요",
      body: "아래 버튼을 눌러 새 비밀번호를 설정해 주세요. 링크는 짧은 시간만 유효합니다.",
      button: "비밀번호 재설정하기",
      ignore: "본인이 요청한 것이 아니라면 이 메일은 무시하셔도 됩니다. 비밀번호는 바뀌지 않습니다.",
    },
  },
  magiclink: {
    ja: {
      subject: "【COMO】ログインリンク",
      title: "ログインリンク",
      body: "下のボタンを押すとログインできます。",
      button: "ログインする",
      ignore: "このメールに心当たりがない場合は、そのまま破棄してください。",
    },
    ko: {
      subject: "[COMO] 로그인 링크",
      title: "로그인 링크",
      body: "아래 버튼을 누르면 로그인됩니다.",
      button: "로그인하기",
      ignore: "본인이 요청한 것이 아니라면 이 메일은 무시하셔도 됩니다.",
    },
  },
};

// 템플릿이 없는 액션(email_change 등)은 null — 호출부가 로그로 남긴다.
export function renderAuthEmail(params: RenderAuthEmailParams): RenderedEmail | null {
  if (!isAuthEmailType(params.type)) {
    return null;
  }
  const copy = COPY[params.type][params.locale];
  return { subject: copy.subject, html: layout(copy, escapeHtml(params.link)) };
}

function isAuthEmailType(value: string): value is AuthEmailType {
  return value === "signup" || value === "recovery" || value === "magiclink";
}

// 브랜드 톤을 따른다 — 화이트 베이스, 검정 버튼, 각진 모서리.
function layout(copy: Copy, link: string): string {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:-apple-system,'Hiragino Sans','Noto Sans JP','Apple SD Gothic Neo',sans-serif;color:#111111">
<div style="max-width:480px;margin:0 auto;padding:40px 24px">
<p style="margin:0 0 32px;font-size:24px;font-weight:700;letter-spacing:0.02em;text-align:center">COMO</p>
<h1 style="margin:0 0 16px;font-size:18px;font-weight:700">${copy.title}</h1>
<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#444444">${copy.body}</p>
<a href="${link}" style="display:block;background:#000000;color:#ffffff;text-decoration:none;text-align:center;padding:14px 16px;font-size:14px;font-weight:500">${copy.button}</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#888888">${copy.ignore}</p>
<p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#aaaaaa;word-break:break-all">${link}</p>
</div></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
