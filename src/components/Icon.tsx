const P: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  key: "M8 19a4 4 0 100-8 4 4 0 000 8zM11 12l9-9M16 7l3 3",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5",
  pay: "M3 6h18v12H3zM3 10h18M7 15h4",
  users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6M16 5a3.2 3.2 0 010 6M18 14c2.5.6 3.5 2.5 3.5 6",
  tool: "M14 6a4 4 0 005 5l-9 9-4-4 9-9z",
  pin: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  search: "M11 17a6 6 0 100-12 6 6 0 000 12zM16 16l5 5",
  hand: "M3 12l5-4 4 2 4-2 5 4-8 8zM8 8l4 5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 3.5l9.5 16.5h-19zM12 10v4.5M12 17.5v.01",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
};
export default function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof P; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={P[name]} /></svg>;
}
