"use client";

import { ArrowLeft, ArrowRight, Map, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SavedLink } from "@/components/SavedLink";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { TOWNS } from "@/lib/geo/towns";
import {
  BUDGET_OPTIONS,
  ENVIRONMENT_OPTIONS,
  filtersToSearchParams,
  SearchFiltersSchema,
  type Budget,
  type DateFilter,
  type Environment,
  type SearchFilters,
  type TimeOfDay,
} from "@/lib/events/filters";

const STORAGE_KEY = "little-plans:search-filters";
const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "next3days", label: "Next 3 days" },
  { value: "next5days", label: "Next 5 days" },
  { value: "weekend", label: "This weekend" },
] as const;
const TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "anytime", label: "Anytime" },
] as const;
const DISTANCE_OPTIONS = [10, 15, 25, 40] as const;
const CHILD_AGE_OPTIONS = [
  { value: "", label: "Any age" },
  { value: "0", label: "Under 1" },
  ...Array.from({ length: 11 }, (_, index) => index + 1).map((age) => ({
    value: String(age),
    label: `${age} ${age === 1 ? "year" : "years"}`,
  })),
  { value: "12", label: "12+" },
];
const BUDGET_LABELS: Record<Budget, string> = {
  free: "Free",
  under10: "Under $10",
  under20: "Under $20",
  any: "Any budget",
};
const ENVIRONMENT_LABELS: Record<Environment, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  either: "Either",
};

interface SearchFormProps {
  initialFilters: SearchFilters;
  hasUrlFilters: boolean;
}

function todayAsIsoDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getChildAgeSelections(childAges: number[]): Array<number | ""> {
  return childAges.length > 0 ? childAges : [""];
}

function getStoredFilters(): SearchFilters | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    const result = SearchFiltersSchema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn("Ignoring invalid saved search filters.");
  } catch (error) {
    console.warn("Could not read saved search filters.", error);
  }
  return null;
}

export function SearchForm({ initialFilters, hasUrlFilters }: SearchFormProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [childAgeSelections, setChildAgeSelections] = useState<
    Array<number | "">
  >(() => getChildAgeSelections(initialFilters.childAges));
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (hasUrlFilters) return;
    const storedFilters = getStoredFilters();
    if (!storedFilters) return;

    const timer = window.setTimeout(() => {
      setFilters(storedFilters);
      setChildAgeSelections(getChildAgeSelections(storedFilters.childAges));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasUrlFilters]);

  function updateFilters(update: Partial<SearchFilters>) {
    setFilters((current) => ({ ...current, ...update }));
    setValidationMessage("");
  }

  function updateChildAge(index: number, value: number | "") {
    const nextSelections = childAgeSelections.map((age, currentIndex) =>
      currentIndex === index ? value : age,
    );
    setChildAgeSelections(nextSelections);
    updateFilters({
      childAges: nextSelections.filter((age): age is number => age !== ""),
    });
  }

  function addChildAge() {
    setChildAgeSelections((current) => [...current, ""]);
    setValidationMessage("");
  }

  function removeChildAge(index: number) {
    const nextSelections = childAgeSelections.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    const selections: Array<number | ""> =
      nextSelections.length > 0 ? nextSelections : [""];
    setChildAgeSelections(selections);
    updateFilters({
      childAges: selections.filter((age): age is number => age !== ""),
    });
  }

  function selectDate(preset: DateFilter["preset"]) {
    if (preset === "custom") {
      updateFilters({ date: { preset, date: todayAsIsoDate() } });
    } else {
      updateFilters({ date: { preset } });
    }
  }

  function goToNextStep() {
    if (step === 2 && filters.date.preset === "custom" && !filters.date.date) {
      setValidationMessage("Choose a date to continue.");
      return;
    }
    setValidationMessage("");
    setStep((current) => Math.min(current + 1, 3));
  }

  function goHome() {
    setValidationMessage("");
    setStep(0);
    window.scrollTo({ top: 0 });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = SearchFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      setValidationMessage(
        "Check your selections and choose a valid date before searching.",
      );
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
    } catch (error) {
      console.warn("Could not save search filters for next time.", error);
    }

    trackAnalyticsEvent("search", {
      filters: {
        ...parsed.data,
        origin:
          typeof parsed.data.origin === "string"
            ? parsed.data.origin
            : "custom",
      },
    });

    const params = filtersToSearchParams(parsed.data);
    startTransition(() => router.push(`/results?${params.toString()}`));
  }

  return (
    <div className="flex-1 text-slate-900">
      <header className="border-b border-orange-100/80 bg-white/70 backdrop-blur">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <Link
            aria-label="Little Plans Around Here home"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-slate-900 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            href="/"
            onClick={goHome}
          >
            <span
              aria-hidden="true"
              className="bg-brand inline-flex size-7 items-center justify-center rounded-lg text-white shadow-sm shadow-orange-200"
            >
              <Map className="size-4" strokeWidth={2.25} />
            </span>
            <span className="text-brand text-base font-bold tracking-tight">
              Little Plans Around Here
            </span>
          </Link>
          <SavedLink />
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-10 pt-12 sm:px-8 sm:pt-20">
        {step === 0 ? (
          <section className="max-w-2xl">
            <p className="text-brand text-sm font-bold uppercase tracking-wide">
              Seacoast Maine &amp; New Hampshire
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Big fun, close to home.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Find family-friendly things to do around here. Answer 3 quick
              questions and we&apos;ll do the rest.
            </p>
            <Button className="mt-8" onClick={() => setStep(1)} type="button">
              Let&apos;s go
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </section>
        ) : (
          <>
            <div className="mb-9">
              <p
                aria-atomic="true"
                aria-live="polite"
                className="text-sm font-semibold text-orange-700"
              >
                Question {step} of 3
              </p>
              <div
                aria-label={`Question ${step} of 3`}
                className="mt-3 flex max-w-xs gap-2"
                role="img"
              >
                {[1, 2, 3].map((number) => (
                  <span
                    key={number}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      number <= step ? "bg-brand" : "bg-orange-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <form
              className="min-h-[22rem]"
              onSubmit={
                step === 3
                  ? submitSearch
                  : (event) => {
                      event.preventDefault();
                      goToNextStep();
                    }
              }
            >
              {step === 1 && (
                <fieldset>
                  <legend className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Who&apos;s going?
                  </legend>
                  <p className="mt-3 text-sm text-slate-600">
                    We&apos;ll show events suitable for at least one selected
                    age. Leave an age as Any age to ignore it.
                  </p>
                  <div className="mt-6 max-w-sm space-y-4">
                    {childAgeSelections.map((age, index) => (
                      <div
                        className="rounded-xl border border-slate-200 bg-white p-4"
                        key={index}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">
                            Child {index + 1}
                          </span>
                          {childAgeSelections.length > 1 && (
                            <button
                              aria-label={`Remove child ${index + 1}`}
                              className="min-h-10 rounded-md px-2 text-sm font-medium text-orange-700 underline decoration-orange-200 underline-offset-2 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-500"
                              onClick={() => removeChildAge(index)}
                              type="button"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <label className="block text-sm font-medium text-slate-700">
                          Age
                          <select
                            autoFocus={index === 0}
                            className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-orange-500 focus:outline-2 focus:outline-orange-500"
                            value={age}
                            onChange={(event) =>
                              updateChildAge(
                                index,
                                event.target.value === ""
                                  ? ""
                                  : Number(event.target.value),
                              )
                            }
                          >
                            {CHILD_AGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-200 px-4 text-sm font-semibold text-orange-800 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500"
                      onClick={addChildAge}
                      type="button"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Add another child
                    </button>
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    When works for you?
                  </legend>
                  <p className="mb-3 mt-7 text-sm font-medium text-slate-700">
                    Choose a day
                  </p>
                  <SegmentedControl
                    label="Date"
                    value={
                      filters.date.preset === "custom"
                        ? "custom"
                        : filters.date.preset
                    }
                    options={[
                      ...DATE_OPTIONS,
                      { value: "custom", label: "Pick a date" },
                    ]}
                    onChange={selectDate}
                  />
                  {filters.date.preset === "custom" && (
                    <label className="mt-5 block max-w-sm text-sm font-medium text-slate-700">
                      Choose date
                      <input
                        className="mt-2 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-orange-500 focus:outline-2 focus:outline-orange-500"
                        type="date"
                        value={filters.date.date}
                        onChange={(event) =>
                          updateFilters({
                            date: {
                              preset: "custom",
                              date: event.target.value,
                            },
                          })
                        }
                        required
                      />
                    </label>
                  )}
                  <div className="mt-7">
                    <p className="mb-3 text-sm font-medium text-slate-700">
                      What time of day?
                    </p>
                    <SegmentedControl<TimeOfDay>
                      label="Time of day"
                      value={filters.timeOfDay}
                      options={TIME_OPTIONS}
                      onChange={(timeOfDay) => updateFilters({ timeOfDay })}
                    />
                  </div>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset>
                  <legend className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Where should we look?
                  </legend>
                  <div className="mt-7 grid gap-6 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      <span className="mb-2 flex items-center gap-2">
                        <MapPin
                          aria-hidden="true"
                          className="size-4 text-orange-500"
                        />
                        Starting town
                      </span>
                      <select
                        autoFocus
                        className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-orange-500 focus:outline-2 focus:outline-orange-500"
                        value={
                          typeof filters.origin === "string"
                            ? filters.origin
                            : ""
                        }
                        onChange={(event) =>
                          updateFilters({ origin: event.target.value })
                        }
                      >
                        {TOWNS.map((town) => (
                          <option
                            key={town.slug}
                            value={town.slug}
                            disabled={!town.isAvailable}
                          >
                            {town.name}, {town.state}
                            {!town.isAvailable && " — Coming soon"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">
                        How far are you willing to go?
                      </p>
                      <SegmentedControl
                        label="Maximum distance"
                        value={filters.maxDistanceMiles}
                        options={DISTANCE_OPTIONS.map((miles) => ({
                          value: miles,
                          label: `${miles} mi`,
                        }))}
                        onChange={(maxDistanceMiles) =>
                          updateFilters({ maxDistanceMiles })
                        }
                      />
                    </div>
                  </div>

                  <details className="group mt-8">
                    <summary className="min-h-11 w-fit cursor-pointer list-none rounded-lg py-2 text-sm font-medium text-orange-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 [&::-webkit-details-marker]:hidden">
                      More options
                      <span className="ml-2 inline-block transition-transform group-open:rotate-180">
                        ▾
                      </span>
                    </summary>
                    <div className="mt-5 grid gap-6 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 sm:p-5">
                      <div>
                        <p className="mb-3 text-sm font-medium text-slate-700">
                          Budget
                        </p>
                        <SegmentedControl<Budget>
                          label="Budget"
                          value={filters.budget}
                          options={BUDGET_OPTIONS.map((value) => ({
                            value,
                            label: BUDGET_LABELS[value],
                          }))}
                          onChange={(budget) => updateFilters({ budget })}
                        />
                      </div>
                      <div>
                        <p className="mb-3 text-sm font-medium text-slate-700">
                          Indoor or outdoor?
                        </p>
                        <SegmentedControl<Environment>
                          label="Indoor or outdoor"
                          value={filters.environment}
                          options={ENVIRONMENT_OPTIONS.map((value) => ({
                            value,
                            label: ENVIRONMENT_LABELS[value],
                          }))}
                          onChange={(environment) =>
                            updateFilters({ environment })
                          }
                        />
                      </div>
                    </div>
                  </details>
                </fieldset>
              )}

              {validationMessage && (
                <p
                  className="mt-5 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {validationMessage}
                </p>
              )}

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
                <Button
                  className="px-4"
                  onClick={() => {
                    setValidationMessage("");
                    setStep((current) => Math.max(current - 1, 0));
                  }}
                  type="button"
                  variant="secondary"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back
                </Button>
                {step < 3 ? (
                  <Button type="submit">
                    Next
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                ) : (
                  <Button disabled={isPending} type="submit">
                    <Search aria-hidden="true" className="size-4" />
                    {isPending ? "Finding suggestions…" : "Show suggestions"}
                  </Button>
                )}
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
