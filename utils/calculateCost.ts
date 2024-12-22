export function calculateCost(milliseconds: number, hourlyRate: number): number {
  const hours = milliseconds / (1000 * 60 * 60);
  return hours * hourlyRate;
}

