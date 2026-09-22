/**
 * Centralized Real-Time Phone Notification Service for S.R Rental Services
 * Supports:
 * 1. Automated WhatsApp to Phone (via WhatsApp Cloud API / UltraMsg / CallMeBot / Twilio)
 * 2. Telegram Bot Instant Push Alert to Phone (Free & Instant)
 * 3. SMS Alert (Twilio / Fast2SMS)
 * 4. Web Push Notifications for Mobile Browsers
 */

export interface LeadNotificationPayload {
  leadId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyLocation: string;
  ownerName?: string;
  ownerPhone?: string;
  moveInTimeline?: string;
  message?: string;
}

export async function sendLeadNotificationToAdmin(payload: LeadNotificationPayload) {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || '917218661327';
  const cleanAdminPhone = adminPhone.replace(/\D/g, '');

  const textMessage =
    `🚨 *NEW PROPERTY LEAD ALERT - S.R RENTALS*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏠 *Property:* ${payload.propertyTitle}\n` +
    `💰 *Rent:* ₹${payload.propertyPrice.toLocaleString('en-IN')}/month\n` +
    `📍 *Location:* ${payload.propertyLocation}\n\n` +
    `👤 *Client:* ${payload.clientName}\n` +
    `📞 *Phone:* ${payload.clientPhone}\n` +
    `✉️ *Email:* ${payload.clientEmail}\n` +
    `📝 *Note:* "${payload.message || 'Interested in property visit.'}"\n\n` +
    `👤 *Landlord:* ${payload.ownerName || 'Partner Owner'}\n` +
    `📞 *Owner Phone:* ${payload.ownerPhone || 'N/A'}\n` +
    `🕒 *Time:* ${new Date().toLocaleString('en-IN')}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 Open Admin CRM: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`;

  const results: Record<string, any> = {};

  // 1. Telegram Bot Automated Alert (Instant & Free push notification to mobile phone)
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (telegramBotToken && telegramChatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: textMessage,
          parse_mode: 'Markdown',
        }),
      });
      results.telegram = await tgRes.json();
      console.log('[Phone Notification] Telegram alert dispatched successfully');
    } catch (err: any) {
      console.error('[Phone Notification] Telegram dispatch error:', err.message);
      results.telegramError = err.message;
    }
  }

  // 2. CallMeBot WhatsApp API (Free automated WhatsApp message to admin phone)
  const callMeBotApiKey = process.env.CALLMEBOT_API_KEY;
  if (callMeBotApiKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanAdminPhone}&text=${encodeURIComponent(textMessage)}&apikey=${callMeBotApiKey}`;
      await fetch(url);
      console.log('[Phone Notification] CallMeBot WhatsApp automated alert sent');
      results.callMeBot = true;
    } catch (err: any) {
      console.error('[Phone Notification] CallMeBot error:', err.message);
    }
  }

  // 3. Generic Webhook Dispatch (e.g. Zapier / Make / Pipedream / Twilio)
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'lead_generated',
          text: textMessage,
          data: payload,
          adminPhone: cleanAdminPhone,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log('[Phone Notification] Webhook triggered successfully');
      results.webhook = true;
    } catch (err: any) {
      console.error('[Phone Notification] Webhook error:', err.message);
    }
  }

  console.log(`[Phone Notification Summary] Lead #${payload.leadId} notification processed for Admin (${cleanAdminPhone})`);
  return results;
}
