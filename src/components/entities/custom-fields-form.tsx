"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CustomFieldDef, CustomFieldValues } from "@/lib/db/schema";

interface CustomFieldsFormProps {
  fields: CustomFieldDef[];
  defaultValues?: CustomFieldValues;
}

export function CustomFieldsForm({
  fields,
  defaultValues = {},
}: CustomFieldsFormProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div
          key={field.key}
          className={
            field.type === "boolean"
              ? "flex items-center justify-between"
              : "space-y-1.5"
          }
        >
          <Label htmlFor={`cf-${field.key}`}>{field.label}</Label>
          {field.type === "text" && (
            <Input
              id={`cf-${field.key}`}
              name={`cf_${field.key}`}
              defaultValue={(defaultValues[field.key] as string) ?? ""}
            />
          )}
          {field.type === "number" && (
            <Input
              id={`cf-${field.key}`}
              name={`cf_${field.key}`}
              type="number"
              defaultValue={(defaultValues[field.key] as number) ?? ""}
            />
          )}
          {field.type === "boolean" && (
            <Switch
              id={`cf-${field.key}`}
              name={`cf_${field.key}`}
              defaultChecked={Boolean(defaultValues[field.key])}
            />
          )}
          {field.type === "url" && (
            <Input
              id={`cf-${field.key}`}
              name={`cf_${field.key}`}
              type="url"
              defaultValue={(defaultValues[field.key] as string) ?? ""}
            />
          )}
        </div>
      ))}
    </div>
  );
}
