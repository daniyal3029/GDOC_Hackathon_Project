import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

interface FormInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInputField: React.FC<FormInputFieldProps> = ({ 
  label, 
  error,
  className = '', 
  ...props 
}) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
        {props.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={`input-field ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        {...props}
      />
      {error && <span className="text-xs text-destructive mt-1">{error}</span>}
    </div>
  );
};
