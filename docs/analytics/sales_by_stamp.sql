WITH stamp_flag AS (
  SELECT r.receipt_id,
         COUNT(s.stamp_id) AS stamp_count,
         COUNTIF(s.verdict='endorse') AS endorsements
  FROM `decrypt_reason.reason_receipts` r
  LEFT JOIN `decrypt_curator.stamps` s ON r.receipt_id = s.receipt_id
  GROUP BY r.receipt_id
),

orders AS (
  SELECT o.order_id, o.receipt_id, o.amount_cents, o.ts
  FROM `decrypt_fulfillment.orders` o
  WHERE DATE(o.ts) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
)

SELECT
  CASE WHEN sf.endorsements > 0 THEN 'stamped_endorsed'
       WHEN sf.stamp_count > 0 THEN 'stamped_other'
       ELSE 'unstamped' END AS cohort,
  COUNT(DISTINCT o.order_id) AS orders,
  ROUND(AVG(o.amount_cents)/100,2) AS avg_price_usd,
  ROUND(SAFE_DIVIDE(COUNT(DISTINCT o.order_id), (SELECT COUNT(DISTINCT order_id) FROM orders))*100,2) AS pct_of_sales
FROM orders o
LEFT JOIN stamp_flag sf ON o.receipt_id = sf.receipt_id
GROUP BY cohort
ORDER BY orders DESC;
