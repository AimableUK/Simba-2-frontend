"use client";

import { type UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children?: ReactNode;
  className?: string;
}

// Wrapper with label + error display
export function FormField({
  label,
  error,
  required,
  optional,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
          {optional && (
            <span className="text-muted-foreground font-normal text-xs ml-1">
              (optional)
            </span>
          )}
        </label>
      </div>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Styled input that turns red border on error
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  registration?: UseFormRegisterReturn;
}

export function FormInput({
  error,
  registration,
  className,
  ...props
}: FormInputProps) {
  return (
    <input
      {...registration}
      {...props}
      className={cn(
        "w-full px-4 py-3 rounded-xl border bg-background text-sm transition-all placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2",
        error
          ? "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
          : "border-border focus:border-primary focus:ring-primary/20",
        className,
      )}
    />
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  registration?: UseFormRegisterReturn;
}

export function FormTextarea({
  error,
  registration,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <textarea
      {...registration}
      {...props}
      className={cn(
        "w-full px-4 py-3 rounded-xl border bg-background text-sm transition-all placeholder:text-muted-foreground/60 resize-none",
        "focus:outline-none focus:ring-2",
        error
          ? "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
          : "border-border focus:border-primary focus:ring-primary/20",
        className,
      )}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  registration?: UseFormRegisterReturn;
}

export function FormSelect({
  error,
  registration,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <select
      {...registration}
      {...props}
      className={cn(
        "w-full px-4 py-3 rounded-xl border bg-background text-sm transition-all",
        "focus:outline-none focus:ring-2",
        error
          ? "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
          : "border-border focus:border-primary focus:ring-primary/20",
        className,
      )}
    >
      {children}
    </select>
  );
}
