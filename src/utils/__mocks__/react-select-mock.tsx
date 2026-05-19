import { vi } from 'vitest';

/**
 * Mock React Select to eliminate flaky test behavior from async dropdown interactions.
 * This provides reliable, fast testing by using a native HTML select instead.
 */

interface SelectOption {
  value: string;
  label: string;
}

interface MockReactSelectProps {
  onChange?: (option: SelectOption | undefined) => void;
  options?: SelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  value?: SelectOption | undefined;
  className?: string;
  id?: string;
  name?: string;
  'data-testid'?: string;
  [key: string]: unknown;
}

export const mockReactSelect = () => {
  vi.mock('react-select', () => ({
    default: ({ onChange, options, placeholder, isDisabled, value, ...props }: MockReactSelectProps) => (
      <select
        data-testid="mocked-react-select"
        disabled={isDisabled}
        value={value?.value || ''}
        onChange={(e) => {
          const selectedOption = options?.find((opt: { value: string }) => opt.value === e.target.value);
          onChange?.(selectedOption);
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options?.map((option: { value: string; label: string }) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  }));
};
