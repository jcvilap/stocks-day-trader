const { IncomingWebhook } = require('@slack/client');
const moment = require('moment');
const { isString, get } = require('lodash');
const { formatJSON } = require('./utils');

const { SLACK_LOG_ERROR_WEBHOOK_URL, SLACK_LOG_OTHER_WEBHOOK_URL } = require('../config/env');

class LogService {
  constructor() {
    this.errorLogger = new IncomingWebhook(SLACK_LOG_ERROR_WEBHOOK_URL);
    this.logger = new IncomingWebhook(SLACK_LOG_OTHER_WEBHOOK_URL);
  }

  error(toBeLogged, error = '') {
    const msg = get(toBeLogged, 'message', toBeLogged);
    const err = get(error, 'message', error);
    const stack = get(toBeLogged, 'stack', get(error, 'stack', ''));
    const message = isString(msg) ? msg : formatJSON(msg, 0);
    const errorMsg = isString(err) ? err : formatJSON(err, 0);
    const finalMessage = `*${message}* ${errorMsg} ${stack}`.trim();
    this.errorLogger.send(finalMessage);
    console.log(finalMessage);
  }

  orderPlaced({ symbol, side, name, created_at = new Date(), price }) {
    const message = `${symbol} | ${side} | ${name} | $${Number(price).toFixed(3)} | ${moment(created_at).format('MM/DD/YY h:mm:ssa')}`;
    this.logger.send(`:rocket: *ORDER PLACED =>* ${message}`);
    console.log(`*ORDER PLACED =>* ${message}`);
  }

  orderCanceled({ symbol, side, name, date = new Date(), price }) {
    const message = `${symbol} | ${side} | ${name} | $${Number(price).toFixed(3)} | ${moment(date).format('MM/DD/YY h:mm:ssa')}`;
    this.logger.send(`:skull: *ORDER CANCELED =>* ${message}`);
    console.log(`*ORDER CANCELED =>* ${message}`);
  }

  log(message) {
    this.logger.send(message);
    console.log(message);
  }

  logMeta(trade, quote, rule) {
    console.log(
      `[ ${rule.name.substring(0, 15)}... ]`,
      ' => close: ', this.parse(quote.close),
      '| entry: ', this.parse(get(trade, 'buyPrice', 0)),
      '| risk: ', this.parse(get(trade, 'riskValue', 0)),
      '| profit: ', this.parse(get(trade, 'profitValue', 0)),
      '| follow: ', get(rule, 'limits.followPrice', false),
      '\n==========================================================================================================='
    );
  }

  parse(n) {
    return parseFloat(Math.round(n * 100) / 100).toFixed(2);
  }
}

module.exports = new LogService();
