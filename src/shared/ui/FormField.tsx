import type { UseFormRegisterReturn } from "react-hook-form";

type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  // 입력 전에 미리 보여 주는 규칙 안내. 오류가 있으면 오류 문구가 대신 보인다.
  hint?: string;
  readOnly?: boolean;
  // 읽기 전용 칸에 입력 수단을 붙일 때 쓴다 (예: 주소 칸을 눌러 주소 검색 팝업 열기).
  onClick?: () => void;
  registration: UseFormRegisterReturn;
};

export function FormField({
  label,
  type = "text",
  placeholder,
  error,
  hint,
  readOnly,
  onClick,
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
        onClick={onClick}
        className={`mt-1 h-11 w-full border border-border px-3 text-sm outline-none placeholder:text-muted focus:border-sage ${
          readOnly ? "bg-sand text-muted" : "bg-surface"
        } ${onClick ? "cursor-pointer" : ""}`}
      />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
      {!error && hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
