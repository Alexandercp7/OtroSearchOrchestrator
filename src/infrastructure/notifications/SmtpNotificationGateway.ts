import nodemailer from 'nodemailer';
import { Alert } from '../../domain/entities/Alert';
import { PriceSnapshot } from '../../domain/entities/PriceSnapshot';
import { User } from '../../domain/entities/User';
import { NotificationGateway } from '../../domain/interfaces/gateways/NotificationGateway';

export class SmtpNotificationGateway implements NotificationGateway {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async notify(user: User, alert: Alert, snapshot: PriceSnapshot): Promise<void> {
    await this.transporter.sendMail({
      from:    process.env.SMTP_FROM ?? 'noreply@searchorchestrator.com',
      to:      user.email.value,
      subject: `Price alert triggered for ${alert.productUrl}`,
      text:    `Your alert was triggered. Current price: ${snapshot.price.amount} ${snapshot.price.currency}`,
    });
  }
}
