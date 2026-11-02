import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#0B0F19", panel: "#121A2A", cyan: "#36E6FF", emergency: "#FF385C" } } }, plugins: [] } satisfies Config;
