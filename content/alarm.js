const alertText = `{
  "ticker": "{{ticker}}",
  "strategy": {
    "order_id": "{{strategy.order.id}}",
    "order_action": "{{strategy.order.action}}",
    "market_position": "{{strategy.market_position}}",
    "order_price": "{{strategy.order.price}}",
    "prev_market_position": "{{strategy.prev_market_position}}"
  },
  "code": "code",
  "time": "{{timenow}}",
  "exchange": "{{exchange}}"
}`;
function clickAlert() {
  const alertIcon = document.querySelector('.js-backtesting-open-alert-dialog');
  if (alertIcon) {
    alertIcon.click();
    setTimeout(() => {
      const textArea = document.querySelector('.tv-control-textarea');
      textArea.value = alertText;
      textArea.dispatchEvent(new Event('change'));
      document.querySelector('div[data-name=submit]').click();
    }, 500);
  }
}
const items = document.querySelectorAll('div[data-symbol-short]');
items.forEach((item) => {
  const symbol = item.querySelector('div[class*=symbolName]');
  if (!symbol.querySelector('.auto-button')) {
    const button = document.createElement('button');
    button.classList.add('auto-button');
    button.textContent = 'O';
    button.onclick = clickAlert;
    symbol.appendChild(button);
  }
});
