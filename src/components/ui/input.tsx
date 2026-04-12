import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-oro/70 focus:ring-1 focus:ring-oro/30 transition-colors ${
            error ? "border-red-400" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
