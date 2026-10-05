(function () {
  'use strict';

  const COMPLETED = new Set(['delivered', 'picked_up', 'cancelled', 'returned']);
  const PICKUP = new Set(['ready_pickup', 'ready_for_pickup', 'pickup_ready', 'at_pickup_point']);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const clone = value => JSON.parse(JSON.stringify(value));

  function localDateParts(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function addCalendarDays(today, days) {
    const date = localDateParts(today);
    if (!date) return '';
    date.setDate(date.getDate() + Number(days || 0));
    return localDateKey(date);
  }

  function daysBetween(today, later) {
    const start = localDateParts(today), end = localDateParts(later);
    if (!start || !end) return null;
    let days = 0;
    while (localDateKey(start) !== localDateKey(end) && days < 3700) {
      start.setDate(start.getDate() + 1);
      days += 1;
    }
    return localDateKey(start) === localDateKey(end) ? days : null;
  }

  function defaultEffectiveStatus(order, state) {
    const forwarding = order?.forwarding || {};
    if (forwarding.independentStatus) return forwarding.independentStatus;
    const batch = (state.orders?.forwardingBatches || []).find(row => String(row?.id) === String(forwarding.batchId));
    if (order?.fulfillmentType === 'forwarding' && batch && !forwarding.overrideEnabled) return batch.currentStage || batch.stage || order.status || '';
    return forwarding.preForwardingStage || forwarding.currentStage || forwarding.stage || order?.status || '';
  }

  function item({ module, sourceId, type, priority, date = '', titleKey, subtitle = '', action, meta = {} }) {
    return { id: `${module}:${sourceId}`, module, sourceId: String(sourceId), type, priority, date, titleKey, subtitle, meta, action };
  }

  function collectOrderFocusItems(state, today, options = {}) {
    const effective = options.getEffectiveOrderStatus || ((order) => defaultEffectiveStatus(order, state));
    const sellers = state.orders?.sellers || [];
    const byOrder = new Map();
    for (const order of state.orders?.items || []) {
      if (!order?.id || order.archived) continue;
      const status = String(effective(order) || '').toLowerCase();
      if (COMPLETED.has(status)) continue;
      const seller = order.sellerNameSnapshot || sellers.find(row => String(row?.id) === String(order.sellerId))?.name || '';
      let next = null;
      if (PICKUP.has(status)) next = item({ module: 'orders', sourceId: order.id, type: 'ready_pickup', priority: 1, titleKey: 'readyPickup', subtitle: seller, action: { type: 'open_order', id: String(order.id) } });
      else if (order.expectedDate && order.expectedDate < today) next = item({ module: 'orders', sourceId: order.id, type: 'overdue_order', priority: 1, date: order.expectedDate, titleKey: 'overdueOrder', subtitle: seller, action: { type: 'open_order', id: String(order.id) } });
      else if (order.expectedDate === today) next = item({ module: 'orders', sourceId: order.id, type: 'expected_today', priority: 2, date: order.expectedDate, titleKey: 'expectedToday', subtitle: seller, action: { type: 'open_order', id: String(order.id) } });
      else if (order.expectedDate > today && order.expectedDate <= addCalendarDays(today, 2)) next = item({ module: 'orders', sourceId: order.id, type: 'expected_soon', priority: 3, date: order.expectedDate, titleKey: 'expectedSoon', subtitle: seller, action: { type: 'open_order', id: String(order.id) } });
      if (next) byOrder.set(String(order.id), next);
    }
    return [...byOrder.values()];
  }

  function collectSubscriptionFocusItems(state, today) {
    const dueSoon = addCalendarDays(today, 3);
    return (state.subscriptions || []).flatMap(subscription => {
      if (!subscription?.id || subscription.status !== 'active') return [];
      const renewalDate = subscription.nextOverride || subscription.nextRenewal || '';
      if (!localDateParts(renewalDate)) return [];
      const subtitle = [subscription.name || '', Number.isFinite(Number(subscription.amount)) ? `${Number(subscription.amount).toFixed(2)} ${subscription.currency || ''}`.trim() : ''].filter(Boolean).join(' · ');
      if (renewalDate === today) return [item({ module: 'subscriptions', sourceId: subscription.id, type: 'subscription_today', priority: 1, date: renewalDate, titleKey: 'dueToday', subtitle, action: { type: 'open_subscription', id: String(subscription.id) } })];
      if (renewalDate > today && renewalDate <= dueSoon) return [item({ module: 'subscriptions', sourceId: subscription.id, type: 'subscription_soon', priority: 3, date: renewalDate, titleKey: 'dueSoon', subtitle, action: { type: 'open_subscription', id: String(subscription.id) }, meta: { daysAway: daysBetween(today, renewalDate) } })];
      return [];
    });
  }

  function collectChallengeFocusItems(state, today, options = {}) {
    const projections = typeof options.getActiveChallengeDashboardCards === 'function' ? options.getActiveChallengeDashboardCards(today) : [];
    return projections.flatMap(projection => {
      if (!projection?.challengeId) return [];
      const record = projection.record || {};
      const progress = projection.kind === 'twelve_week'
        ? { current: projection.currentDay, total: 12, key: 'weekProgress' }
        : { current: projection.currentDay, total: projection.duration || 0, key: 'dayProgress' };
      const base = { module: 'challenges', sourceId: projection.challengeId, titleKey: 'activeChallenge', subtitle: '', action: { type: projection.kind === 'no_spend' ? 'open_no_spend' : projection.kind === 'focus' ? 'open_challenge' : 'open_twelve_week', id: String(projection.challengeId), today }, meta: { challengeKind: projection.kind, progress } };
      if (projection.kind === 'no_spend') {
        const log = (record.logs || []).find(row => row?.date === today);
        if (!log) return [item({ ...base, type: 'challenge_no_spend_unlogged', priority: 2, subtitle: 'notLoggedToday' })];
        return [];
      }
      if (projection.kind === 'focus') {
        const incomplete = projection.mode === 'score'
          ? Object.keys(record.dailyLogs?.[today] || {}).length === 0
          : !(record.completedDates || []).includes(today);
        return incomplete ? [item({ ...base, type: 'challenge_focus_incomplete', priority: 2 })] : [];
      }
      if (projection.kind === 'twelve_week') return [item({ ...base, type: 'challenge_twelve_week', priority: 3 })];
      return [];
    });
  }

  function sortItems(items) {
    return items.slice().sort((a, b) =>
      Number(a.priority) - Number(b.priority) ||
      (a.date ? 0 : 1) - (b.date ? 0 : 1) ||
      String(a.date || '').localeCompare(String(b.date || '')) ||
      String(a.module).localeCompare(String(b.module)) ||
      String(a.sourceId).localeCompare(String(b.sourceId))
    );
  }

  function buildTodayFocusItems(state, today, options = {}) {
    const before = JSON.stringify(state);
    const source = clone(state || {});
    const items = [
      ...collectOrderFocusItems(source, today, options),
      ...collectSubscriptionFocusItems(source, today),
      ...collectChallengeFocusItems(source, today, options)
    ];
    const deduped = [...new Map(items.map(row => [`${row.module}:${row.sourceId}`, row])).values()];
    if (JSON.stringify(state) !== before) throw new Error('Today Focus must not mutate canonical state.');
    return sortItems(deduped);
  }

  function subtitleText(row) {
    const i18n = window.TodayFocusI18n;
    const progress = row.meta?.progress;
    if (row.subtitle === 'notLoggedToday') return [progress ? i18n.t(progress.key, progress) : '', i18n.t('notLoggedToday')].filter(Boolean).join(' · ');
    if (progress) return i18n.t(progress.key, progress);
    if (row.type === 'subscription_soon') {
      const when = row.meta.daysAway === 1 ? i18n.t('tomorrow') : i18n.t('inDays', { days: row.meta.daysAway });
      return [when, row.subtitle].filter(Boolean).join(' · ');
    }
    return row.subtitle || '';
  }

  function icon(type) {
    if (type.includes('subscription')) return '◷';
    if (type.includes('challenge')) return '✓';
    if (type === 'ready_pickup') return '⌑';
    return '□';
  }

  function renderRows(rows) {
    const i18n = window.TodayFocusI18n;
    return rows.map(row => `<button type="button" class="today-focus-row" data-today-focus-id="${esc(row.id)}" onclick="openTodayFocusItem('${esc(row.module)}','${esc(row.sourceId)}','${esc(row.type)}')"><span class="today-focus-icon" aria-hidden="true">${icon(row.type)}</span><span class="today-focus-copy"><b>${esc(i18n.t(row.titleKey))}</b><small>${esc(subtitleText(row))}</small></span><span class="today-focus-cta">${esc(row.module === 'challenges' ? i18n.t('continue') : i18n.t('view'))} ›</span></button>`).join('');
  }

  function render(state, today, options = {}) {
    const i18n = window.TodayFocusI18n;
    const items = buildTodayFocusItems(state, today, options);
    const visible = items.slice(0, 5);
    return `<section class="today-focus" aria-labelledby="todayFocusHeading"><div class="section-head"><h2 id="todayFocusHeading">${esc(i18n.t('todayFocus'))}</h2>${items.length > 5 ? `<button type="button" class="ghost today-focus-view-all" onclick="openTodayFocusDetails()">${esc(i18n.t('viewAll'))}</button>` : ''}</div><div class="today-focus-list">${visible.length ? renderRows(visible) : `<p class="today-focus-empty">${esc(i18n.t('nothingNeedsAttention'))}</p>`}</div></section>`;
  }

  window.TodayFocus = { buildTodayFocusItems, collectOrderFocusItems, collectSubscriptionFocusItems, collectChallengeFocusItems, addCalendarDays, daysBetween, render, renderRows, subtitleText };
})();
