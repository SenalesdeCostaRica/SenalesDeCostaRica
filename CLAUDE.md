# Señales de Costa Rica — Proyecto

## Qué es este proyecto
Landing page + sistema de captura de leads con dashboard de administración para **Señales de Costa Rica**, empresa de señalización vial, rotulación y seguridad en Costa Rica.

## Stack
- **Frontend:** HTML/CSS/JS vanilla (sin frameworks)
- **Backend:** Node.js 22 (CommonJS) — Vercel Serverless Functions
- **Base de datos:** MongoDB Atlas (Mongoose)
- **Email:** SendGrid
- **WhatsApp:** Twilio (sandbox actualmente — pendiente aprobar WhatsApp Business)
- **Deploy:** Vercel (rama `main` → auto-deploy)
- **Repositorio:** https://github.com/SenalesdeCostaRica/SenalesDeCostaRica.git

## Estructura de archivos
```
public/
  index.html          Landing page (diseño oscuro #0f1419 / amarillo #ffc107)
  dashboard.html      Dashboard admin protegido con contraseña
  logo.jpg            Logo de la empresa

api/
  _db.js              Conexión MongoDB + schemas Lead y Message (privado, no es endpoint)
  _auth.js            Generación y verificación de token HMAC-SHA256 (privado)
  auth.js             POST /api/auth — login con contraseña
  leads.js            POST /api/leads — crea lead + envía email y WhatsApp + guarda mensajes
  crm.js              GET /api/crm — lista leads | PUT /api/crm?id= — cambia estado
  messages.js         GET /api/messages?type=whatsapp|email — historial de mensajes
  dashboard.js        GET /api/dashboard — estadísticas generales (endpoint legacy)

Image/
  SenalesDeCostaRicaLogo.jpg   Logo original (la copia servible está en public/logo.jpg)

docs/superpowers/
  specs/2026-04-30-landing-dashboard-design.md   Spec del diseño aprobado
  plans/2026-04-30-landing-dashboard.md          Plan de implementación ejecutado
```

## Variables de entorno (Vercel)
Todas deben estar en Production + Preview + Development:

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | String de conexión MongoDB Atlas |
| `SENDGRID_API_KEY` | API key de SendGrid |
| `SENDGRID_FROM_EMAIL` | Email remitente (ej: senalesdecostarica@outlook.es) |
| `TWILIO_ACCOUNT_SID` | SID de cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticación Twilio |
| `TWILIO_WHATSAPP_NUMBER` | Número WhatsApp Twilio (ej: +14155238886 en sandbox) |
| `DASHBOARD_PASSWORD` | Contraseña para entrar al dashboard |
| `DASHBOARD_SECRET` | Secret para firmar tokens HMAC |
| `NODE_ENV` | `production` |

## MongoDB — Colecciones

### `leads`
```js
{
  nombre, email, telefono,
  tipoServicio: String,
  status: 'new' | 'contacted' | 'quoted' | 'closed',
  createdAt: Date
}
```

### `messages`
```js
{
  leadId: ObjectId,   // ref leads
  leadName, leadEmail: String,
  type: 'whatsapp' | 'email',
  direction: 'outbound',   // 'inbound' en fase 2
  content: String,
  subject: String,         // solo emails
  createdAt: Date
}
```

## API Endpoints

### `POST /api/leads`
Crea lead, envía email de bienvenida y WhatsApp, guarda ambos en `messages`.
```json
Body: { nombre, email, telefono, tipoServicio }
Response: { success: true, id, mensaje }
```

### `POST /api/auth`
Login del dashboard.
```json
Body: { password }
Response: { token } | 401
```
Token = HMAC-SHA256(password, DASHBOARD_SECRET). Stateless, no expira.

### `GET /api/crm`
Lista todos los leads ordenados por fecha desc.
Header: `Authorization: Bearer <token>`

### `PUT /api/crm?id=<leadId>`
Cambia el status de un lead.
```json
Body: { status: 'new' | 'contacted' | 'quoted' | 'closed' }
```

### `GET /api/messages?type=whatsapp|email&leadId=<id>`
Historial de mensajes enviados. `leadId` es opcional.

## Dashboard
URL: `https://senales-de-costa-rica.vercel.app/dashboard.html`

- Login con `DASHBOARD_PASSWORD`
- Tab **CRM**: tabla de leads con cambio de estado inline
- Tab **WhatsApp**: mensajes enviados agrupados por cliente (responder deshabilitado hasta aprobar WhatsApp Business)
- Tab **Email**: emails enviados con vista de contenido completo

## vercel.json
```json
{
  "version": 2,
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": "public",
  "functions": { "api/*.js": { "maxDuration": 30 } },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

## Node.js
Versión: **22.x** — debe estar seleccionada en Vercel Dashboard → Settings → General → Node.js Version.

## Problemas conocidos y soluciones

### Error "Found invalid Node.js Version"
El runtime de Vercel rechaza la versión. Solución:
1. En Vercel dashboard → Settings → General → Node.js Version → seleccionar 22.x
2. `package.json` debe tener `"engines": { "node": "22.x" }`
3. No fijar versión de runtime en `vercel.json` (usar solo `maxDuration`)

### Error "Unexpected token 'export'"
Los archivos `api/*.js` usan `require/module.exports` (CommonJS). Si aparece este error, verificar que no haya `import/export` en ningún archivo de `api/`.

### WhatsApp timeout (AxiosError timeout 30000ms)
Causa: función serverless retorna respuesta antes de completar llamadas async.
Solución: usar `await Promise.all([...])` antes de `res.json()`. Ya implementado en `api/leads.js`.

### WhatsApp sandbox expirado
El sandbox de Twilio requiere que el destinatario envíe "join <palabra>" al +1 415 523 8886 periódicamente. Para producción, solicitar número WhatsApp Business en Twilio.

### Modelo duplicado en Mongoose (serverless)
Usar siempre `mongoose.models.X || mongoose.model('X', schema)` para evitar error en hot-reload serverless. Ya implementado en `api/_db.js`.

## Fase siguiente (pendiente)
- Webhook Twilio para recibir mensajes WhatsApp entrantes → guardar en `messages` con `direction: 'inbound'`
- Responder WhatsApp desde el dashboard
- SendGrid Inbound Parse para recibir emails
- Responder emails desde el dashboard

## Comandos git
```bash
# El repositorio usa main como rama principal
git add <archivos>
git commit -m "descripción"
git push origin main   # Vercel despliega automáticamente
```
