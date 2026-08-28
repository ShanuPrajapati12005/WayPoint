import unittest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from db.models import Base, User, Roadmap, QuizAttempt, ProgressEvent, Evidence
from core.auth import get_current_user_id

class TestAuthenticationReconciliation(unittest.TestCase):
    def setUp(self):
        # Set up in-memory SQLite database for safe, isolated testing
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        
    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    @patch('auth.decode_token')
    def test_case_a_existing_uuid_matching_email(self, mock_decode):
        # Setup: seed a user
        user_id = "uuid-case-a"
        email = "case-a@example.com"
        user = User(id=user_id, email=email, password_hash="hash", name="User A", is_onboarded=True)
        self.db.add(user)
        self.db.commit()
        
        # Mock JWT
        mock_decode.return_value = {"sub": user_id, "email": email}
        
        # Test
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        res_id = get_current_user_id(credentials, self.db)
        
        # Assertions
        self.assertEqual(res_id, user_id)
        # Check no new rows created and details remain same
        count = self.db.query(User).count()
        self.assertEqual(count, 1)
        db_user = self.db.query(User).filter(User.id == user_id).first()
        self.assertEqual(db_user.email, email)

    @patch('auth.decode_token')
    def test_case_b_uuid_belongs_to_different_email_conflict(self, mock_decode):
        # Setup: seed a user
        user_id = "uuid-case-b"
        email_in_db = "case-b-original@example.com"
        email_in_jwt = "case-b-conflict@example.com"
        user = User(id=user_id, email=email_in_db, password_hash="hash", name="User B", is_onboarded=True)
        self.db.add(user)
        self.db.commit()
        
        # Mock JWT returning the same UUID but a different email
        mock_decode.return_value = {"sub": user_id, "email": email_in_jwt}
        
        # Test & Assert conflict exception
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(credentials, self.db)
            
        self.assertEqual(context.exception.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("conflict", context.exception.detail.lower())

    @patch('auth.decode_token')
    def test_case_c_uuid_not_found_but_email_exists_reconcile(self, mock_decode):
        # Setup: seed user with old UUID
        old_id = "old-uuid-case-c"
        new_id = "new-uuid-case-c"
        email = "case-c@example.com"
        
        user = User(id=old_id, email=email, password_hash="hash", name="User C", is_onboarded=True)
        self.db.add(user)
        
        # Seed related records referencing old UUID
        roadmap = Roadmap(id="rm-1", user_id=old_id, role_id="java", label="Java Backend", node_map={}, skill_data=[], reasoning={})
        quiz_attempt = QuizAttempt(id="qa-1", user_id=old_id, role_id="java", answers=[])
        progress_event = ProgressEvent(id="pe-1", user_id=old_id, roadmap_id="rm-1", node_key="n1", new_status="completed")
        evidence = Evidence(id="ev-1", user_id=old_id, roadmap_id="rm-1")
        
        self.db.add_all([roadmap, quiz_attempt, progress_event, evidence])
        self.db.commit()
        
        # Mock JWT returning the NEW UUID for the same email
        mock_decode.return_value = {"sub": new_id, "email": email}
        
        # Test
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        res_id = get_current_user_id(credentials, self.db)
        
        # Assertions
        self.assertEqual(res_id, new_id)
        
        # Check user ID was updated and counts are correct
        self.assertEqual(self.db.query(User).count(), 1)
        db_user = self.db.query(User).filter(User.id == new_id).first()
        self.assertIsNotNone(db_user)
        self.assertEqual(db_user.email, email)
        self.assertTrue(db_user.is_onboarded)  # onboarding remains true
        
        # Verify cascades of user_id in all referencing tables
        self.assertEqual(self.db.query(Roadmap).filter(Roadmap.user_id == new_id).count(), 1)
        self.assertEqual(self.db.query(QuizAttempt).filter(QuizAttempt.user_id == new_id).count(), 1)
        self.assertEqual(self.db.query(ProgressEvent).filter(ProgressEvent.user_id == new_id).count(), 1)
        self.assertEqual(self.db.query(Evidence).filter(Evidence.user_id == new_id).count(), 1)
        
        # Verify no old references remain
        self.assertEqual(self.db.query(Roadmap).filter(Roadmap.user_id == old_id).count(), 0)
        self.assertEqual(self.db.query(QuizAttempt).filter(QuizAttempt.user_id == old_id).count(), 0)
        self.assertEqual(self.db.query(ProgressEvent).filter(ProgressEvent.user_id == old_id).count(), 0)
        self.assertEqual(self.db.query(Evidence).filter(Evidence.user_id == old_id).count(), 0)

    @patch('auth.decode_token')
    def test_case_d_completely_new_user(self, mock_decode):
        # Setup
        new_id = "new-uuid-case-d"
        email = "case-d@example.com"
        
        # Mock JWT
        mock_decode.return_value = {"sub": new_id, "email": email}
        
        # Test
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        res_id = get_current_user_id(credentials, self.db)
        
        # Assertions
        self.assertEqual(res_id, new_id)
        self.assertEqual(self.db.query(User).count(), 1)
        db_user = self.db.query(User).filter(User.id == new_id).first()
        self.assertIsNotNone(db_user)
        self.assertEqual(db_user.email, email)
        self.assertFalse(db_user.is_onboarded)

    @patch('auth.decode_token')
    @patch('sqlalchemy.orm.query.Query.update')
    def test_case_e_simulated_failure_rollback(self, mock_update, mock_decode):
        # Setup: seed user with old UUID
        old_id = "old-uuid-case-e"
        new_id = "new-uuid-case-e"
        email = "case-e@example.com"
        
        user = User(id=old_id, email=email, password_hash="hash", name="User E", is_onboarded=True)
        self.db.add(user)
        self.db.commit()
        
        # Mock JWT
        mock_decode.return_value = {"sub": new_id, "email": email}
        
        # Mock updating database queries to fail
        mock_update.side_effect = Exception("Simulated DB Write Failure")
        
        # Test & Assert internal server error
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(credentials, self.db)
            
        self.assertEqual(context.exception.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Reset session and verify NO partial UUID updates exist (rollback succeeded)
        self.db.rollback()
        user_in_db = self.db.query(User).filter(User.email == email).first()
        self.assertEqual(user_in_db.id, old_id)

if __name__ == '__main__':
    unittest.main()
