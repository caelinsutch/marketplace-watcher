import { Navigation } from "@/components/navigation";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <>
      <Navigation />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Edit Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Update monitor settings for ID: {id}
            </p>
          </div>
          <div className="max-w-2xl">
            <p className="text-muted-foreground">Edit form coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
}
