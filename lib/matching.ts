import { createClient } from "@/lib/supabase/client";

export type MatchedErrand = {
  errand_id: string;
  requester_id: string;
  category: string;
  description: string;
  pickup_name: string;
  pickup_lat: number;
  pickup_lng: number;
  detour_km: number;
  requester_name: string;
  requester_avatar: string | null;
};

export async function matchErrands(routeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("match_errands", {
    route_id: routeId,
    radius_m: 5000
  });

  if (error) {
    throw error;
  }

  return (data || []) as MatchedErrand[];
}
