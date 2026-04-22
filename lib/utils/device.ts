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
  const charLen = chars.length;
  const maxByte = Math.floor(256 / charLen) * charLen;
  const randomValues = new Uint8Array(length * 2);
  crypto.getRandomValues(randomValues);
  let result = '';
  let byteIndex = 0;
  for (let i = 0; i < length; i++) {
    let byte: number;
    do {
      byte = randomValues[byteIndex++]!;
      if (byteIndex >= randomValues.length) {
        crypto.getRandomValues(randomValues);
        byteIndex = 0;
      }
    } while (byte >= maxByte);
    result += chars.charAt(byte % charLen);
  }
  return result;
}