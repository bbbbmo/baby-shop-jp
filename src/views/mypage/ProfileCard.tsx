"use client";

import { useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { updateProfile } from "@/shared/api/supabase";
import { FormField } from "@/shared/ui/FormField";
import { profileSchema, type ProfileFormValues } from "./model/schema";

type ProfileCardProps = {
  email: string;
  name: string;
  furigana: string;
  phone: string;
};

export function ProfileCard({ email, name, furigana, phone }: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, furigana, phone },
  });

  const startEditing = () => {
    reset({ name, furigana, phone });
    setSubmitError(null);
    setEditing(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await updateProfile(values);
    if (error) {
      setSubmitError(error);
      return;
    }
    setEditing(false);
  });

  if (!editing) {
    return (
      <ProfileView
        email={email}
        name={name}
        furigana={furigana}
        phone={phone}
        onEdit={startEditing}
      />
    );
  }

  return (
    <ProfileEditForm
      register={register}
      errors={errors}
      saving={isSubmitting}
      submitError={submitError}
      onSubmit={onSubmit}
      onCancel={() => setEditing(false)}
    />
  );
}

function ProfileView({
  email,
  name,
  furigana,
  phone,
  onEdit,
}: {
  email: string;
  name: string;
  furigana: string;
  phone: string;
  onEdit: () => void;
}) {
  const { d } = useLocale();
  return (
    <div className="space-y-4">
      <Field label={d.mypage.emailLabel} value={email} />
      <Field label={d.mypage.nameLabel} value={name} />
      <Field label={d.mypage.furiganaLabel} value={furigana} />
      <Field label={d.mypage.phoneLabel} value={phone} />
      <button
        type="button"
        onClick={onEdit}
        className="w-full border border-border py-3 text-sm font-medium text-foreground hover:bg-sand"
      >
        {d.mypage.editButton}
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-foreground">
      <span className="text-muted">{label}</span>
      <br />
      {value || "—"}
    </p>
  );
}

function ProfileEditForm({
  register,
  errors,
  saving,
  submitError,
  onSubmit,
  onCancel,
}: {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  saving: boolean;
  submitError: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
}) {
  const { d } = useLocale();
  const errorText = (key: string | undefined) =>
    key
      ? (d.signup.errors[key as keyof typeof d.signup.errors] ?? d.signup.errors.unknownError)
      : undefined;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        label={d.mypage.nameLabel}
        placeholder={d.signup.namePlaceholder}
        registration={register("name")}
        error={errorText(errors.name?.message)}
      />
      <FormField
        label={d.mypage.furiganaLabel}
        placeholder={d.signup.furiganaPlaceholder}
        registration={register("furigana")}
        error={errorText(errors.furigana?.message)}
      />
      <FormField
        label={d.mypage.phoneLabel}
        type="tel"
        placeholder={d.signup.phonePlaceholder}
        registration={register("phone")}
        error={errorText(errors.phone?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 border border-border py-3 text-sm font-medium text-foreground hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.mypage.cancelButton}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.mypage.saveButton}
        </button>
      </div>
    </form>
  );
}
