"use client";

import { ArrowLeft, ArrowRight, Eye, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
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

const STORAGE_KEY = "local-eye:search-filters";
const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This weekend" },
] as const;
const TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "anytime", label: "Anytime" },
] as const;
const DISTANCE_OPTIONS = [10, 15, 25, 40] as const;
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

export function SearchForm({
  initialFilters,
  hasUrlFilters,
}: SearchFormProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (hasUrlFilters) return;
    const storedFilters = getStoredFilters();
    if (!storedFilters) return;

    const timer = window.setTimeout(() => setFilters(storedFilters), 0);
    return () => window.clearTimeout(timer);
  }, [hasUrlFilters]);

  function updateFilters(update: Partial<SearchFilters>) {
    setFilters((current) => ({ ...current, ...update }));
    setValidationMessage("");
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

    const params = filtersToSearchParams(parsed.data);
    startTransition(() => router.push(`/results?${params.toString()}`));
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <Link
            aria-label="Local Eye home"
            className="inline-flex items-center gap-2 text-slate-900"
            href="/"
          >
            <Eye
              aria-hidden="true"
              className="size-5 text-blue-700"
              strokeWidth={2.25}
            />
            <span className="text-base font-semibold tracking-tight">
              Local Eye
            </span>
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
            href="/saved"
          >
            Saved
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-10 pt-12 sm:px-8 sm:pt-20">
        {step === 0 ? (
          <section className="max-w-2xl">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Looking for something to do in Seacoast, Maine &amp; New Hampshire?
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Answer 3 questions and get local suggestions.
            </p>
            <Button className="mt-8" onClick={() => setStep(1)} type="button">
              Start
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </section>
        ) : (
          <>
            <div className="mb-9">
              <p className="text-sm font-medium text-blue-700">
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
                    className={`h-1.5 flex-1 rounded-full ${
                      number <= step ? "bg-blue-700" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <form
              className="min-h-[22rem]"
              onSubmit={step === 3 ? submitSearch : (event) => {
                event.preventDefault();
                goToNextStep();
              }}
            >
              {step === 1 && (
                <fieldset>
                  <legend className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Who&apos;s going?
                  </legend>
                  <label className="mt-7 block max-w-sm text-sm font-medium text-slate-700">
                    Child&apos;s age
                    <select
                      autoFocus
                      className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-blue-600 focus:outline-2 focus:outline-blue-600"
                      value={filters.childAge ?? ""}
                      onChange={(event) =>
                        updateFilters({
                          childAge:
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                        })
                      }
                    >
                      <option value="">Any age</option>
                      <option value="0">Under 1</option>
                      {Array.from({ length: 11 }, (_, index) => index + 1).map(
                        (age) => (
                          <option key={age} value={age}>
                            {age} {age === 1 ? "year" : "years"}
                          </option>
                        ),
                      )}
                      <option value="12">12+</option>
                    </select>
                  </label>
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
                        className="mt-2 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-blue-600 focus:outline-2 focus:outline-blue-600"
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
                          className="size-4 text-blue-700"
                        />
                        Starting town
                      </span>
                      <select
                        autoFocus
                        className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-blue-600 focus:outline-2 focus:outline-blue-600"
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
                          <option key={town.slug} value={town.slug}>
                            {town.name}, {town.state}
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
                    <summary className="min-h-11 w-fit cursor-pointer list-none rounded-lg py-2 text-sm font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 [&::-webkit-details-marker]:hidden">
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
                <p className="mt-5 text-sm font-medium text-red-700" role="alert">
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
