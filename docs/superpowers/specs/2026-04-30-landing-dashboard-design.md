# Señales CR — Landing + Dashboard Design
**Date:** 2026-04-30  
**Status:** Approved

## Overview

Two deliverables: (1) replace the current landing page with a professional dark-theme design, and (2) build a password-protected admin dashboard at `public/dashboard.html` with CRM, WhatsApp, and Email tabs showing outbound message history.

---

## 1. Landing Page

**File:** `public/index.html`  
**Change:** Replace current content with `LANDING-SENALES-CR-RECREADO.html`.

The new design uses a dark background (`#0f1419`) with yellow accent (`#ffc107`). The contact form connects to the existing `POST /api/leads` endpoint. Form fields: nombre, teléfono, empresa (optional), tipoServicio, ubicación, descripción. The email field remains required for the API.

---

## 2. Dashboard

**File:** `public/dashboard.html`  
A single self-contained HTML file with inline CSS and JS. No framework dependencies.

### 2.1 Authentication

- Login screen shown on load if no valid token in `localStorage`
- `POST /api/auth` with `{ password }` → returns `{ token }` on success, 401 on failure
- Token is `HMAC-SHA256(password + DASHBOARD_SECRET)` — stateless, no DB needed
- Token stored in `localStorage`. Each API call sends `Authorization: Bearer <token>`
- "Cerrar sesión" clears localStorage and reloads

**Env vars required:**
- `DASHBOARD_PASSWORD` — the admin password
- `DASHBOARD_SECRET` — secret for token signing (any random string)

### 2.2 Tab: CRM

- Stats bar: Total leads, Nuevos, Cotizados, Cerrados
- Table: nombre, email, teléfono, tipoServicio, status (dropdown), createdAt
- Status dropdown inline: `new → contacted → quoted → closed`  
- Changing status calls `PUT /api/crm?id=<leadId>` with `{ status }`
- Data: `GET /api/crm` returns all leads sorted by createdAt desc

**Status badges:**
| Value | Label | Color |
|---|---|---|
| new | Nuevo | Blue |
| contacted | Contactado | Yellow |
| quoted | Cotizado | Purple |
| closed | Cerrado ✓ | Green |

### 2.3 Tab: WhatsApp

- Left panel: list of leads that received a WhatsApp message
- Right panel: messages sent to selected lead, in chat bubble format
- Data: `GET /api/messages?type=whatsapp&leadId=<id>`
- Direction shown: only `outbound` for now, UI ready for `inbound` in phase 2
- "Responder" input field visible but disabled with tooltip: "Disponible cuando se apruebe WhatsApp Business"

### 2.4 Tab: Email

- Left panel: folders — Enviados / Todos
- Right panel: list of emails sent to clients with from, subject, date
- Clicking an email shows full HTML content
- Data: `GET /api/messages?type=email`
- Direction shown: only `outbound` for now

---

## 3. API Endpoints

### `POST /api/auth`
```
Request:  { password: string }
Response: { token: string } | 401
```
Verifies password against `DASHBOARD_PASSWORD` env var. Returns HMAC token.

### `GET /api/crm`
```
Headers: Authorization: Bearer <token>
Response: { leads: Lead[] }
```
Returns all leads sorted by createdAt descending.

### `PUT /api/crm`  
```
Headers: Authorization: Bearer <token>
Query:    ?id=<leadId>
Body:     { status: "new"|"contacted"|"quoted"|"closed" }
Response: { success: true }
```

### `GET /api/messages`
```
Headers: Authorization: Bearer <token>
Query:    ?type=whatsapp|email  &leadId=<id> (optional)
Response: { messages: Message[] }
```

### Modified: `POST /api/leads`
After sending WhatsApp and email, save each to `messages` collection.

---

## 4. MongoDB Collections

### `leads` (existing)
```
{ nombre, email, telefono, tipoServicio, status, createdAt }
```

### `messages` (new)
```
{
  leadId:    ObjectId (ref leads),
  leadName:  String,
  leadEmail: String,
  type:      "whatsapp" | "email",
  direction: "outbound",          // "inbound" added in phase 2
  content:   String,
  subject:   String,              // email only
  createdAt: Date
}
```

---

## 5. Vercel Config

No changes to `vercel.json`. New files in `api/` are auto-detected. `public/dashboard.html` is served as static file.

New env vars to add in Vercel dashboard:
- `DASHBOARD_PASSWORD`
- `DASHBOARD_SECRET`

---

## 6. Out of Scope (Phase 2)

- Receiving inbound WhatsApp messages (requires approved WhatsApp Business number)
- Replying to WhatsApp from dashboard (requires Twilio Conversations API)
- Receiving inbound emails (requires SendGrid Inbound Parse + domain config)
- Replying to email from dashboard
- Push notifications for new messages
- Multiple admin users
