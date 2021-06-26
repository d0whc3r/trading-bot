function parseBool(b: string | number | boolean) {
  return [true, 1, 'true', '1'].includes(b);
}

export class Config {
  public static NODE_ENV = process.env.NODE_ENV || 'development';
  public static IS_TEST = process.env.NODE_ENV === 'test';
  public static PORT = +(process.env.PORT || 80);
  public static HOST = process.env.HOST || '0.0.0.0';
  public static MAIN_PATH = process.env.MAIN_PATH || '/tv-alert';
  public static SERVER_CODE = process.env.SERVER_CODE;
  public static LOGGER_LOGDNA_KEY = process.env.LOGGER_LOGDNA_KEY;
  public static BINANCE_DEMO = parseBool(process.env.BINANCE_DEMO || true);
  public static BINANCE_APIKEY = process.env.BINANCE_APIKEY;
  public static BINANCE_SECRETKEY = process.env.BINANCE_SECRETKEY;
  public static BINANCE_LEVERAGE = +(process.env.BINANCE_LEVERAGE || 5);
  public static BINANCE_AMOUNT_BET = +(process.env.BINANCE_AMOUNT_BET || 50);
  public static BINANCE_MARGIN_TYPE = process.env.BINANCE_MARGIN_TYPE || 'ISOLATED';
  public static BINANCE_STOP_LOSS = +(process.env.BINANCE_STOP_LOSS || 0);
  public static BINANCE_TAKE_PROFIT = +(process.env.BINANCE_TAKE_PROFIT || 0);
  public static BINANCE_FOMO = +parseBool(process.env.BINANCE_FOMO || false);
}
