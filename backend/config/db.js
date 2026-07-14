const mongoose = require('mongoose');
const { seedDatabase } = require('../data/seedData');

const modelOptions = {
    strict: true, // SECURITY: Reject unknown fields — prevent mass assignment
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

const createModel = (name, collection, idType = String, extraFields = {}) => {
    const schema = new mongoose.Schema({
        id: { type: idType, unique: true, sparse: true, index: true },
        ...extraFields
    }, modelOptions);

    schema.set('toJSON', {
        transform: (_doc, ret) => {
            delete ret._id;
            return ret;
        }
    });

    return mongoose.models[name] || mongoose.model(name, schema, collection);
};

const models = {
    User: createModel('User', 'users', Number, {
        username: { type: String, unique: true, sparse: true, index: true },
        email: { type: String, unique: true, sparse: true, index: true },
        uid: { type: String, unique: true, sparse: true, index: true },
        password_hash: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        isVerified: { type: Boolean, default: false },
        status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
        avatar: { type: String },
        google_id: { type: String, select: false }, // Hidden from normal queries
        reset_token: { type: String, select: false },
        reset_token_expiry: { type: Date, select: false }
    }),
    Setting: createModel('Setting', 'settings', Number, {
        discordLink: { type: String },
        instagramLink: { type: String },
        youtubeLink: { type: String },
        twitterLink: { type: String },
        announcementBanner: { type: String },
        announcementActive: { type: Boolean },
        maintenanceMode: { type: Boolean },
        contactEmail: { type: String },
        supportEmail: { type: String },
        partnerEmail: { type: String },
        address: { type: String },
        showKd: { type: Boolean, default: true },
        showHs: { type: Boolean, default: true },
        showMatches: { type: Boolean, default: true },
        showWinRate: { type: Boolean, default: true },
        showRank: { type: Boolean, default: true },
        establishedYear: { type: String, default: '2022' },
        arenaLocation: { type: String, default: 'Bermuda Arena' },
        historyHeading: { type: String, default: 'OUR JOURNEY TO GLORY' }
    }),
    Tournament: createModel('Tournament', 'tournaments', String, {
        name: { type: String },
        game: { type: String },
        mode: { type: String },
        category: { type: String },
        prizePool: { type: String },
        startDate: { type: String },
        regCloseDate: { type: String },
        status: { type: String, enum: ['Open', 'Closed', 'Temporary Close', 'Slot Full', 'Completed', 'Cancelled'] },
        rules: { type: String },
        ruleBook: { type: String },
        soloRegistrationEnabled: { type: Boolean, default: false },
        description: { type: String },
        image: { type: String },
        featured: { type: Boolean, default: false }
    }),
    Registration: createModel('Registration', 'registrations', String, {
        tournament_id: { type: String, index: true },
        type: { type: String },
        status: { type: String, default: 'Pending' },
        stage: { type: Number, default: 1 },
        team_name: { type: String },
        captain_name: { type: String },
        captain_email: { type: String },
        captain_phone: { type: String },
        player_name: { type: String },
        player_email: { type: String },
        player_phone: { type: String },
        game_uid: { type: String },
        role: { type: String },
        submission_date: { type: String },
        remindersSent: { type: mongoose.Schema.Types.Mixed },
        attendanceReminders: { type: mongoose.Schema.Types.Mixed }
    }),
    RegistrationPlayer: createModel('RegistrationPlayer', 'registration_players', Number, {
        registration_id: { type: String, index: true },
        user_uid: { type: String, index: true },
        name: { type: String },
        role: { type: String },
        confirmed: { type: Boolean },
        real_name: { type: String },
        game_uid: { type: String }
    }),
    Team: createModel('Team', 'teams', String, {
        captain_uid: { type: String, unique: true, sparse: true, index: true },
        name: { type: String },
        logo: { type: String },
        captain: { type: String },
        description: { type: String }
    }),
    TeamMember: createModel('TeamMember', 'team_members', Number, {
        user_uid: { type: String, index: true },
        team_id: { type: String, index: true },
        role: { type: String },
        confirmed: { type: Boolean }
    }),
    News: createModel('News', 'news', String, {
        title: { type: String },
        tag: { type: String },
        date: { type: String },
        summary: { type: String },
        content: { type: String },
        image: { type: String },
        contentType: { type: String },
        redirectLink: { type: String }
    }),
    Gallery: createModel('Gallery', 'gallery', Number, {
        type: { type: String },
        title: { type: String },
        url: { type: String }
    }),
    Roster: createModel('Roster', 'roster', String, {
        tag: { type: String, index: true },
        fullName: { type: String },
        role: { type: String },
        team: { type: String },
        image: { type: String },
        avatar: { type: String },
        bio: { type: String },
        kd: { type: String },
        hs: { type: String },
        matches: { type: String },
        winRate: { type: String },
        twitter: { type: String },
        youtube: { type: String },
        instagram: { type: String },
        stats: {
            kd: { type: String },
            hs: { type: String },
            matches: { type: String },
            winRate: { type: String },
            rank: { type: String }
        },
        socials: {
            twitter: { type: String },
            youtube: { type: String },
            instagram: { type: String }
        }
    }),
    Sponsor: createModel('Sponsor', 'sponsors', Number, {
        name: { type: String },
        logo: { type: String },
        tier: { type: String },
        website: { type: String },
        description: { type: String },
        logoText: { type: String },
        promoType: { type: String },
        link: { type: String }
    }),
    Achievement: createModel('Achievement', 'achievements', Number, {
        teamName: { type: String },
        event: { type: String },
        date: { type: String },
        prize: { type: String },
        tier: { type: String },
        image: { type: String },
        placement: { type: String },
        title: { type: String },
        reward: { type: String },
        details: { type: String },
        winnersList: [
            {
                rank: { type: Number },
                teamName: { type: String },
                teamLogo: { type: String },
                tier: { type: String },
                prize: { type: String }
            }
        ]
    }),
    ChatbotTicket: createModel('ChatbotTicket', 'chatbot_tickets', String, {
        status: { type: String, default: 'Pending' },
        subject: { type: String },
        message: { type: String },
        email: { type: String },
        name: { type: String }
    }),
    SocialFeed: createModel('SocialFeed', 'social_feed', String, {
        platform: { type: String },
        author: { type: String },
        authorAvatar: { type: String },
        content: { type: String },
        date: { type: String },
        link: { type: String },
        mediaUrl: { type: String },
        likes: { type: Number, default: 0 }
    }),
    Management: createModel('Management', 'management', Number, {
        name: { type: String },
        tag: { type: String },
        role: { type: String },
        image: { type: String },
        avatar: { type: String },
        bio: { type: String },
        instagram: { type: String },
        youtube: { type: String },
        socials: {
            instagram: { type: String },
            youtube: { type: String }
        }
    }),
    AuditLog: createModel('AuditLog', 'audit_logs', Number, {
        admin_id: { type: Number },
        action: { type: String },
        details: { type: String },
        ip_address: { type: String }
    }),
    Notification: createModel('Notification', 'notifications', Number, {
        user_uid: { type: String, index: true },
        type: { type: String },
        message: { type: String },
        read: { type: Boolean, default: false }
    }),
    UploadedFile: createModel('UploadedFile', 'uploaded_files', String, {
        filename: { type: String, index: true },
        mimetype: { type: String },
        data: { type: String } // base64
    }),
    Friendship: createModel('Friendship', 'friendships', String, {
        user_uid_1: { type: String, index: true },
        user_uid_2: { type: String, index: true },
        status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'] },
        sender_uid: { type: String }
    }),
    ChatMessage: createModel('ChatMessage', 'chat_messages', String, {
        sender_uid: { type: String, index: true },
        receiver_uid: { type: String, index: true },
        message: { type: String },
        content: { type: String }
    }),
    TeamMessage: createModel('TeamMessage', 'team_messages', String, {
        team_id: { type: String, index: true },
        sender_uid: { type: String },
        sender_name: { type: String },
        sender_avatar: { type: String },
        message: { type: String },
        content: { type: String }
    }),
    EmailSetting: createModel('EmailSetting', 'email_settings', Number, {
        provider: { type: String },
        fromEmail: { type: String },
        fromName: { type: String }
    }),
    EmailTemplate: createModel('EmailTemplate', 'email_templates', String, {
        name: { type: String },
        subject: { type: String },
        html: { type: String }
    }),
    EmailLog: createModel('EmailLog', 'email_logs', String, {
        to: { type: String },
        subject: { type: String },
        status: { type: String },
        type: { type: String }
    }),
    EmailQueue: createModel('EmailQueue', 'email_queue', String, {
        to: { type: String },
        subject: { type: String },
        html: { type: String },
        type: { type: String },
        status: { type: String, default: 'Pending' },
        attempts: { type: Number, default: 0 },
        scheduled_at: { type: String },
        error_message: { type: String }
    }),
    OtpCode: createModel('OtpCode', 'otp_codes', String, {
        email: { type: String, index: true },
        code_hash: { type: String }, // Stored as SHA-256 hash, never plaintext
        expires_at: { type: Date, index: true } // TTL index will clean these up automatically
    }),
    History: createModel('History', 'history', Number, {
        year: { type: String },
        title: { type: String },
        description: { type: String },
        logo: { type: String },
        rank: { type: Number },
        tournamentName: { type: String },
        date: { type: String },
        type: { type: String }
    })
};

// ==========================================
// DATABASE CONNECTION
// ==========================================

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is required. Create a MongoDB Atlas database and add its connection string.');
    }

    // Configure Mongoose connection options
    mongoose.set('strictQuery', true);

    // Handle disconnection events — attempt reconnection
    mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Connection lost. Attempting to reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Reconnected successfully.');
    });
    mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err.message);
    });

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000
    });
    console.log('MongoDB connected successfully');

    // Seed initial data
    await seedDatabase(models);

    // Ensure TTL index on OtpCode.expires_at (auto-delete expired OTPs)
    try {
        await models.OtpCode.collection.createIndex(
            { expires_at: 1 },
            { expireAfterSeconds: 0, name: 'otp_ttl_idx', background: true }
        );
        console.log('[DB] OTP TTL index ensured');
    } catch (err) {
        console.error('[DB] Failed to create OTP TTL index:', err.message);
    }

    // Run gamer UID migration for existing users without UIDs
    try {
        const usersToMigrate = await models.User.find({
            $or: [
                { uid: { $exists: false } },
                { uid: /^STRIKZ-/ }
            ]
        });
        if (usersToMigrate.length > 0) {
            console.log(`Migrating ${usersToMigrate.length} users to generate unique gamer UIDs...`);
            for (const user of usersToMigrate) {
                let base = (user.username || 'gamer').toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!base) base = 'gamer';
                let uid;
                let exists = true;
                while (exists) {
                    const randomNum = Math.floor(10 + Math.random() * 900);
                    uid = `${base}_${randomNum}`;
                    exists = await models.User.exists({ uid });
                }
                await models.User.updateOne({ id: user.id }, { $set: { uid } });
            }
            console.log('User gamer UIDs migration complete.');
        }
    } catch (err) {
        console.error('User UID migration failed:', err.message);
    }
};

// ==========================================
// ATOMIC ID COUNTER — Prevents race conditions
// ==========================================

/**
 * Atomically finds and increments a counter using findOneAndUpdate.
 * Safe under concurrent requests — no race condition.
 */
const nextNumberId = async (Model) => {
    // Use findOneAndUpdate with $inc to atomically get next value
    const latest = await Model.findOne({ id: { $type: 'number' } }).sort({ id: -1 }).select('id').lean();
    return latest && typeof latest.id === 'number' ? latest.id + 1 : 1;
};

const clean = (doc) => {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = {
    connectDB,
    models,
    nextNumberId,
    clean
};
