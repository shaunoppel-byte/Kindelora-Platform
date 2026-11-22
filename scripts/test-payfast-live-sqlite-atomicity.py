"""Execute actual SQLite transactions against production PLUS migration SQL.
This is offline SQLite parity coverage, NOT a substitute for Cloudflare D1 tests.
"""
import pathlib, sqlite3, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PaymentAtomicity(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  self.db.execute('PRAGMA foreign_keys=ON')
  for name in ('0001_plus_persistence.sql','0006_plus_order_quotes.sql'):
   self.db.executescript((ROOT/'migrations'/name).read_text())
  self.db.execute("INSERT INTO plus_customers(id,identity_subject) VALUES('customer_12345678','subject_12345678')")
  self.db.execute("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status) VALUES('order_12345678','customer_12345678','KIN',16500,'ZAR','pending')")
  self.db.commit()
 def run_batch(self,subscription_id='subscription_12345678',existing=False):
  c=self.db
  try:
   c.execute('BEGIN')
   c.execute("INSERT INTO plus_payment_events(id,order_id,provider,provider_event_reference,event_type,verified_at) SELECT 'payfast_provider_12345678',id,'PayFast','provider_12345678','COMPLETE','2026-11-22T12:00:00.000Z' FROM plus_orders WHERE id='order_12345678' AND customer_id='customer_12345678' AND status='pending'")
   c.execute("UPDATE plus_orders SET status='paid',payment_reference='provider_12345678' WHERE id='order_12345678' AND customer_id='customer_12345678' AND status='pending'")
   if existing:
    c.execute("UPDATE plus_subscriptions SET status='active',current_period_end='2026-12-22T12:00:00.000Z' WHERE id=? AND customer_id='customer_12345678' AND status='active' AND current_period_end='2026-12-01T12:00:00.000Z'",(subscription_id,))
   else:
    c.execute("INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) SELECT ?,'customer_12345678','KIN','active','2026-12-22T12:00:00.000Z' WHERE EXISTS (SELECT 1 FROM plus_customers WHERE id='customer_12345678')",(subscription_id,))
   c.execute("""INSERT INTO plus_payment_reconciliations(order_id,payment_reference,verified_at,verification_method,amount_minor,currency)
    VALUES(CASE WHEN changes()=1 AND EXISTS(SELECT 1 FROM plus_orders WHERE id='order_12345678' AND status='paid' AND payment_reference='provider_12345678')
    AND EXISTS(SELECT 1 FROM plus_payment_events WHERE order_id='order_12345678' AND provider_event_reference='provider_12345678' AND event_type='COMPLETE')
    AND EXISTS(SELECT 1 FROM plus_subscriptions WHERE id=? AND customer_id='customer_12345678' AND status='active' AND current_period_end='2026-12-22T12:00:00.000Z')
    THEN 'order_12345678' ELSE NULL END,'provider_12345678','2026-11-22T12:00:00.000Z','payfast_itn_and_server_validation',16500,'ZAR')""",(subscription_id,))
   c.commit()
   return True
  except sqlite3.IntegrityError:
   c.rollback()
   return False
 def counts(self):
  return [self.db.execute('SELECT COUNT(*) FROM '+table).fetchone()[0] for table in ('plus_payment_events','plus_payment_reconciliations','plus_subscriptions')]
 def test_successful_new_subscription(self):
  self.assertTrue(self.run_batch())
  self.assertEqual(self.counts(),[1,1,1])
  self.assertEqual(self.db.execute("SELECT status FROM plus_orders WHERE id='order_12345678'").fetchone()[0],'paid')
 def test_zero_row_subscription_update_rolls_back(self):
  self.db.execute("INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES('subscription_12345678','customer_12345678','KIN','active','2026-12-01T12:00:00.000Z')")
  self.db.commit()
  self.assertFalse(self.run_batch(subscription_id='subscription_WRONG123',existing=True))
  self.assertEqual(self.counts(),[0,0,1])
  self.assertEqual(self.db.execute("SELECT status FROM plus_orders WHERE id='order_12345678'").fetchone()[0],'pending')
 def test_duplicate_provider_event_rolls_back(self):
  self.assertTrue(self.run_batch())
  self.assertFalse(self.run_batch())
  self.assertEqual(self.counts(),[1,1,1])
 def test_duplicate_subscription_id_rolls_back(self):
  self.db.execute("INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES('subscription_12345678','customer_12345678','KIN','active','2026-12-01T12:00:00.000Z')")
  self.db.commit()
  self.assertFalse(self.run_batch())
  self.assertEqual(self.counts(),[0,0,1])
if __name__=='__main__':unittest.main()
