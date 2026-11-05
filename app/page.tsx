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
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
          Looking for something to do in Seacoast, Maine &amp; New Hampshire?
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Answer 3 questions and get local suggestions.
        </p>
        <Button className="mt-8" disabled type="button">
          Start
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
