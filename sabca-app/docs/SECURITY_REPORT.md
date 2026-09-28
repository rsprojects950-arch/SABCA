# SABCA Application: Security Audit & Hardening Report (March 2026)

This document summarizes the cybersecurity audit findings and the proposed "Security Hardening" roadmap for the SABCA Mobile Application.

---

## 🛡️ Current Security Posture
The application uses a robust base (Expo + Supabase RLS), but custom features for member identification and authentication introduce significant risks.

### 🔴 High-Priority Issues
1. **QR Code Forgery**:
   - **Finding**: Digital ID QR codes are plain-text strings.
   - **Risk**: Members can easily generate fake IDs using free online QR tools.
2. **Account Enumeration (Phone Lookup)**:
   - **Finding**: The public `get_email_by_phone` RPC allows anyone to discover registered emails by phone number.
   - **Risk**: Privacy violation and targeted phishing/hacking.

### 🟡 Medium-Priority Issues
1. **Insecure Biometric Fallback**:
   - **Finding**: User passwords are stored in `SecureStore` to enable "Quick Login."
   - **Risk**: Although encrypted, storing raw passwords locally is a security anti-pattern (susceptible to root/jailbreak extraction).
2. **Data Over-fetching**:
   - **Finding**: Admin/Member queries often use `.select('*')`.
   - **Risk**: Increases the impact of any misconfigured RLS policy by leaking all internal user metadata.

---

## 🛠️ Hardening Roadmap (Halted - Pending Implementation)

| Phase | Task | Details |
| :--- | :--- | :--- |
| **P1** | **Digital ID Signing** | Incorporate HMAC digital signatures into QR codes. Add an `/admin/verify` scanner. |
| **P2** | **Auth Privacy** | Deprecate `get_email_by_phone`. Use a single-step secure login RPC. |
| **P3** | **Token-Based Auth** | Switch biometric auth to use **Refresh Tokens** instead of stored passwords. |
| **P4** | **Data Minimization** | Audit and optimize all `.select('*')` calls to use explicit column lists. |

---

## 📋 Security Checklist for Developers
- [ ] Never create public RPCs that return sensitive PII (Email, Phone) without an auth check.
- [ ] Avoid `select('*')` on the `profiles` table.
- [ ] Ensure all "Deleted" or "Revoked" members have their sessions cleared in real-time.
- [ ] Use HMAC or similar for any offline-verifiable identification.

**Status**: *Analysis Complete. Implementation Halted by User.*
