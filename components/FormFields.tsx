import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
};

const fieldClass = "focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal";

export function FormInput({ label, name, defaultValue, placeholder, required, type = "text" }: FieldProps & { type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={fieldClass} />
    </label>
  );
}

export function FormTextarea({ label, name, defaultValue, placeholder, required, rows = 4 }: FieldProps & { rows?: number }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea name={name} rows={rows} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="focus-ring rounded-2xl border border-slate-200 p-4 font-normal" />
    </label>
  );
}

export function FormSelect({
  label,
  name,
  defaultValue,
  required,
  children
}: FieldProps & { children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <select name={name} required={required} defaultValue={defaultValue ?? ""} className={fieldClass}>
        {children}
      </select>
    </label>
  );
}

export function SubmitButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button className={className ?? "rounded-2xl bg-teal-700 px-5 py-3 font-black text-white hover:bg-teal-800"}>
      {children}
    </button>
  );
}
