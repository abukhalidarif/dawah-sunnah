// Security rules test suite verifying Dirty Dozen adversarial payloads against firestore.rules
export const DIRTY_DOZEN_TEST_CASES = [
  { id: 1, name: 'Self-Privilege Escalation on user_roles', target: '/user_roles/attacker', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Shadow Field Injection on users profile', target: '/users/attacker', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Cross-user PII Snooping on users', target: '/users/victim', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Non-staff Question Contact Leak', target: '/question_contacts/q1', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Unverified Email Admin Spoof', target: '/settings/site', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Public Draft Article Read', target: '/articles/draft-1', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Auto-Publish Question Bypass', target: '/questions/q-bypass', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Closed Submission Bypass', target: '/questions/q-closed', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Article View Count Tampering (>+1)', target: '/articles/art-1', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Path ID Poisoning', target: '/articles/bad..id', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Cross-User Bookmark Tampering', target: '/users/victim/bookmarks/b1', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Non-Admin Donation Hijack', target: '/settings/donations', expected: 'PERMISSION_DENIED' }
];
