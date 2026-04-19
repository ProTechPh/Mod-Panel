export function checkDeviceSlot(devices: string[], serial: string, maxDevices: number): { allowed: boolean; shouldAdd: boolean } {
  if (devices.includes(serial)) {
    return { allowed: true, shouldAdd: false };
  }
  if (devices.length < maxDevices) {
    return { allowed: true, shouldAdd: true };
  }
  return { allowed: false, shouldAdd: false };
}

export function generateKeyString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}