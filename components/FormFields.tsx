import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
};

const fieldClass = "focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40";

export function FormInput({ label, name, defaultValue, placeholder, required, type = "text" }: FieldProps & { type?: string }) {
  return (
    <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={fieldClass} />
    </label>
  );
}

export function FormTextarea({ label, name, defaultValue, placeholder, required, rows = 4 }: FieldProps & { rows?: number }) {
  return (
    <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
      {label}
      <textarea name={name} rows={rows} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="focus-ring rounded-2xl border border-slate-200/80 bg-white/90 p-4 font-normal text-slate-900 shadow-sm shadow-slate-200/40" />
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
    <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
      {label}
      <select name={name} required={required} defaultValue={defaultValue ?? ""} className={fieldClass}>
        {children}
      </select>
    </label>
  );
}

export function SubmitButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button className={className ?? "rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700"}>
      {children}
    </button>
  );
}
