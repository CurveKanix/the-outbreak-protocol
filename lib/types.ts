export type Phase = "lobby" | "night" | "discussion" | "voting" | "summary" | "game_over";
export type Role = "virologist" | "surgeon" | "infected" | "researcher" | "resident";
export type Player = { id: string; display_name: string; seat: number; is_alive: boolean; has_acted: boolean; has_voted: boolean; role?: Role };
export type Room = { id: string; code: string; phase: Phase; phase_ends_at: string | null; day_number: number; morning_log: string[] };
export type RoomSnapshot = { room: Room; players: Player[] };
