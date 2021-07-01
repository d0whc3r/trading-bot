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

  sendMessage(title: string, content: string) {
    if (this.channelId) {
      const msg = title + '\n\n' + content;
      this.telegramBot?.sendMessage(this.channelId, msg);
    }
  }
}
