import { createClient } from "@/lib/supabase/server";

export default async function DebugAuthPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = user ? await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() : { data: null, error: null };

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Auth Debugger</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded bg-muted/50">
          <h2 className="font-bold mb-2">User Session</h2>
          {user ? (
            <pre className="whitespace-pre-wrap text-green-600 overflow-auto">
              ID: {user.id}
              Email: {user.email}
            </pre>
          ) : (
            <div className="text-red-500 font-bold">NO USER SESSION FOUND</div>
          )}
          {error && <div className="text-red-500 mt-2">Error: {error.message}</div>}
        </div>

        <div className="border p-4 rounded bg-muted/50">
          <h2 className="font-bold mb-2">Profile Data</h2>
          {profile ? (
            <pre className="whitespace-pre-wrap text-blue-600 overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <div className="text-orange-500">
              No Profile Found.
              {user && " (This is likely why role check fails)"}
            </div>
          )}
          {profileError && <div className="text-red-500 mt-2">Error: {profileError.message}</div>}
        </div>
      </div>
    </div>
  );
}
