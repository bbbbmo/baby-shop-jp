"use client";

import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useIdentityProviders } from "./model/useIdentityProviders";
import { useChangePasswordForm } from "./model/useChangePasswordForm";
import { primarySocialProvider } from "./model/resetState";
import { providerLabel } from "./model/providerLabel";

// 마이페이지의 비밀번호 카드. 소셜 계정에는 비밀번호가 없으므로 입력란 대신
// 어디서 관리하는지 알려준다. 본인이 로그인한 화면이라 가입 경로를 밝혀도 된다.
export function ChangePasswordCard() {
  const { d } = useLocale();
  const { data: providers, isLoading } = useIdentityProviders();

  if (isLoading || !providers) {
    return null;
  }
  if (!providers.includes("email")) {
    return <SocialNotice provider={primarySocialProvider(providers)} />;
  }
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-medium text-foreground">{d.password.change.title}</h2>
      <ChangePasswordBody />
    </section>
  );
}

function SocialNotice({ provider }: { provider: string | null }) {
  const { d } = useLocale();
  const text = provider
    ? d.password.change.socialNotice.replaceAll("{provider}", providerLabel(d, provider))
    : d.password.change.socialNoticeGeneric;
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-2 text-sm font-medium text-foreground">{d.password.change.title}</h2>
      <p className="text-sm text-muted">{text}</p>
    </section>
  );
}

// 접힘/펼침은 바로 위 ProfileCard의 「정보 수정」과 같은 방식이다.
function ChangePasswordBody() {
  const { d } = useLocale();
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);
  const form = useChangePasswordForm(() => {
    setEditing(false);
    setDone(true);
  });

  if (!editing) {
    return (
      <div className="space-y-3">
        {done && <p className="text-sm text-muted">{d.password.change.done}</p>}
        <button
          type="button"
          onClick={() => openEditor(form.reset, setDone, setEditing)}
          className="w-full border border-border py-3 text-sm font-medium text-foreground hover:bg-sand"
        >
          {d.password.change.openButton}
        </button>
      </div>
    );
  }
  return <ChangePasswordFields form={form} onCancel={() => setEditing(false)} />;
}

// 다시 열 때 이전 입력과 "변경했어요" 안내가 남아 있으면 안 된다.
function openEditor(
  reset: () => void,
  setDone: (v: boolean) => void,
  setEditing: (v: boolean) => void,
): void {
  reset();
  setDone(false);
  setEditing(true);
}

function ChangePasswordFields({
  form,
  onCancel,
}: {
  form: ReturnType<typeof useChangePasswordForm>;
  onCancel: () => void;
}) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } = form;
  const errorText = (key: string | undefined) =>
    key
      ? (d.password.errors[key as keyof typeof d.password.errors] ?? d.password.errors.unknownError)
      : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={d.password.change.currentLabel}
        type="password"
        registration={register("currentPassword")}
        error={errorText(errors.currentPassword?.message)}
      />
      <FormField
        label={d.password.change.newLabel}
        type="password"
        registration={register("password")}
        error={errorText(errors.password?.message)}
      />
      <FormField
        label={d.password.change.confirmLabel}
        type="password"
        registration={register("passwordConfirm")}
        error={errorText(errors.passwordConfirm?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 border border-border py-3 text-sm font-medium text-foreground hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.password.change.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? d.password.change.submitting : d.password.change.submit}
        </button>
      </div>
    </form>
  );
}
