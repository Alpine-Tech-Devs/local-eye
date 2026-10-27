import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .limit(1);

  if (error) {
    throw new Error("Unable to query Supabase events.", { cause: error });
  }

  console.info("Supabase events query succeeded.", { rowCount: events.length });

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-semibold">Local Eye</h1>
    </main>
  );
}
