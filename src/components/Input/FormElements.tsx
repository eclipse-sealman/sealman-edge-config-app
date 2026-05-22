import { DetailedHTMLProps, OptionHTMLAttributes, SelectHTMLAttributes, HTMLProps, Ref, useRef, useEffect, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, disabled, ref, ...props }: InputProps & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      {...props}
      ref={ref}
      className={`${(disabled) ? "bg-slate-200" : "bg-slate-50"} rounded-sm focus:outline-border focus:ring-vibrant-blue ${className ? className : ""}`}
    />
  )
}

Input.displayName = 'Input';

export function IndeterminateCheckbox({ indeterminate, className = '', ...rest }: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!)

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
  }, [ref, indeterminate, rest.checked])

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  )
}

export function Select({ className, ...props }: DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>) {
  return (
    <select {...props} className={`bg-slate-50 rounded-sm focus:outline-border focus:ring-vibrant-blue pr-10 ${className}`}>
      {props.children}
    </select>
  )
}

export function Option({ ...props }: DetailedHTMLProps<OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>) {
  return (
    <option  {...props}>
      {props.children}
    </option>
  )
}