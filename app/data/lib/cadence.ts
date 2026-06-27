export interface CadenceInput {
  hoursSinceChange: number;
  hoursSinceCheck: number;
}

export function intervalHoursFor(hoursSinceChange: number): number {
  if (hoursSinceChange < 48) return 0;
  if (hoursSinceChange < 168) return 24;
  return 72;
}

export function shouldRun(input: CadenceInput): boolean {
  return input.hoursSinceCheck >= intervalHoursFor(input.hoursSinceChange);
}
