import axios, { AxiosRequestConfig, Method } from 'axios';
import crypto from 'crypto';
import { logger } from '../../logger';

const getRequestInstance = (config: AxiosRequestConfig) => axios.create(config);

export default getRequestInstance;

const buildQueryString = (q: Record<string, string | number | boolean>) => {
  if (q) {
    return `?${Object.keys(q)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(q[k.toString()])}`)
      .join('&')}`;
  }
  return '';
};

export function privateRequest(apiKey: string, apiSecret: string, baseURL: string) {
  return (method: Method = 'GET', path: string, data = {}) => {
    if (!apiKey) {
      throw new Error('API key is missing');
    }
    if (!apiSecret) {
      throw new Error('API secret is missing');
    }

    const timestamp = Date.now();

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(buildQueryString({ ...data, timestamp }).substr(1))
      .digest('hex');
    // eslint-disable-next-line no-console
    console.log('SIGNATURE', signature);

    return getRequestInstance({
      baseURL,
      headers: {
        'content-type': 'application/json',
        'X-MBX-APIKEY': apiKey
      },
      method,
      url: path
    });
  };
}

export function futuresPrivateRequest(apiKey: string, apiSecret: string, baseURL = 'https://fapi.binance.com') {
  return privateRequest(apiKey, apiSecret, baseURL);
}

export function getListenKey(apiKey: string, apiSecret: string, baseURL: string) {
  return futuresPrivateRequest(
    apiKey,
    apiSecret,
    baseURL
  )('POST', '/fapi/v1/listenKey')
    .post<{ listenKey: string }>('/fapi/v1/listenKey')
    .then(({ data }) => data.listenKey)
    .catch((error) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      logger.error({ title: 'Failed to get listen key', error });
      return '';
    });
}
