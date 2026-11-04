import { Chip } from "./Chip";

export interface SegmentOption<Value extends string | number> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string | number> {
  label: string;
  value: Value;
  options: readonly SegmentOption<Value>[];
  onChange: (value: Value) => void;
}

export function SegmentedControl<Value extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div
      aria-label={label}
      className="flex flex-wrap gap-2"
      role="group"
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
