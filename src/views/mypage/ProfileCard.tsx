"use client";

import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { updateProfile } from "@/shared/api/supabase";
import {
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormField,
  type ProfileFormValues,
} from "./model/schema";

type ProfileCardProps = {
  email: string;
  name: string;
  furigana: string;
  phone: string;
};

export function ProfileCard({ email, name, furigana, phone }: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ProfileFormValues>({ name, furigana, phone });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startEditing = () => {
    setValues({ name, furigana, phone });
    setErrors({});
    setSubmitError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    const validationErrors = validateProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitError(null);
    setSaving(true);
    const { error } = await updateProfile(values);
    setSaving(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setEditing(false);
  };

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
      values={values}
      errors={errors}
      saving={saving}
      submitError={submitError}
      onChange={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
      onSave={handleSave}
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
  values,
  errors,
  saving,
  submitError,
  onChange,
  onSave,
  onCancel,
}: {
  values: ProfileFormValues;
  errors: ProfileFormErrors;
  saving: boolean;
  submitError: string | null;
  onChange: (field: ProfileFormField, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { d } = useLocale();
  const errorText = (key: string | undefined) =>
    key
      ? (d.signup.errors[key as keyof typeof d.signup.errors] ?? d.signup.errors.unknownError)
      : undefined;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label={d.mypage.nameLabel}
        value={values.name}
        placeholder={d.signup.namePlaceholder}
        error={errorText(errors.name)}
        onChange={(v) => onChange("name", v)}
      />
      <TextField
        label={d.mypage.furiganaLabel}
        value={values.furigana}
        placeholder={d.signup.furiganaPlaceholder}
        error={errorText(errors.furigana)}
        onChange={(v) => onChange("furigana", v)}
      />
      <TextField
        label={d.mypage.phoneLabel}
        type="tel"
        value={values.phone}
        placeholder={d.signup.phonePlaceholder}
        error={errorText(errors.phone)}
        onChange={(v) => onChange("phone", v)}
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

function TextField({
  label,
  type = "text",
  value,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-foreground">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-sage"
      />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}
