import { PayOS } from '@payos/node';
import { env } from './env.config';

let payOSClient: PayOS | null = null;

if (env.payos.clientId && env.payos.apiKey && env.payos.checksumKey) {
  try {
    payOSClient = new PayOS({
      clientId: env.payos.clientId,
      apiKey: env.payos.apiKey,
      checksumKey: env.payos.checksumKey,
    });
    console.log('[PAYOS] PayOS initialized successfully');
  } catch (err) {
    console.error('[PAYOS] Failed to initialize PayOS:', err);
  }
} else {
  console.log('[PAYOS] PayOS credentials missing in .env. VietQR/Test QR mode enabled.');
}

export { payOSClient };
