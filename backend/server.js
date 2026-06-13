const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./config/db');

// Import middlewares
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDir = path.join(__dirname, '../frontend');
const uploadsDir = path.join(__dirname, '../uploads');

// ==========================================
// SECURITY LAYERS & MIDDLEWARES
// ==========================================

// 1. Helmet Security Headers (with CSP configured to not break frontend links)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://*.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://accounts.google.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://api.dicebear.com", "https://upload.wikimedia.org", "http:", "https:"],
            mediaSrc: ["'self'", "https://assets.mixkit.co", "http:", "https:"],
            connectSrc: ["'self'", "http:", "https:", "https://accounts.google.com"],
            frameSrc: ["'self'", "https://accounts.google.com", "https://*.google.com"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// 2. CORS configuration
app.use(cors());

// 3. Body parsers (JSON & urlencoded) with size constraints
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 4. Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per 15 minutes
    message: { success: false, message: 'Too many requests from this terminal IP. Please cooldown and try again later.' }
});
app.use('/api', generalLimiter);

// Stricter rate limits on authentication requests
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Max 30 attempts per 15 mins
    message: { success: false, message: 'Security alert: Too many auth attempts. Please cooldown and try again in 15 minutes.' }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ==========================================
// STATIC ASSETS
// ==========================================

// Serve frontend code without long browser caching so Render deploys update immediately.
app.use('/css', express.static(path.join(frontendDir, 'css'), { maxAge: 0, etag: false }));
app.use('/js', express.static(path.join(frontendDir, 'js'), { maxAge: 0, etag: false }));
app.use('/assets', express.static(path.join(frontendDir, 'assets'), { maxAge: '1d' }));
app.use('/uploads', express.static(uploadsDir));

// ==========================================
// API ROUTING
// ==========================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', tournamentRoutes);
app.use('/api/v1', ticketRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'strikz-esports',
        status: 'online'
    });
});

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Serve the frontend for the Render backend URL and client-side routes.
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
        app.listen(PORT, () => {
            console.log(`STRIKZ ESPORTS ARENA SERVER ONLINE: RUNNING ON PORT ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
        });
    })
    .catch((err) => {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    });
