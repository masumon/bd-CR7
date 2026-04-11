"use client";

import { useMemo } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodTypeAny } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type FieldType = "text" | "email" | "password" | "number" | "textarea" | "select" | "date";

export interface DynamicFormField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface DynamicFormProps<T extends FieldValues> {
  schema?: ZodTypeAny;
  fields: Array<DynamicFormField<T>>;
  defaultValues: DefaultValues<T>;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (values: T) => Promise<void> | void;
}

export function DynamicForm<T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  submitLabel = "Save",
  loading = false,
  onSubmit,
}: DynamicFormProps<T>) {
  const resolver = useMemo(() => (schema ? zodResolver(schema) : undefined), [schema]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({ defaultValues, resolver });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      {fields.map((field) => {
        const error = errors[field.name];
        const inputClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

        return (
          <div key={field.name} className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {field.label}
              {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
            </label>

            {field.type === "textarea" ? (
              <textarea
                {...register(field.name)}
                placeholder={field.placeholder}
                className={inputClass}
                rows={3}
              />
            ) : null}

            {field.type === "select" ? (
              <select {...register(field.name)} className={inputClass}>
                <option value="">Select</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

            {!field.type || ["text", "email", "password", "number", "date"].includes(field.type) ? (
              <input
                {...register(field.name)}
                type={field.type || "text"}
                placeholder={field.placeholder}
                className={inputClass}
              />
            ) : null}

            {error ? <p className="text-xs text-rose-500">{String(error.message || "Invalid value")}</p> : null}
          </div>
        );
      })}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
