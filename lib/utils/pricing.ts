import type { Duration } from '@/types';

const PRICES: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '5': 5, '7': 7, '14': 14, '30': 30,
  '60': 60, '90': 90,
  '1h': 0.5,
  '3h': 0.75,
  'lifetime': 0,
};

export function getPrice(duration: Duration, count: number, maxDevices: number): number | false {
  const key = String(duration);
  if (!(key in PRICES)) return false;
  const pricePer = PRICES[key];
  const result = pricePer * count * maxDevices;
  return result;
}

export function deductSaldo(currentSaldo: number, amount: number): number | false {
  if (currentSaldo < amount) return false;
  return currentSaldo - amount;
}