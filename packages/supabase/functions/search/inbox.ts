/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.42.7";
import type { Database } from "../../types";

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const { search, limit = 10 } = await req.json();

  if (!search) {
    return new Response("Please provide a search param!");
  }

  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  });

  // TODO: Support different multiple table searches
  // so we can have one search for all embeddings (inbox, transactions, documents)
  const { data: result, error } = await supabase
    .rpc("query_inbox_embeddings", {
      embedding: JSON.stringify(embedding),
      match_threshold: 0.8,
    })
    .select("*")
    .limit(limit);

  if (error) {
    return Response.json(error);
  }

  return Response.json({ search, result });
});