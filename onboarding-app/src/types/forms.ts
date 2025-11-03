export type FieldBase = {
  key: string;
  label: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
};

export type TextField = FieldBase & {
  type: "text" | "email" | "url" | "number";
};

export type TextAreaField = FieldBase & {
  type: "textarea";
  rows?: number;
};

export type SelectField = FieldBase & {
  type: "select" | "radio";
  options: string[];
};

export type MultiSelectField = FieldBase & {
  type: "multiselect" | "checkbox-group";
  options: string[];
};

export type CheckboxField = FieldBase & {
  type: "checkbox";
};

export type FormField =
  | TextField
  | TextAreaField
  | SelectField
  | MultiSelectField
  | CheckboxField;

export type FormSection = {
  key: string;
  title: string;
  subtitle?: string;
  description?: string;
  fields: FormField[];
  serviceKeys?: string[];
  alwaysVisible?: boolean;
};
