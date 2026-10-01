import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";

import { SettingsClient } from "@/components/dashboard/SettingsClient";
import { rowToStoredApiKey } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajustes",
};

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const user = await currentUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  const apiKeys = error ? [] : (data ?? []).map(rowToStoredApiKey);

  return (
    <SettingsClient
      userFullName={user?.fullName ?? null}
      userEmail={user?.primaryEmailAddress?.emailAddress ?? null}
      initialApiKeys={apiKeys}
      loadError={error ? error.message : null}
    />
  );
}