"use client";

import { useMemo, type ChangeEvent } from "react";
import {
  formatCompetencyLabel,
  formatCompetencyGroupLabel,
  groupCompetenciesByGradeTermCluster,
  type CompetencyLike,
} from "@/lib/eim-competency-map";

export type CompetencySelectItem = CompetencyLike & {
  id?: string;
  value?: string;
  label?: string;
  title?: string;
  competencyTitle?: string;
  topicTitle?: string;
  description?: string;
  cluster?: string;
};

type ExtraOption = { value: string; label: string };

export function CompetencySelect({
  name,
  label,
  competencies,
  defaultValue,
  required = false,
  includeEmpty = true,
  emptyLabel = "Select competency",
  className,
  value,
  onChange,
  extraOptions = [],
}: {
  name: string;
  label?: string;
  competencies: CompetencySelectItem[];
  defaultValue?: string;
  required?: boolean;
  includeEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  extraOptions?: ExtraOption[];
}) {
  const groupedCompetencies = useMemo(() => {
    const normalized = competencies.map((competency) => ({
      ...competency,
      id: competency.id || competency.value || competency.code || "",
      value: competency.value || competency.id || competency.code || "",
      label: competency.label || formatCompetencyLabel(competency),
      title: competency.title || competency.competencyTitle || competency.topicTitle || competency.description || "",
    }));

    return groupCompetenciesByGradeTermCluster(normalized as CompetencyLike[]);
  }, [competencies]);

  const selectValue = value ?? defaultValue ?? "";

  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <select
        name={name}
        className={className}
        required={required}
        value={value !== undefined ? selectValue : undefined}
        defaultValue={value === undefined ? selectValue : undefined}
        onChange={onChange}
      >
        {includeEmpty ? <option value="">{emptyLabel}</option> : null}
        {extraOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {groupedCompetencies.map((group) => {
          const groupLabel = group.gradeLevel != null || group.term != null
            ? formatCompetencyGroupLabel(group)
            : (group.cluster?.trim() || "Competencies");

          return (
            <optgroup key={`${group.gradeLevel ?? "legacy"}-${group.term ?? "legacy"}-${group.cluster}`} label={groupLabel}>
              {group.competencies.map((competency) => {
                const optionValue = competency.value || competency.id || competency.code || "";
                const optionLabel = competency.label || formatCompetencyLabel(competency);

                return (
                  <option key={optionValue || `${competency.code}-${competency.topicTitle}`} value={optionValue}>
                    {optionLabel}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}
