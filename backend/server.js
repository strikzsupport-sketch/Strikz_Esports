const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./config/db');

// ==========================================
// STARTUP ENVIRONMENT VALIDATION
// ==========================================
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('[FATAL] Server cannot start safely without these variables set.');
    process.exit(1);
}

// Warn if JWT_SECRET looks like the old hardcoded default
if (process.env.JWT_SECRET === 'supersecretcyberpunkgamershieldkey2026') {
    console.error('[FATAL] JWT_SECRET is set to the known insecure default value. Please generate a strong random secret.');
    process.exit(1);
}

// Import middlewares
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const socialRoutes = require('./routes/socialRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDir = path.join(__dirname, '../frontend');
const uploadsDir = path.join(__dirname, '../uploads');

// Enable trust proxy for correct client IP detection behind reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// ==========================================
// SECURITY LAYERS & MIDDLEWARES
// ==========================================

// 1. Helmet Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // NOTE: Inline scripts are loaded from external files — do not use unsafe-inline
            // Google's OAuth library requires its own origin
            scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://accounts.google.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://api.dicebear.com", "https://upload.wikimedia.org", "http:", "https:"],
            mediaSrc: ["'self'", "https://assets.mixkit.co", "blob:", "http:", "https:"],
            connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
            frameSrc: ["'self'", "https://accounts.google.com", "https://*.google.com"],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Add Permissions-Policy header manually (not covered by Helmet by default)
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
});

// 2. CORS — Restricted to known origins only
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:5000',
        'http://localhost:3000',
        'https://www.strikzesports.in',
        'https://strikzesports.in'
    ];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman in dev)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 3. Body parsers (JSON & urlencoded) with size constraints
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 4. Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Reduced from 2000 — stricter general limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP. Please slow down and try again later.' }
});
app.use('/api', generalLimiter);

// Strict rate limit on authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Max 20 attempts per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Security alert: Too many auth attempts. Please wait 15 minutes and try again.' }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// Strictest rate limit on OTP endpoints — prevent brute-force
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Max 10 OTP attempts per 15 mins per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many OTP attempts. Please wait 15 minutes.' }
});
app.use('/api/v1/auth/verify-otp', otpLimiter);
app.use('/api/v1/auth/resend-otp', otpLimiter);

// ==========================================
// STATIC ASSETS
// ==========================================

// Serve frontend CSS/JS with proper cache control using version query strings
app.use('/css', express.static(path.join(frontendDir, 'css'), {
    maxAge: '7d',
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800, must-revalidate');
    }
}));
app.use('/js', express.static(path.join(frontendDir, 'js'), {
    maxAge: '7d',
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800, must-revalidate');
    }
}));
app.use('/assets', express.static(path.join(frontendDir, 'assets'), { maxAge: '7d' }));

// Persistent database-backed uploads interceptor
app.get('/uploads/:filename', async (req, res, next) => {
    try {
        const { models } = require('./config/db');
        const file = await models.UploadedFile.findOne({ filename: req.params.filename }).lean();
        if (file) {
            // Serve SVGs as attachment to prevent inline XSS execution
            const mimeType = file.mimetype || 'image/png';
            if (mimeType.includes('svg')) {
                res.setHeader('Content-Disposition', 'attachment');
                res.setHeader('Content-Type', 'text/plain');
            } else {
                res.setHeader('Content-Type', mimeType);
            }
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            return res.send(Buffer.from(file.data, 'base64'));
        }
        next();
    } catch (err) {
        next();
    }
});

app.use('/uploads', express.static(uploadsDir));

// Serve robots.txt and sitemap.xml
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(
        `User-agent: *\n` +
        `Allow: /\n` +
        `Disallow: /api/\n` +
        `Disallow: /admin\n` +
        `Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`
    );
});

app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pages = ['/', '/#/about', '/#/team', '/#/achievements', '/#/gallery', '/#/news', '/#/sponsors', '/#/partners', '/#/contact', '/#/registration', '/#/history', '/#/earning'];
    const urls = pages.map((p) => `
  <url>
    <loc>${baseUrl}${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('');
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`);
});

// ==========================================
// API ROUTING
// ==========================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', tournamentRoutes);
app.use('/api/v1', ticketRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', socialRoutes);

// Health check — returns minimal info
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Google OAuth redirect POST interceptor for root — use fragment instead of query param to avoid token in server logs
app.post('/', (req, res) => {
    const credential = req.body && req.body.credential;
    if (credential) {
        // Pass via fragment (never reaches server logs) using a short-lived sessionStorage approach
        // The credential is passed to the client-side via a hidden form post redirect
        const safeHtml = `<!DOCTYPE html><html><head><title>Redirecting...</title></head><body>
            <script>
                // Store credential transiently then clear URL
                try { sessionStorage.setItem('_gcred', ${JSON.stringify(credential)}); } catch(e){}
                window.location.replace('/#/');
            </script>
        </body></html>`;
        return res.send(safeHtml);
    }
    res.redirect(303, '/');
});

// Serve the frontend for client-side routes.
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

app.use(errorHandler);

// ==========================================
// INITIALIZE ARENA SERVER
// ==========================================

connectDB()
    .then(() => {
        const { startEmailScheduler } = require('./utils/scheduler');
        startEmailScheduler();
        app.listen(PORT, () => {
            console.log(`STRIKZ ESPORTS ARENA SERVER ONLINE: RUNNING ON PORT ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
        });
    })
    .catch((err) => {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    });
