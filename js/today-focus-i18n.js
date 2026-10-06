(function () {
  'use strict';

  const messages = {
    todayFocus: { zh: '今日重点', en: 'Today Focus' },
    pickupOrders: { zh: '待取订单', en: 'Pickup Orders' },
    pickupReadyCount: { zh: '{count} 个可以取货', en: '{count} orders ready for pickup' },
    pickupMore: { zh: '+{count}', en: '+{count}' },
    overdueOrder: { zh: '订单已超过预计日期', en: 'Order Past Expected Date' },
    expectedToday: { zh: '今天预计到货', en: 'Expected Today' },
    expectedSoon: { zh: '即将到货', en: 'Expected Soon' },
    dueToday: { zh: '今天扣款', en: 'Due Today' },
    dueSoon: { zh: '即将扣款', en: 'Due Soon' },
    activeChallenge: { zh: '当前挑战', en: 'Active Challenge' },
    notLoggedToday: { zh: '今日未记录', en: 'Not Logged Today' },
    view: { zh: '查看', en: 'View' },
    continue: { zh: '继续', en: 'Continue' },
    viewAll: { zh: '查看全部', en: 'View All' },
    nothingNeedsAttention: { zh: '今天没有需要特别处理的事项', en: 'Nothing needs your attention today.' },
    tomorrow: { zh: '明天', en: 'Tomorrow' },
    inDays: { zh: '{days} 天后', en: 'In {days} days' },
    dayProgress: { zh: '第 {current} / {total} 天', en: 'Day {current} / {total}' },
    weekProgress: { zh: '第 {current} / 12 周', en: 'Week {current} / 12' },
    close: { zh: '关闭', en: 'Close' }
  };

  function locale() {
    return String(document.documentElement.lang || 'zh-CN').toLowerCase().startsWith('en') ? 'en' : 'zh';
  }

  function t(key, params = {}) {
    const template = messages[key]?.[locale()] || messages[key]?.zh || key;
    return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
  }

  window.TodayFocusI18n = { locale, t, messages };
})();
