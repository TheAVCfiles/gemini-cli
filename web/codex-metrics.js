/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-env browser */

(function () {
  const doc = globalThis.document;
  if (!doc) {
    return;
  }

  const fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null;
  const intervalFn = globalThis.setInterval ? globalThis.setInterval.bind(globalThis) : null;
  const logger = globalThis.console ?? {
    error() {},
    warn() {},
  };

  const revenueNode = doc.querySelector('[data-live-revenue]');
  const dealsNode = doc.querySelector('[data-live-transactions]');
  const trailingNode = doc.querySelector('[data-live-revenue-30d]');
  const runRateNode = doc.querySelector('[data-live-run-rate]');
  const footerNode = doc.querySelector('[data-footer-revenue]');
  const lastSaleNode = doc.querySelector('[data-live-last-sale]');

  if (!revenueNode || !footerNode) {
    return;
  }

  const formatterCache = new Map();

  function formatCurrency(value, currency) {
    const cacheKey = currency || 'USD';
    if (!formatterCache.has(cacheKey)) {
      formatterCache.set(
        cacheKey,
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: cacheKey,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    }
    const formatter = formatterCache.get(cacheKey);
    try {
      return formatter.format(value ?? 0);
    } catch (error) {
      logger.warn('codex-metrics: failed to format currency', error);
      return `$${Number(value ?? 0).toFixed(2)}`;
    }
  }

  function formatRelativeDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  function applyMetrics(payload) {
    const totalRevenue = payload?.totals?.revenue;
    const trailing30 = payload?.velocity?.trailing30Days;
    const runRate = payload?.forecast?.annualRunRate;
    const totalTransactions = payload?.totals?.transactions ?? payload?.rawCount ?? null;
    const latestTransaction = payload?.latestTransaction ?? null;
    const currency = totalRevenue?.currency || trailing30?.revenue?.currency || 'USD';

    const formattedRevenue = totalRevenue?.formatted ?? formatCurrency(totalRevenue?.value ?? 0, currency);
    revenueNode.textContent = formattedRevenue;
    footerNode.textContent = formattedRevenue;

    if (dealsNode) {
      dealsNode.textContent = typeof totalTransactions === 'number' ? totalTransactions.toString() : '—';
    }

    if (trailingNode) {
      const trailingValue = trailing30?.revenue?.formatted ??
        formatCurrency(trailing30?.revenue?.value ?? 0, currency);
      trailingNode.textContent = trailingValue;
    }

    if (runRateNode) {
      const runRateValue = runRate?.formatted ?? formatCurrency(runRate?.value ?? 0, currency);
      runRateNode.textContent = runRateValue;
    }

    if (lastSaleNode) {
      lastSaleNode.textContent = formatRelativeDate(latestTransaction?.occurredAt);
    }
  }

  async function fetchMetrics() {
    try {
      if (!fetchFn) {
        return;
      }
      const response = await fetchFn('/api/codex', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      const payload = await response.json();
      applyMetrics(payload);
    } catch (error) {
      logger.error('codex-metrics: unable to load metrics', error);
    }
  }

  fetchMetrics();
  if (intervalFn) {
    intervalFn(fetchMetrics, 60_000);
  }
})();
