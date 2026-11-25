# Security Specification — দাওয়াহ ও সুন্নাহ | Dawah & Sunnah

## 1. Data Invariants
1. **Role & Privilege Isolation**: No user may self-assign `super_admin`, `admin`, or `editor` roles in `/user_roles/{userId}` or `/users/{userId}`. Only verified admins (bootstrapped Super Admin `dawah.bd.21@gmail.com` or existing `super_admin`/`admin`) may assign roles; only `super_admin` may assign `super_admin`.
2. **PII Isolation**: User email addresses (`/users/{userId}`) and question submitter contact details (`/question_contacts/{questionId}`) are never stored in public `/questions` or `/articles` documents and are readable only by the document owner or verified admins/staff.
3. **Draft & Pending Content Protection**: Unauthenticated visitors and standard users can only read `articles` with `status == 'published'` and `questions` with `status == 'published'`. Draft articles and pending/rejected questions are accessible only to verified staff (`super_admin`, `admin`, `editor`).
4. **Question Submission Integrity**: Newly submitted public questions must strictly enforce `status == 'pending'`, empty `answerText`, `isFeatured == false`, `viewCount == 0`, and check that `settings/site.questionSubmissionEnabled == true`.
5. **Path & Size Bounds**: Every document ID must match `^[a-zA-Z0-9_\-]+$` (1–128 chars), and all strings/arrays have explicit maximum bounds.
6. **Immutable Ownership & Timestamps**: `createdAt` and `uid` fields are immutable after creation and validated with `request.time`.

## 2. Dirty Dozen Adversarial Payloads
1. **Self-Privilege Escalation**: Creating `/user_roles/{uid}` with `role: "super_admin"` as a regular user -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Profile**: Creating `/users/{uid}` with an extra `isAdmin: true` field -> `PERMISSION_DENIED`.
3. **PII Snooping**: User B attempting `get(/users/userA)` -> `PERMISSION_DENIED`.
4. **Question Contact Leak**: Non-staff user attempting `get(/question_contacts/q1)` -> `PERMISSION_DENIED`.
5. **Unverified Email Admin Spoof**: Token with `email: "dawah.bd.21@gmail.com"` and `email_verified: false` attempting admin write -> `PERMISSION_DENIED`.
6. **Draft Article Read**: Public user attempting to `get` an article with `status: "draft"` -> `PERMISSION_DENIED`.
7. **Auto-Publish Question Bypass**: Public submitter creating `/questions/q99` with `status: "published"` and pre-filled `answerText` -> `PERMISSION_DENIED`.
8. **Closed Submission Bypass**: Submitting a question when `settings/site.questionSubmissionEnabled == false` -> `PERMISSION_DENIED`.
9. **View Count Manipulation**: Public user updating `articles/a1` `title` or setting `viewCount` to `999999` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Creating `/articles/invalid..slash` or a 200-char document ID -> `PERMISSION_DENIED`.
11. **Bookmark Cross-User Tampering**: User B creating `/users/userA/bookmarks/b1` -> `PERMISSION_DENIED`.
12. **Settings Defacement**: Non-admin user updating `/settings/donations` to hijack bKash/bank numbers -> `PERMISSION_DENIED`.
