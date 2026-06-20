import { BinaryLike, createHmac } from 'crypto';

export function validateTelegramInitData(rawInitData, botToken) {
  try {
    const params = new URLSearchParams(rawInitData);
    const receivedHash = params.get('hash');
    
    if (!receivedHash) return false;

    // Remove hash and sort keys alphabetically
    params.delete('hash');
    params.sort();

    // Construct the data-check-string (values must be decoded)
    const dataCheckString = [...params.entries()]
      .map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
      .join('\n');

    // Generate secret key using the bot token and constant string
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate signature hash
    const calculatedHash = createHmac('sha256', secretKey as BinaryLike)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === receivedHash;
  } catch (error) {
    return false;
  }
}
