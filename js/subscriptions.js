(function () {
  'use strict';

  function createSubscriptionModule(ctx) {
    const { qs, esc, iso, getState, save, modal, recurrence } = ctx;
    let editId = '';

    const parseDate = (value) => value ? new Date(value + 'T12:00:00') : new Date();
    const uid = () => `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    function addMonthsSafe(date, months) {
      const originalDay = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + months);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(originalDay, lastDay));
      return date;
    }

    function computeNext(anchor, every, unit) {
      if(recurrence?.nextDate) return recurrence.nextDate(anchor,every,unit);
      let date = parseDate(anchor);
      const n = Math.max(1, Number(every) || 1);
      if (unit === 'days') date.setDate(date.getDate() + n);
      else if (unit === 'weeks') date.setDate(date.getDate() + 7 * n);
      else if (unit === 'months') date = addMonthsSafe(date, n);
      else date = addMonthsSafe(date, 12 * n);
      return iso(date);
    }

    function monthlyEquivalent(amount, every, unit) {
      const value = Number(amount) || 0;
      const n = Math.max(1, Number(every) || 1);
      if (unit === 'days') return value * 30.4375 / n;
      if (unit === 'weeks') return value * 52.1775 / (12 * n);
      if (unit === 'months') return value / n;
      return value / (12 * n);
    }

    function preview() {
      const amount = Number(qs('#subAmount').value) || 0;
      const every = Number(qs('#subEvery').value) || 1;
      const unit = qs('#subUnit').value;
      const anchor = qs('#subAnchorDate').value || iso(new Date());
      const next = qs('#subNextOverride').value || computeNext(anchor, every, unit);
      const monthly = monthlyEquivalent(amount, every, unit);
      const currency = qs('#subCurrency').value || '';
      qs('#subCalcPreview').textContent = `预计下次续费：${next} · 月均 ${monthly.toFixed(2)} ${currency} · 年均 ${(monthly * 12).toFixed(2)} ${currency}`;
    }

    function openSubscriptionEditor(id = '') {
      editId = id;
      const state = getState();
      const item = id ? state.subscriptions.find((sub) => sub.id === id) : null;
      qs('#subName').value = item?.name || '';
      qs('#subAmount').value = item?.amount ?? '';
      qs('#subCurrency').value = item?.currency || 'CAD';
      qs('#subStatus').value = item?.status || 'active';
      qs('#subAnchorDate').value = item?.anchorDate || iso(new Date());
      qs('#subNextOverride').value = item?.nextOverride || '';
      qs('#subEvery').value = item?.every || 1;
      qs('#subUnit').value = item?.unit || 'months';
      qs('#subPayment').value = item?.payment || '';
      qs('#subTrialEnd').value = item?.trialEnd || '';
      qs('#subAutoRenew').checked = item?.autoRenew !== false;
      qs('#subNotes').value = item?.notes || '';
      modal.open('subscriptionModal');
      preview();
      ['subAmount', 'subCurrency', 'subAnchorDate', 'subNextOverride', 'subEvery', 'subUnit'].forEach((fieldId) => {
        const field = qs('#' + fieldId);
        field.oninput = preview;
        field.onchange = preview;
      });
    }

    function closeSubscriptionEditor() {
      modal.close('subscriptionModal');
    }

    function saveSubscription() {
      const state = getState();
      const data = {
        name: qs('#subName').value.trim() || 'Subscription',
        amount: Number(qs('#subAmount').value) || 0,
        currency: qs('#subCurrency').value.trim() || 'CAD',
        status: qs('#subStatus').value,
        anchorDate: qs('#subAnchorDate').value || iso(new Date()),
        nextOverride: qs('#subNextOverride').value,
        every: Math.max(1, Number(qs('#subEvery').value) || 1),
        unit: qs('#subUnit').value,
        payment: qs('#subPayment').value.trim(),
        trialEnd: qs('#subTrialEnd').value,
        autoRenew: qs('#subAutoRenew').checked,
        notes: qs('#subNotes').value.trim(),
        updatedAt: Date.now()
      };
      data.nextRenewal = data.nextOverride || computeNext(data.anchorDate, data.every, data.unit);

      if (editId) {
        const item = state.subscriptions.find((sub) => sub.id === editId);
        if (item) Object.assign(item, data);
      } else {
        state.subscriptions.push({ id: uid(), ...data, createdAt: Date.now() });
      }
      const result = save();
      if (!result?.ok) return result;
      closeSubscriptionEditor();
      render();
      return result;
    }

    function deleteSubscription(id) {
      const state = getState();
      if (!confirm('确定删除这个 Subscription 吗？')) return;
      state.subscriptions = state.subscriptions.filter((item) => item.id !== id);
      const result = save();
      if (!result?.ok) return result;
      render();
      return result;
    }

    function addSubscriptionToCalendar(id) {
      const item = getState().subscriptions.find((sub) => sub.id === id);
      if (!item) return;
      const date = (item.nextRenewal || computeNext(item.anchorDate, item.every, item.unit)).replaceAll('-', '');
      const text = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//My Journal//Subscription//CN',
        'BEGIN:VEVENT',
        `UID:${item.id}@myjournal`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:${item.name} renewal`,
        `DESCRIPTION:${item.amount} ${item.currency} · every ${item.every} ${item.unit}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${item.name.replace(/[^\w\u4e00-\u9fa5-]+/g, '-')}-renewal.ics`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);
    }

    function render() {
      const state = getState();
      const active = state.subscriptions.filter((item) => item.status === 'active');
      const monthly = active.reduce((sum, item) => sum + monthlyEquivalent(item.amount, item.every, item.unit), 0);
      const metrics = qs('#subscriptionMetrics');
      if (metrics) {
        metrics.innerHTML = `<div class="metric"><b>${monthly.toFixed(2)}</b><span>月均订阅成本</span></div><div class="metric"><b>${(monthly * 12).toFixed(2)}</b><span>年均订阅成本</span></div>`;
      }
      const el = qs('#subscriptionList');
      if (!el) return;
      const list = state.subscriptions.slice().sort((a, b) => (a.nextRenewal || '').localeCompare(b.nextRenewal || ''));
      el.innerHTML = list.length ? list.map((item) => {
        const next = item.nextOverride || item.nextRenewal || computeNext(item.anchorDate, item.every, item.unit);
        const monthlyCost = monthlyEquivalent(item.amount, item.every, item.unit);
        return `<div class="tool-card subscription-card">
          <div class="tool-card-head">
            <div><h3>${esc(item.name)}</h3><div class="amount">${Number(item.amount).toFixed(2)} ${esc(item.currency)}</div></div>
            <span class="status-pill status-${item.status}">${item.status}</span>
          </div>
          <div class="renewal">Next: ${esc(next)} · every ${item.every} ${esc(item.unit)} · 月均 ${monthlyCost.toFixed(2)}</div>
          <div class="tool-actions">
            <button onclick="openSubscriptionEditor('${item.id}')">编辑</button>
            <button onclick="addSubscriptionToCalendar('${item.id}')">加入 Calendar</button>
            <button class="danger" onclick="deleteSubscription('${item.id}')">删除</button>
          </div>
        </div>`;
      }).join('') : '<div class="entry"><span class="small">还没有 Subscription。</span></div>';
    }

    return {
      render,
      openSubscriptionEditor,
      closeSubscriptionEditor,
      saveSubscription,
      deleteSubscription,
      addSubscriptionToCalendar
    };
  }

  window.JournalModules = window.JournalModules || {};
  window.JournalModules.createSubscriptionModule = createSubscriptionModule;
})();
