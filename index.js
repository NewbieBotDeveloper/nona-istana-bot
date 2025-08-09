import 'dotenv/config';
import express from 'express';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';

const {
  BOT_TOKEN,
  COMMUNITY_CHAT_ID,
  TOPIC_GROUP_ID,
  TOPIC_THREAD_ID,
  TIMEZONE = 'Asia/Phnom_Penh',
} = process.env;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN kosong. Set di Replit/ENV dulu.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// --- Keep-alive server (Replit friendly) ---
const app = express();
app.get('/', (_, res) => res.send('Zona JP Bot OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP server on :${PORT}`));

// --- Helper kirim pesan ---
async function sendToCommunity(text, extra = {}) {
  if (!COMMUNITY_CHAT_ID) return;
  try {
    await bot.telegram.sendMessage(String(COMMUNITY_CHAT_ID), text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...extra,
    });
  } catch (e) {
    console.error('sendToCommunity error:', e.message);
  }
}

async function sendToTopic(text, extra = {}) {
  if (!TOPIC_GROUP_ID || !TOPIC_THREAD_ID) return;
  try {
    await bot.telegram.sendMessage(String(TOPIC_GROUP_ID), text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      message_thread_id: Number(TOPIC_THREAD_ID),
      ...extra,
    });
  } catch (e) {
    console.error('sendToTopic error:', e.message);
  }
}

// --- Commands dasar ---
bot.start(async (ctx) => {
  await ctx.reply(
    `Halo Bos! 👋\nSiap bantu auto-balas & auto-broadcast.\nKetik /help buat lihat menu.`
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    [
      '*Menu:*',
      '/pola - Pola gacor hari ini',
      '/promo - Promo & bonus',
      '/caradeposit - Cara deposit',
      '/getid - Lihat chat ID & thread ID (pakai di grup/topik)',
    ].join('\n'),
    { parse_mode: 'Markdown' }
  );
});

// Ambil chat ID + thread ID (pakai di masing2 grup)
bot.command('getid', async (ctx) => {
  const chat = ctx.chat;
  const threadId =
    ctx.message?.message_thread_id ?? ctx.channelPost?.message_thread_id;
  const info =
    `Chat Title: ${chat.title || '-'}\n` +
    `Chat Type: ${chat.type}\n` +
    `Chat ID: ${chat.id}\n` +
    `Thread ID: ${threadId ?? '(tidak ada / bukan topic)'}\n`;
  await ctx.reply('```' + info + '```', { parse_mode: 'Markdown' });
});

// Contoh konten cepat
bot.command('pola', async (ctx) => {
  await ctx.reply(
    [
      '🎯 *Pola Gacor Hari Ini*',
      '• Slot 1: ...',
      '• Slot 2: ...',
      '• Catatan: sesuaikan jam main & modal.',
    ].join('\n'),
    { parse_mode: 'Markdown' }
  );
});

bot.command('promo', async (ctx) => {
  await ctx.reply(
    [
      '🎁 *Promo & Bonus Aktif*',
      '• Cashback harian',
      '• Freebet event',
      '• Turnamen mingguan',
      '_Cek detail di channel pengumuman._',
    ].join('\n'),
    { parse_mode: 'Markdown' }
  );
});

bot.command('caradeposit', async (ctx) => {
  await ctx.reply(
    [
      '💳 *Cara Deposit*',
      '1) Hubungkan akun',
      '2) Pilih metode (QRIS/Bank/e-Wallet)',
      '3) Upload bukti, tunggu verifikasi',
      '_CS standby kalau butuh bantuan._',
    ].join('\n'),
    { parse_mode: 'Markdown' }
  );
});

// --- Auto-reply keyword sederhana (bisa tambah sesuai kebutuhan) ---
bot.hears(/#bukti/i, async (ctx) => {
  await ctx.reply('Terima kasih kirim buktinya, Bos! ✅');
});

bot.hears(/pola|polanya|pattern/i, async (ctx) => {
  await ctx.reply('Mau pola cepat? ketik /pola ya Bos.');
});

bot.hears(/promo|bonus/i, async (ctx) => {
  await ctx.reply('Info promo terbaru ada di /promo, cek ya Bos 😉');
});

// --- Jadwal auto-broadcast (contoh) ---
// 09:00 setiap hari: kirim Pola ke Grup Topic (thread)
// Cron: "0 9 * * *"
cron.schedule(
  '0 9 * * *',
  async () => {
    await sendToTopic(
      [
        '📌 *Prediksi & Pola Harian*',
        '• Prediksi: ...',
        '• Pola: ...',
        '⏳ Update harian, cek rutin ya Bos.',
      ].join('\n')
    );
  },
  { timezone: TIMEZONE }
);

// 12:00 setiap hari: Promo ke Grup Komunitas
cron.schedule(
  '0 12 * * *',
  async () => {
    await sendToCommunity(
      [
        '🔥 *Promo Siang*',
        '• Cashback harian',
        '• Event share bukti',
        'Gas yang santai, tetap enjoy.',
      ].join('\n')
    );
  },
  { timezone: TIMEZONE }
);

// 19:00 setiap hari: Bukti Cuan ke Grup Komunitas
cron.schedule(
  '0 19 * * *',
  async () => {
    await sendToCommunity(
      [
        '🎉 *Bukti Cuan Member*',
        '#bukti #win\n',
        'Yang gas 👉 panen. Yang ragu 👉 tinggal cerita 😏',
      ].join('\n')
    );
  },
  { timezone: TIMEZONE }
);

bot.launch();
console.log('Zona JP Bot started.');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
