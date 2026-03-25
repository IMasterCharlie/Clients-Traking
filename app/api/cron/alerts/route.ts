import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechAsset from '@/models/TechAsset';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { sendEmail } from '@/lib/mailer';
import { addMonths, startOfDay, endOfDay } from 'date-fns';

// Helper: check if a notification was already created today for same relatedId + type + userId
async function alreadyNotifiedToday(userId: string, relatedId: string, type: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const existing = await Notification.findOne({
    userId,
    relatedId,
    type,
    createdAt: { $gte: todayStart, $lte: todayEnd },
  });
  return !!existing;
}

async function getUserEmail(userId: string): Promise<string | null> {
  const user = await User.findById(userId).select('email').lean() as { email?: string } | null;
  return user?.email || null;
}

export async function POST(req: NextRequest) {
  // Security: validate CRON_SECRET header
  const cronSecret = req.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const now = new Date();
    const results = {
      hostingExpiry: 0,
      domainExpiry: 0,
      sslExpiry: 0,
      overduePayments: 0,
      subscriptionRenewals: 0,
      invoiceOverdue: 0,
    };

    // ─── 1. HOSTING EXPIRY ──────────────────────────────────────────────────
    const hostingAssets = await TechAsset.find({
      'hosting.expiryDate': { $exists: true, $ne: null },
    }).lean();

    for (const asset of hostingAssets) {
      if (!asset.hosting?.expiryDate) continue;
      const reminderDays = asset.hosting.reminderDays ?? 30;
      const threshold = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

      if (new Date(asset.hosting.expiryDate) <= threshold) {
        const userId = asset.userId.toString();
        const alreadyDone = await alreadyNotifiedToday(userId, asset._id.toString(), 'hosting_expiry');
        if (alreadyDone) continue;

        const daysLeft = Math.floor(
          (new Date(asset.hosting.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const notification = await Notification.create({
          userId: asset.userId,
          type: 'hosting_expiry',
          title: 'Hosting Expiry Alert',
          message: `Hosting for project expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}${asset.hosting.provider ? ` (${asset.hosting.provider})` : ''}.`,
          relatedId: asset._id,
          relatedType: 'techasset',
          emailSent: false,
        });

        const email = await getUserEmail(userId);
        if (email) {
          try {
            await sendEmail({
              to: email,
              subject: `⚠️ Hosting Expiry Alert — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`,
              html: `<p>${notification.message}</p><p>Please renew your hosting to avoid downtime.</p>`,
            });
            await Notification.findByIdAndUpdate(notification._id, { emailSent: true });
          } catch { /* email failure is non-blocking */ }
        }
        results.hostingExpiry++;
      }
    }

    // ─── 2. DOMAIN EXPIRY ────────────────────────────────────────────────────
    const domainAssets = await TechAsset.find({
      'domain.expiryDate': { $exists: true, $ne: null },
    }).lean();

    for (const asset of domainAssets) {
      if (!asset.domain?.expiryDate) continue;
      const reminderDays = asset.domain.reminderDays ?? 30;
      const threshold = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

      if (new Date(asset.domain.expiryDate) <= threshold) {
        const userId = asset.userId.toString();
        const alreadyDone = await alreadyNotifiedToday(userId, asset._id.toString(), 'domain_expiry');
        if (alreadyDone) continue;

        const daysLeft = Math.floor(
          (new Date(asset.domain.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const notification = await Notification.create({
          userId: asset.userId,
          type: 'domain_expiry',
          title: 'Domain Expiry Alert',
          message: `Domain${asset.domain.domainName ? ` "${asset.domain.domainName}"` : ''} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
          relatedId: asset._id,
          relatedType: 'techasset',
          emailSent: false,
        });

        const email = await getUserEmail(userId);
        if (email) {
          try {
            await sendEmail({
              to: email,
              subject: `⚠️ Domain Expiry Alert — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`,
              html: `<p>${notification.message}</p><p>Please renew your domain to avoid service disruption.</p>`,
            });
            await Notification.findByIdAndUpdate(notification._id, { emailSent: true });
          } catch { /* non-blocking */ }
        }
        results.domainExpiry++;
      }
    }

    // ─── 3. SSL EXPIRY ───────────────────────────────────────────────────────
    const sslAssets = await TechAsset.find({
      'ssl.expiryDate': { $exists: true, $ne: null },
    }).lean();

    for (const asset of sslAssets) {
      if (!asset.ssl?.expiryDate) continue;
      const reminderDays = asset.ssl.reminderDays ?? 14;
      const threshold = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

      if (new Date(asset.ssl.expiryDate) <= threshold) {
        const userId = asset.userId.toString();
        const alreadyDone = await alreadyNotifiedToday(userId, asset._id.toString(), 'ssl_expiry');
        if (alreadyDone) continue;

        const daysLeft = Math.floor(
          (new Date(asset.ssl.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const notification = await Notification.create({
          userId: asset.userId,
          type: 'ssl_expiry',
          title: 'SSL Certificate Expiry Alert',
          message: `SSL certificate expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}${asset.ssl.provider ? ` (${asset.ssl.provider})` : ''}. Renew to keep your site secure.`,
          relatedId: asset._id,
          relatedType: 'techasset',
          emailSent: false,
        });

        const email = await getUserEmail(userId);
        if (email) {
          try {
            await sendEmail({
              to: email,
              subject: `🔐 SSL Expiry Alert — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`,
              html: `<p>${notification.message}</p>`,
            });
            await Notification.findByIdAndUpdate(notification._id, { emailSent: true });
          } catch { /* non-blocking */ }
        }
        results.sslExpiry++;
      }
    }

    // ─── 4. OVERDUE PAYMENTS ─────────────────────────────────────────────────
    const overduePaymentDocs = await Payment.find({
      status: 'unpaid',
      dueDate: { $lt: now },
    }).lean();

    if (overduePaymentDocs.length > 0) {
      const ids = overduePaymentDocs.map((p) => p._id);
      await Payment.updateMany({ _id: { $in: ids } }, { $set: { status: 'overdue' } });

      for (const payment of overduePaymentDocs) {
        if (payment.reminderSent) continue;
        const userId = payment.userId.toString();

        await Notification.create({
          userId: payment.userId,
          type: 'payment_overdue',
          title: 'Payment Overdue',
          message: `Payment of ${payment.currency} ${payment.amount.toLocaleString()} is overdue. Due date: ${new Date(payment.dueDate).toLocaleDateString()}.`,
          relatedId: payment._id,
          relatedType: 'payment',
          emailSent: false,
        });

        const email = await getUserEmail(userId);
        if (email) {
          try {
            await sendEmail({
              to: email,
              subject: '⚠️ Payment Overdue — Action Required',
              html: `<p>A payment of ${payment.currency} ${payment.amount.toLocaleString()} is now overdue.</p><p>Due date was: ${new Date(payment.dueDate).toLocaleDateString()}</p>`,
            });
            await Payment.findByIdAndUpdate(payment._id, { reminderSent: true });
          } catch { /* non-blocking */ }
        }
        results.overduePayments++;
      }
    }

    // ─── 5. SUBSCRIPTION RENEWALS DUE ────────────────────────────────────────
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const subscriptionsDue = await Payment.find({
      isRecurring: true,
      nextDueDate: { $gte: todayStart, $lte: todayEnd },
    }).lean();

    for (const payment of subscriptionsDue) {
      // Clone payment with new dueDate = today, status = unpaid
      await Payment.create({
        userId: payment.userId,
        clientId: payment.clientId,
        projectId: payment.projectId,
        type: payment.type,
        amount: payment.amount,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        status: 'unpaid',
        dueDate: now,
        description: payment.description,
        isRecurring: false,
        reminderSent: false,
        notes: `Auto-generated from recurring payment on ${now.toLocaleDateString()}`,
      });

      // Advance nextDueDate by 1 month
      const newNextDue = addMonths(new Date(payment.nextDueDate!), 1);
      await Payment.findByIdAndUpdate(payment._id, { nextDueDate: newNextDue });

      await Notification.create({
        userId: payment.userId,
        type: 'subscription_due',
        title: 'Subscription Renewal Due',
        message: `Recurring payment of ${payment.currency} ${payment.amount.toLocaleString()} is due today.`,
        relatedId: payment._id,
        relatedType: 'payment',
        emailSent: false,
      });

      results.subscriptionRenewals++;
    }

    // ─── 6. INVOICE OVERDUE ───────────────────────────────────────────────────
    const overdueInvoices = await Invoice.find({
      status: 'sent',
      dueDate: { $lt: now },
    }).lean();

    if (overdueInvoices.length > 0) {
      const ids = overdueInvoices.map((inv) => inv._id);
      await Invoice.updateMany({ _id: { $in: ids } }, { $set: { status: 'overdue' } });

      for (const invoice of overdueInvoices) {
        await Notification.create({
          userId: invoice.userId,
          type: 'invoice_overdue',
          title: 'Invoice Overdue',
          message: `Invoice #${invoice.invoiceNumber} for ${invoice.currency} ${invoice.total.toLocaleString()} is overdue.`,
          relatedId: invoice._id,
          relatedType: 'invoice',
          emailSent: false,
        });
        results.invoiceOverdue++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      results,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
