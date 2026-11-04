import { SearchForm } from "@/components/search/SearchForm";
import {
  DEFAULT_SEARCH_FILTERS,
  parseFiltersFromSearchParams,
} from "@/lib/events/filters";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomePageProps) {
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
