import WebSocket from 'ws';
import { logger } from '../../logger';
import type { BasicSocketResponse, SocketCallback } from '../../types/sockerClient.type';

class SocketClient {
  private readonly baseUrl: string;
  private readonly _path: string;
  private _handlers = new Map<string, SocketCallback[]>();
  private _ws: WebSocket | undefined;

  constructor(path: string, baseUrl: string) {
    this.baseUrl = baseUrl || 'wss://stream.binance.com/';
    this._path = path;
    this._createSocket();
    // this._handlers = new Map();
  }

  _createSocket() {
    logger.debug(`Create WS: ${this.baseUrl}${this._path}`);
    this._ws = new WebSocket(`${this.baseUrl}${this._path}`);

    this._ws.onopen = () => {
      logger.debug('ws connected');
    };

    this._ws.on('pong', () => {
      logger.debug('receieved pong from server');
    });
    this._ws.on('ping', () => {
      logger.debug('========== received ping from server');
      this._ws?.pong();
    });

    this._ws.onclose = () => {
      logger.warn('ws closed');
    };

    this._ws.onerror = (err) => {
      logger.warn('ws error', err);
    };

    this._ws.onmessage = (msg) => {
      try {
        let message: BasicSocketResponse | undefined;
        if (typeof msg.data === 'string') {
          message = JSON.parse(msg.data) as BasicSocketResponse;
        }
        if (message?.e) {
          if (this._handlers.has(message.e)) {
            this._handlers.get(message.e)?.forEach((cb) => {
              cb(message);
            });
          } else {
            logger.warn('Unhandled event', message);
          }
        } else {
          logger.warn('Unprocessed event', message);
        }
      } catch (e) {
        logger.warn('Parse message failed', e);
      }
    };

    this.heartBeat();
  }

  heartBeat() {
    setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.ping();
        logger.debug('ping server');
      }
    }, 5000);
  }

  setHandler(method: string, callback: SocketCallback) {
    if (!this._handlers.has(method)) {
      this._handlers.set(method, []);
    }
    this._handlers.get(method)?.push(callback);
  }
}

export default SocketClient;
