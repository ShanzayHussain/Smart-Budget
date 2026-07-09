export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}