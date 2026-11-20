import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path
m=SourceFileLoader('preflight',str(Path(__file__).with_name('check-member-recovery-d1-preflight.py'))).load_module()
class PreflightTest(unittest.TestCase):
 def test_absent_recovery_requires_backup_and_review(self):
  x=m.assess({'members','member_sessions','member_login_limits'})
  self.assertIn('PRECHECK ONLY',x)
  self.assertIn('Backup',x)
 def test_missing_base_fails(self):
  self.assertIn('NO-GO',m.assess({'members'}))
 def test_partial_recovery_fails(self):
  self.assertIn('NO-GO',m.assess({'members','member_sessions','member_login_limits','member_password_resets'}))
 def test_existing_recovery_requires_review(self):
  self.assertIn('REVIEW',m.assess({'members','member_sessions','member_login_limits','member_password_resets','member_password_reset_limits'}))
 def test_d1_result_shapes(self):
  rows=[{'name':'members','type':'table'},{'name':'ignored','type':'index'}]
  self.assertEqual(m.names({'results':rows}),{'members'})
  self.assertEqual(m.names([{'results':rows}]),{'members'})
if __name__=='__main__':unittest.main()
