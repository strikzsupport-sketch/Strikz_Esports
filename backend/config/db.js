const mongoose = require('mongoose');
const { seedDatabase } = require('../data/seedData');

const modelOptions = {
    strict: false,
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
        uid: { type: String, unique: true, sparse: true, index: true }
    }),
    Setting: createModel('Setting', 'settings', Number),
    Tournament: createModel('Tournament', 'tournaments'),
    Registration: createModel('Registration', 'registrations'),
    RegistrationPlayer: createModel('RegistrationPlayer', 'registration_players', Number, {
        registration_id: { type: String, index: true },
        user_uid: { type: String, index: true }
    }),
    Team: createModel('Team', 'teams', String, {
        captain_uid: { type: String, unique: true, sparse: true, index: true }
    }),
    TeamMember: createModel('TeamMember', 'team_members', Number, {
        user_uid: { type: String, index: true },
        team_id: { type: String, index: true }
    }),
    News: createModel('News', 'news'),
    Gallery: createModel('Gallery', 'gallery', Number),
    Roster: createModel('Roster', 'roster'),
    Sponsor: createModel('Sponsor', 'sponsors', Number),
    Achievement: createModel('Achievement', 'achievements', Number),
    ChatbotTicket: createModel('ChatbotTicket', 'chatbot_tickets'),
    SocialFeed: createModel('SocialFeed', 'social_feed'),
    Management: createModel('Management', 'management', Number),
    AuditLog: createModel('AuditLog', 'audit_logs', Number),
    Notification: createModel('Notification', 'notifications', Number, {
        user_uid: { type: String, index: true }
    }),
    UploadedFile: createModel('UploadedFile', 'uploaded_files'),
    Friendship: createModel('Friendship', 'friendships', String, {
        user_uid_1: { type: String, index: true },
        user_uid_2: { type: String, index: true }
    }),
    ChatMessage: createModel('ChatMessage', 'chat_messages', String, {
        sender_uid: { type: String, index: true },
        receiver_uid: { type: String, index: true }
    }),
    TeamMessage: createModel('TeamMessage', 'team_messages', String, {
        team_id: { type: String, index: true }
    }),
    EmailSetting: createModel('EmailSetting', 'email_settings', Number),
    EmailTemplate: createModel('EmailTemplate', 'email_templates'),
    EmailLog: createModel('EmailLog', 'email_logs'),
    EmailQueue: createModel('EmailQueue', 'email_queue'),
    OtpCode: createModel('OtpCode', 'otp_codes', String, {
        email: { type: String, index: true }
    })
};

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is required. Create a MongoDB Atlas database and add its connection string.');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    await seedDatabase(models);

    // Run gamer UID migration for existing users
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

const nextNumberId = async (Model) => {
    const latest = await Model.findOne({ id: { $type: 'number' } }).sort({ id: -1 }).lean();
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
