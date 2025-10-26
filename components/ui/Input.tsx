import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={clsx(
            "block text-sm font-medium mb-1",
            disabled ? "text-gray-500" : "text-gray-700"
          )}>
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg shadow-sm transition-colors',
            {
              'border-gray-300': !error && !disabled,
              'border-red-500': error,
              'bg-gray-100 text-gray-500 cursor-not-allowed': disabled,
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent': !disabled,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
