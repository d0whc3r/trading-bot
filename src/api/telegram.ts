/* eslint-disable */
import TelegramBot from 'node-telegram-bot-api';
import { Config } from '../config';

export class Telegram {
  private botToken = Config.TELEGRAM_BOT_TOKEN;
  private channelId = Config.TELEGRAM_CHANNEL_ID;
  private telegramBot: TelegramBot | undefined;

  constructor() {
    if (this.botToken) {
      this.telegramBot = new TelegramBot(this.botToken, { polling: false });
    }
  }

  sendMessage(title: string, content = '') {
    if (this.channelId) {
      const ct = content ? '\n\n' + content : '';
      const msg = title + ct;
      this.telegramBot?.sendMessage(this.channelId, msg);
    }
  }
}
