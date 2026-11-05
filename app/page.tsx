import { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { SearchForm } from "@/components/search/SearchForm";
import {
  DEFAULT_SEARCH_FILTERS,
  parseFiltersFromSearchParams,
} from "@/lib/events/filters";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function HomeContent({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const hasUrlFilters = Object.keys(params).length > 0;
  const initialFilters = hasUrlFilters
    ? parseFiltersFromSearchParams(params)
    : DEFAULT_SEARCH_FILTERS;

  return (
    <SearchForm
      hasUrlFilters={hasUrlFilters}
      initialFilters={initialFilters}
    />
  );
}

function HomeLoading() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10 pt-12 sm:px-8 sm:pt-20">
      <section className="max-w-2xl" aria-busy="true">
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
        <Button className="mt-8" disabled type="button">
          Let&apos;s go
        </Button>
      </section>
    </main>
  );
}

export default function Home({ searchParams }: HomePageProps) {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}
