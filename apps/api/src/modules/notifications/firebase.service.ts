import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.app = admin.apps[0] as admin.app.App;
      return;
    }

    const privateKey = this.config
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!privateKey) {
      this.logger.warn(
        'FIREBASE_PRIVATE_KEY not set — push notifications are disabled',
      );
      return;
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.config.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey,
      }),
    });

    this.logger.log('✅ Firebase Admin initialized');
  }

  /**
   * Sends a push notification to one or more device tokens.
   * Silently skips (logs a warning) if Firebase wasn't initialized,
   * so local development without FCM credentials doesn't crash the app.
   */
  async sendToDevices(
    tokens: string[],
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    if (!this.app || tokens.length === 0) {
      this.logger.debug('Skipping push notification (Firebase not configured or no tokens)');
      return;
    }

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      });
    } catch (error) {
      this.logger.error('Failed to send push notification', error as Error);
    }
  }
}
