import type { UseFormRegisterReturn } from "react-hook-form";

type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  readOnly?: boolean;
  registration: UseFormRegisterReturn;
};

export function FormField({
  label,
  type = "text",
  placeholder,
  error,
  readOnly,
  registration,
}: FormFieldProps) {
  return (
    <label className="block text-sm text-foreground">
      {label}
      <input
        type={type}
        placeholder={placeholder}
        readOnly={readOnly}
        {...registration}
        className={`mt-1 h-11 w-full border border-border px-3 text-sm outline-none placeholder:text-muted focus:border-sage ${
          readOnly ? "bg-sand text-muted" : "bg-surface"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}
