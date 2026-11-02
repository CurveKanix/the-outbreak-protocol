import { supabase } from "./supabase";
import type { RoomSnapshot } from "./types";

export async function getSnapshot(code: string): Promise<RoomSnapshot> {
  const { data, error } = await supabase.rpc("public_room_snapshot", { p_code: code });
  if (error) throw error;
  return data as RoomSnapshot;
}
/** Postgres is source of truth; broadcast only prompts peers to refetch a compact snapshot. */
export function watchRoom(code: string, refresh: () => void) {
  const channel = supabase.channel(`room:${code}`, { config: { broadcast: { self: false }, presence: { key: crypto.randomUUID() } } });
  channel.on("broadcast", { event: "state_changed" }, refresh).on("presence", { event: "sync" }, refresh).subscribe();
  return () => { supabase.removeChannel(channel); };
}
export async function announce(code: string) { await supabase.channel(`room:${code}`).send({ type: "broadcast", event: "state_changed", payload: { at: Date.now() } }); }
