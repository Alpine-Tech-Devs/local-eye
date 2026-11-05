import { useRef } from "react";
import type { KeyboardEvent } from "react";

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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % options.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + options.length) % options.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = options.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onChange(options[nextIndex].value);
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div aria-label={label} className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((option, index) => (
        <Chip
          aria-checked={value === option.value}
          key={option.value}
          onKeyDown={(event) => handleKeyDown(event, index)}
          ref={(element) => {
            optionRefs.current[index] = element;
          }}
          role="radio"
          selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
