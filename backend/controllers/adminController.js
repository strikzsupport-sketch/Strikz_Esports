const { models, nextNumberId, clean } = require('../config/db');

// ==========================================
// SECURITY: Field whitelisting helpers
// ==========================================

/**
 * Pick only allowed fields from an object (prevents mass assignment / prototype pollution).
 */
const pick = (obj, allowedFields) => {
    const result = {};
    allowedFields.forEach((key) => {
        if (obj[key] !== undefined) result[key] = obj[key];
    });
    return result;
};

const TOURNAMENT_FIELDS = ['name', 'game', 'mode', 'category', 'prizePool', 'startDate', 'regCloseDate', 'status', 'rules', 'ruleBook', 'soloRegistrationEnabled', 'description', 'image', 'featured'];
const NEWS_FIELDS = ['title', 'tag', 'summary', 'content', 'image', 'contentType', 'redirectLink'];
const GALLERY_FIELDS = ['title', 'url', 'type'];
const ROSTER_FIELDS = ['tag', 'fullName', 'role', 'team', 'avatar', 'image', 'bio', 'stats', 'socials', 'kd', 'hs', 'matches', 'winRate', 'twitter', 'youtube', 'instagram', 'rank'];
const SPONSOR_FIELDS = ['name', 'logo', 'tier', 'website', 'description'];
const WINNER_FIELDS = ['teamName', 'event', 'date', 'prize', 'tier', 'image', 'placement', 'title', 'reward', 'details'];
const SOCIAL_FIELDS = ['platform', 'author', 'authorAvatar', 'content', 'date', 'link', 'mediaUrl'];
const MANAGEMENT_FIELDS = ['name', 'role', 'image', 'bio', 'instagram', 'youtube'];
const SETTINGS_FIELDS = ['discordLink', 'instagramLink', 'youtubeLink', 'twitterLink', 'announcementBanner', 'announcementActive', 'maintenanceMode', 'contactEmail', 'partnerEmail', 'showKd', 'showHs', 'showMatches', 'showWinRate', 'showRank', 'supportEmail', 'address'];

// ==========================================
// AUDIT LOGGING
// ==========================================

const logAdminAction = async (req, action, details) => {
    try {
        await models.AuditLog.create({
            id: await nextNumberId(models.AuditLog),
            admin_id: req.user ? req.user.id : null,
            action,
            details: JSON.stringify(details),
            ip_address: req.ip || req.headers['x-forwarded-for'] || 'unknown'
        });
    } catch (err) {
        console.error('Audit Log Error:', err.message);
    }
};

const updateById = async (Model, id, data) => Model.updateOne({ id: Number.isNaN(Number(id)) ? id : Number(id) }, { $set: data });
const deleteById = async (Model, id) => Model.deleteOne({ id: Number.isNaN(Number(id)) ? id : Number(id) });

// ==========================================
// STATS
// ==========================================

const getStats = async (req, res, next) => {
    try {
        const [totalReg, pendingReg, approvedReg, activeTourneys, openTickets, registrations, tournaments] = await Promise.all([
            models.Registration.countDocuments(),
            models.Registration.countDocuments({ status: 'Pending' }),
            models.Registration.countDocuments({ status: 'Approved' }),
            models.Tournament.countDocuments({ status: 'Open' }),
            models.ChatbotTicket.countDocuments({ status: 'Pending' }),
            models.Registration.find().select('tournament_id').lean(),
            models.Tournament.find().select('id name').lean()
        ]);

        const names = new Map(tournaments.map((t) => [t.id, t.name]));
        const distribution = {};
        registrations.forEach((reg) => {
            const name = names.get(reg.tournament_id) || reg.tournament_id;
            distribution[name] = (distribution[name] || 0) + 1;
        });

        res.json({ success: true, stats: { totalReg, pendingReg, approvedReg, activeTourneys, openTickets, distribution } });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// REGISTRATIONS — Fixed N+1 query
// ==========================================

const getRegistrations = async (req, res, next) => {
    try {
        const registrations = await models.Registration.find().sort({ created_at: -1 }).lean();

        if (registrations.length === 0) {
            return res.json({ success: true, registrations: [] });
        }

        // Batch fetch tournaments and players in 2 queries instead of N+1
        const tournamentIds = [...new Set(registrations.map((r) => r.tournament_id))];
        const registrationIds = registrations.map((r) => r.id);

        const [tournaments, allPlayers] = await Promise.all([
            models.Tournament.find({ id: { $in: tournamentIds } }).select('id name').lean(),
            models.RegistrationPlayer.find({ registration_id: { $in: registrationIds } }).lean()
        ]);

        const tournamentMap = new Map(tournaments.map((t) => [t.id, t.name]));
        const playersMap = new Map();
        allPlayers.forEach((p) => {
            if (!playersMap.has(p.registration_id)) playersMap.set(p.registration_id, []);
            playersMap.get(p.registration_id).push(p);
        });

        const enriched = registrations.map((reg) => {
            const players = reg.type !== 'Solo' ? (playersMap.get(reg.id) || []) : [];
            return {
                ...clean(reg),
                tournamentName: tournamentMap.get(reg.tournament_id) || '',
                tournamentId: reg.tournament_id,
                submissionDate: reg.submission_date,
                players: players.map((p) => ({
                    ...clean(p),
                    gameUid: p.game_uid,
                    realName: p.real_name,
                    confirmed: p.confirmed === true
                }))
            };
        });

        res.json({ success: true, registrations: enriched });
    } catch (err) {
        next(err);
    }
};

const updateRegistrationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
            res.status(400);
            return next(new Error('Invalid verification status value'));
        }

        let stage = 1;
        if (status === 'Approved') stage = 3;
        if (status === 'Pending') {
            const players = await models.RegistrationPlayer.find({ registration_id: id }).select('confirmed').lean();
            stage = players.length > 0 && players.every((p) => p.confirmed === true) ? 2 : 1;
        }

        const result = await models.Registration.updateOne({ id }, { $set: { status, stage } });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Registration ticket not found'));
        }

        try {
            const emailService = require('../utils/emailService');
            await emailService.notifyRegistrationStatusChange(id, status);
        } catch (emailErr) {
            console.error('Failed to notify team of status update:', emailErr.message);
        }

        await logAdminAction(req, 'UPDATE_REGISTRATION_STATUS', { id, status, stage });
        res.json({ success: true, message: `Registration ticket status updated to: ${status} (Stage ${stage})` });
    } catch (err) {
        next(err);
    }
};

const deleteRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await models.Registration.deleteOne({ id });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Registration ticket not found'));
        }
        await models.RegistrationPlayer.deleteMany({ registration_id: id });
        await logAdminAction(req, 'DELETE_REGISTRATION', { id });
        res.json({ success: true, message: 'Registration ticket purged from terminal database' });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// TOURNAMENTS — Field whitelisted
// ==========================================

const createTournament = async (req, res, next) => {
    try {
        const data = pick(req.body, TOURNAMENT_FIELDS);
        const { id: bodyId, name, game, mode, category, prizePool, startDate, regCloseDate } = { ...req.body };

        let tourneyId = bodyId;
        if (!tourneyId && name) {
            tourneyId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let exists = await models.Tournament.exists({ id: tourneyId });
            while (exists) {
                tourneyId = `${tourneyId}-${Math.floor(100 + Math.random() * 900)}`;
                exists = await models.Tournament.exists({ id: tourneyId });
            }
        }

        if (!tourneyId || !name || !game || !mode || !category || !prizePool || !startDate || !regCloseDate) {
            res.status(400);
            return next(new Error('Please fill in all core tournament properties'));
        }

        await models.Tournament.create({
            id: tourneyId,
            ...data,
            soloRegistrationEnabled: !!data.soloRegistrationEnabled,
            featured: !!data.featured,
            status: 'Open'
        });
        await logAdminAction(req, 'CREATE_TOURNAMENT', { id: tourneyId, name });
        res.status(201).json({ success: true, message: 'Tournament arena initialized successfully' });
    } catch (err) {
        next(err);
    }
};

const updateTournament = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = pick(req.body, TOURNAMENT_FIELDS);
        data.soloRegistrationEnabled = !!data.soloRegistrationEnabled;
        data.featured = !!data.featured;
        const result = await models.Tournament.updateOne({ id }, { $set: data });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Tournament arena not found'));
        }
        await logAdminAction(req, 'UPDATE_TOURNAMENT', { id, name: data.name });
        res.json({ success: true, message: 'Tournament configurations updated' });
    } catch (err) {
        next(err);
    }
};

const deleteTournament = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await models.Tournament.deleteOne({ id });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Tournament arena not found'));
        }
        await logAdminAction(req, 'DELETE_TOURNAMENT', { id });
        res.json({ success: true, message: 'Tournament arena deleted' });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// NEWS — Field whitelisted
// ==========================================

const createNews = async (req, res, next) => {
    try {
        const data = pick(req.body, NEWS_FIELDS);
        const id = 'news-' + Date.now();
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        await models.News.create({ id, date, ...data, redirectLink: data.redirectLink || '' });
        await logAdminAction(req, 'CREATE_NEWS', { id, title: data.title });
        res.status(201).json({ success: true, message: 'News dispatch posted' });
    } catch (err) { next(err); }
};

const updateNews = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = pick(req.body, NEWS_FIELDS);
        const result = await models.News.updateOne({ id }, { $set: { ...data, redirectLink: data.redirectLink || '' } });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('News item not found'));
        }
        await logAdminAction(req, 'UPDATE_NEWS', { id, title: data.title });
        res.json({ success: true, message: 'News dispatch updated' });
    } catch (err) { next(err); }
};

const deleteNews = async (req, res, next) => {
    try {
        const result = await models.News.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('News item not found'));
        }
        await logAdminAction(req, 'DELETE_NEWS', { id: req.params.id });
        res.json({ success: true, message: 'News dispatch deleted' });
    } catch (err) { next(err); }
};

// ==========================================
// GALLERY — Field whitelisted
// ==========================================

const createGallery = async (req, res, next) => {
    try {
        const data = pick(req.body, GALLERY_FIELDS);
        await models.Gallery.create({ id: await nextNumberId(models.Gallery), type: data.type || 'image', title: data.title, url: data.url });
        await logAdminAction(req, 'CREATE_GALLERY', { title: data.title, url: data.url });
        res.status(201).json({ success: true, message: 'Gallery media added' });
    } catch (err) { next(err); }
};

const deleteGallery = async (req, res, next) => {
    try {
        const result = await deleteById(models.Gallery, req.params.id);
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Gallery item not found'));
        }
        await logAdminAction(req, 'DELETE_GALLERY', { id: req.params.id });
        res.json({ success: true, message: 'Gallery item removed' });
    } catch (err) { next(err); }
};

// ==========================================
// ROSTER — Field whitelisted
// ==========================================

const createRoster = async (req, res, next) => {
    try {
        const data = pick(req.body, ROSTER_FIELDS);
        const flatStats = data.stats || {};
        const flatSocials = data.socials || {};

        const mergedData = {
            ...data,
            avatar: data.avatar || data.image,
            image: data.image || data.avatar,
            kd: data.kd || flatStats.kd || 'N/A',
            hs: data.hs || flatStats.hs || 'N/A',
            matches: data.matches || flatStats.matches || 'N/A',
            winRate: data.winRate || flatStats.winRate || 'N/A',
            rank: data.rank || flatStats.rank || 'N/A',
            twitter: data.twitter || flatSocials.twitter || '#',
            youtube: data.youtube || flatSocials.youtube || '#',
            instagram: data.instagram || flatSocials.instagram || '#',
            stats: {
                kd: flatStats.kd || data.kd || 'N/A',
                hs: flatStats.hs || data.hs || 'N/A',
                matches: flatStats.matches || data.matches || 'N/A',
                winRate: flatStats.winRate || data.winRate || 'N/A',
                rank: flatStats.rank || data.rank || 'N/A'
            },
            socials: {
                twitter: flatSocials.twitter || data.twitter || '#',
                youtube: flatSocials.youtube || data.youtube || '#',
                instagram: flatSocials.instagram || data.instagram || '#'
            }
        };

        await models.Roster.create({ ...mergedData, id: data.tag });
        await logAdminAction(req, 'CREATE_ROSTER', { tag: data.tag, fullName: data.fullName });
        res.status(201).json({ success: true, message: 'Official roster player registered' });
    } catch (err) { next(err); }
};

const updateRoster = async (req, res, next) => {
    try {
        const data = pick(req.body, ROSTER_FIELDS);
        const oldTag = req.params.tag;
        const newTag = data.tag || oldTag;

        if (newTag !== oldTag) {
            const duplicate = await models.Roster.exists({ tag: newTag });
            if (duplicate) {
                res.status(400);
                return next(new Error('A player with this new Gamer Tag already exists'));
            }
        }

        const flatStats = data.stats || {};
        const flatSocials = data.socials || {};

        const mergedData = {
            ...data,
            id: newTag,
            tag: newTag,
            avatar: data.avatar || data.image,
            image: data.image || data.avatar,
            kd: data.kd || flatStats.kd || 'N/A',
            hs: data.hs || flatStats.hs || 'N/A',
            matches: data.matches || flatStats.matches || 'N/A',
            winRate: data.winRate || flatStats.winRate || 'N/A',
            rank: data.rank || flatStats.rank || 'N/A',
            twitter: data.twitter || flatSocials.twitter || '#',
            youtube: data.youtube || flatSocials.youtube || '#',
            instagram: data.instagram || flatSocials.instagram || '#',
            stats: {
                kd: flatStats.kd || data.kd || 'N/A',
                hs: flatStats.hs || data.hs || 'N/A',
                matches: flatStats.matches || data.matches || 'N/A',
                winRate: flatStats.winRate || data.winRate || 'N/A',
                rank: flatStats.rank || data.rank || 'N/A'
            },
            socials: {
                twitter: flatSocials.twitter || data.twitter || '#',
                youtube: flatSocials.youtube || data.youtube || '#',
                instagram: flatSocials.instagram || data.instagram || '#'
            }
        };

        const result = await models.Roster.updateOne(
            { tag: oldTag },
            { $set: mergedData }
        );
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Roster player tag not found'));
        }
        await logAdminAction(req, 'UPDATE_ROSTER', { tag: oldTag, newTag, fullName: data.fullName });
        res.json({ success: true, message: 'Roster player details updated' });
    } catch (err) { next(err); }
};

const deleteRoster = async (req, res, next) => {
    try {
        const result = await models.Roster.deleteOne({ tag: req.params.tag });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Roster player tag not found'));
        }
        await logAdminAction(req, 'DELETE_ROSTER', { tag: req.params.tag });
        res.json({ success: true, message: 'Roster player details deleted' });
    } catch (err) { next(err); }
};

// ==========================================
// SPONSORS — Field whitelisted
// ==========================================

const createSponsor = async (req, res, next) => {
    try {
        const data = pick(req.body, SPONSOR_FIELDS);
        await models.Sponsor.create({ id: await nextNumberId(models.Sponsor), ...data });
        await logAdminAction(req, 'CREATE_SPONSOR', { name: data.name, tier: data.tier });
        res.status(201).json({ success: true, message: 'Sponsor catalog updated' });
    } catch (err) { next(err); }
};

const updateSponsor = async (req, res, next) => {
    try {
        const data = pick(req.body, SPONSOR_FIELDS);
        const result = await updateById(models.Sponsor, req.params.id, data);
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Sponsor not found'));
        }
        await logAdminAction(req, 'UPDATE_SPONSOR', { id: req.params.id, name: data.name });
        res.json({ success: true, message: 'Sponsor catalog updated' });
    } catch (err) { next(err); }
};

const deleteSponsor = async (req, res, next) => {
    try {
        const result = await deleteById(models.Sponsor, req.params.id);
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Sponsor not found'));
        }
        await logAdminAction(req, 'DELETE_SPONSOR', { id: req.params.id });
        res.json({ success: true, message: 'Sponsor removed' });
    } catch (err) { next(err); }
};

// ==========================================
// WINNERS — Field whitelisted
// ==========================================

const createWinner = async (req, res, next) => {
    try {
        const data = pick(req.body, WINNER_FIELDS);
        data.reward = data.reward || data.prize || '';
        data.prize = data.reward;
        data.title = data.title || data.placement || '';
        data.placement = data.title;
        const id = Date.now();
        await models.Achievement.create({ id, ...data, tier: data.tier || 'gold' });
        await logAdminAction(req, 'CREATE_WINNER', { id, teamName: data.teamName, event: data.event });
        res.status(201).json({ success: true, message: 'Winners achievement added' });
    } catch (err) { next(err); }
};

const updateWinner = async (req, res, next) => {
    try {
        const data = pick(req.body, WINNER_FIELDS);
        data.reward = data.reward || data.prize || '';
        data.prize = data.reward;
        data.title = data.title || data.placement || '';
        data.placement = data.title;
        const result = await updateById(models.Achievement, req.params.id, { ...data, tier: data.tier || 'gold' });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Achievement not found'));
        }
        await logAdminAction(req, 'UPDATE_WINNER', { id: req.params.id, teamName: data.teamName });
        res.json({ success: true, message: 'Winners achievement updated' });
    } catch (err) { next(err); }
};

const deleteWinner = async (req, res, next) => {
    try {
        const result = await deleteById(models.Achievement, req.params.id);
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Achievement not found'));
        }
        await logAdminAction(req, 'DELETE_WINNER', { id: req.params.id });
        res.json({ success: true, message: 'Winners achievement removed' });
    } catch (err) { next(err); }
};

// ==========================================
// SOCIAL — Field whitelisted
// ==========================================

const createSocial = async (req, res, next) => {
    try {
        const data = pick(req.body, SOCIAL_FIELDS);
        const id = 'social-' + Date.now();
        await models.SocialFeed.create({ id, ...data, date: data.date || 'Just now', likes: Math.floor(Math.random() * 200) + 10 });
        await logAdminAction(req, 'CREATE_SOCIAL', { id, platform: data.platform, author: data.author });
        res.status(201).json({ success: true, message: 'Social post added' });
    } catch (err) { next(err); }
};

const updateSocial = async (req, res, next) => {
    try {
        const data = pick(req.body, SOCIAL_FIELDS);
        const result = await models.SocialFeed.updateOne({ id: req.params.id }, { $set: data });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Social post not found'));
        }
        await logAdminAction(req, 'UPDATE_SOCIAL', { id: req.params.id, platform: data.platform });
        res.json({ success: true, message: 'Social post updated' });
    } catch (err) { next(err); }
};

const deleteSocial = async (req, res, next) => {
    try {
        const result = await models.SocialFeed.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Social post not found'));
        }
        await logAdminAction(req, 'DELETE_SOCIAL', { id: req.params.id });
        res.json({ success: true, message: 'Social post removed' });
    } catch (err) { next(err); }
};

// ==========================================
// MANAGEMENT — Field whitelisted
// ==========================================

const createManagement = async (req, res, next) => {
    try {
        const data = pick(req.body, MANAGEMENT_FIELDS);
        const id = Date.now();
        await models.Management.create({ id, ...data, instagram: data.instagram || '#', youtube: data.youtube || '#' });
        await logAdminAction(req, 'CREATE_MANAGEMENT', { id, name: data.name, role: data.role });
        res.status(201).json({ success: true, message: 'Management member registered' });
    } catch (err) { next(err); }
};

const updateManagement = async (req, res, next) => {
    try {
        const data = pick(req.body, MANAGEMENT_FIELDS);
        const result = await updateById(models.Management, req.params.id, { ...data, instagram: data.instagram || '#', youtube: data.youtube || '#' });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Management member not found'));
        }
        await logAdminAction(req, 'UPDATE_MANAGEMENT', { id: req.params.id, name: data.name });
        res.json({ success: true, message: 'Management details updated' });
    } catch (err) { next(err); }
};

const deleteManagement = async (req, res, next) => {
    try {
        const result = await deleteById(models.Management, req.params.id);
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Management member not found'));
        }
        await logAdminAction(req, 'DELETE_MANAGEMENT', { id: req.params.id });
        res.json({ success: true, message: 'Management member removed' });
    } catch (err) { next(err); }
};

// ==========================================
// SETTINGS — Field whitelisted
// ==========================================

const updateSettings = async (req, res, next) => {
    try {
        const data = pick(req.body, SETTINGS_FIELDS);
        if (data.supportEmail && !data.contactEmail) {
            data.contactEmail = data.supportEmail;
        }
        if (data.contactEmail && !data.supportEmail) {
            data.supportEmail = data.contactEmail;
        }
        await models.Setting.updateOne({ id: 1 }, { $set: data }, { upsert: true });
        await logAdminAction(req, 'UPDATE_SETTINGS', { fields: Object.keys(data) });
        res.json({ success: true, message: 'Global website configurations updated' });
    } catch (err) { next(err); }
};

// ==========================================
// TICKETS
// ==========================================

const getTickets = async (req, res, next) => {
    try {
        const tickets = await models.ChatbotTicket.find().sort({ created_at: -1 }).lean();
        res.json({ success: true, tickets: tickets.map(clean) });
    } catch (err) { next(err); }
};

const resolveTicket = async (req, res, next) => {
    try {
        const result = await models.ChatbotTicket.updateOne({ id: req.params.id }, { $set: { status: 'Resolved' } });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Support ticket code not found'));
        }
        await logAdminAction(req, 'RESOLVE_TICKET', { id: req.params.id });
        res.json({ success: true, message: 'Support ticket resolved and archived' });
    } catch (err) { next(err); }
};

// ==========================================
// USER ACCOUNT MANAGEMENT
// ==========================================

const getAllUsers = async (req, res, next) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const limit  = Math.min(100, parseInt(req.query.limit) || 50);
        const search = req.query.search ? req.query.search.trim().slice(0, 50) : '';

        const filter = search
            ? { $or: [
                { username: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
                { email:    { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
                { uid:      { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
              ] }
            : {};

        const [users, total] = await Promise.all([
            models.User.find(filter)
                .select('-password_hash -reset_token -reset_token_expiry -google_id')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            models.User.countDocuments(filter)
        ]);

        res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

const verifyUser = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);
        const user = await models.User.findOne({ id: userId });
        if (!user) { res.status(404); return next(new Error('User not found')); }
        if (user.role === 'admin') { res.status(403); return next(new Error('Cannot modify admin accounts')); }
        await models.User.updateOne({ id: userId }, { $set: { isVerified: true, status: 'active' } });
        await logAdminAction(req, 'VERIFY_USER', { userId, username: user.username });
        res.json({ success: true, message: `Account "${user.username}" verified successfully.` });
    } catch (err) { next(err); }
};

const suspendUser = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);
        const user = await models.User.findOne({ id: userId });
        if (!user) { res.status(404); return next(new Error('User not found')); }
        if (user.role === 'admin') { res.status(403); return next(new Error('Cannot suspend admin accounts')); }
        const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
        await models.User.updateOne({ id: userId }, { $set: { status: newStatus } });
        await logAdminAction(req, 'SUSPEND_USER', { userId, username: user.username, newStatus });
        res.json({
            success: true,
            message: `Account "${user.username}" ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully.`,
            status: newStatus
        });
    } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);
        const user = await models.User.findOne({ id: userId });
        if (!user) { res.status(404); return next(new Error('User not found')); }
        if (user.role === 'admin') { res.status(403); return next(new Error('Cannot delete admin accounts')); }
        await models.User.deleteOne({ id: userId });
        await logAdminAction(req, 'DELETE_USER', { userId, username: user.username, email: user.email });
        res.json({ success: true, message: `Account "${user.username}" permanently deleted.` });
    } catch (err) { next(err); }
};

// ==========================================
// DATABASE EXPLORER
// ==========================================

const getCollections = async (req, res, next) => {
    try {
        const collections = Object.keys(models);
        const counts = {};
        for (const col of collections) {
            counts[col] = await models[col].countDocuments();
        }
        res.json({ success: true, collections, counts });
    } catch (err) { next(err); }
};

const getCollectionDocs = async (req, res, next) => {
    try {
        const { name } = req.params;
        const Model = models[name];
        if (!Model) {
            res.status(404);
            return next(new Error('Collection model not found'));
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const projection = name === 'UploadedFile' ? { data: 0 } : {};

        const total = await Model.countDocuments();
        const docs = await Model.find({}, projection).skip(skip).limit(limit).lean();

        res.json({
            success: true,
            total,
            page,
            pages: Math.ceil(total / limit),
            docs
        });
    } catch (err) { next(err); }
};

const updateCollectionDoc = async (req, res, next) => {
    try {
        const { name, id } = req.params;
        const Model = models[name];
        if (!Model) {
            res.status(404);
            return next(new Error('Collection model not found'));
        }

        let query = { id };
        if (id.match(/^[0-9a-fA-F]{24}$/) && !Model.schema.paths.id) {
            query = { _id: id };
        } else {
            const idType = Model.schema.paths.id ? Model.schema.paths.id.instance : null;
            if (idType === 'Number') {
                query = { id: Number(id) };
            }
        }

        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.__v;
        delete updateData.id;

        const result = await Model.updateOne(query, { $set: updateData });
        if (result.matchedCount === 0) {
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                const altResult = await Model.updateOne({ _id: id }, { $set: updateData });
                if (altResult.matchedCount === 0) {
                    res.status(404);
                    return next(new Error('Document not found'));
                }
            } else {
                res.status(404);
                return next(new Error('Document not found'));
            }
        }

        await logAdminAction(req, 'DB_EXPLORER_UPDATE', { collection: name, docId: id });
        res.json({ success: true, message: 'Document updated successfully' });
    } catch (err) { next(err); }
};

const deleteCollectionDoc = async (req, res, next) => {
    try {
        const { name, id } = req.params;
        const Model = models[name];
        if (!Model) {
            res.status(404);
            return next(new Error('Collection model not found'));
        }

        let query = { id };
        if (id.match(/^[0-9a-fA-F]{24}$/) && !Model.schema.paths.id) {
            query = { _id: id };
        } else {
            const idType = Model.schema.paths.id ? Model.schema.paths.id.instance : null;
            if (idType === 'Number') {
                query = { id: Number(id) };
            }
        }

        let result = await Model.deleteOne(query);
        if (result.deletedCount === 0) {
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                result = await Model.deleteOne({ _id: id });
                if (result.deletedCount === 0) {
                    res.status(404);
                    return next(new Error('Document not found'));
                }
            } else {
                res.status(404);
                return next(new Error('Document not found'));
            }
        }

        await logAdminAction(req, 'DB_EXPLORER_DELETE', { collection: name, docId: id });
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err) { next(err); }
};

module.exports = {
    getStats,
    getRegistrations,
    updateRegistrationStatus,
    deleteRegistration,
    createTournament,
    updateTournament,
    deleteTournament,
    createNews,
    updateNews,
    deleteNews,
    createGallery,
    deleteGallery,
    createRoster,
    updateRoster,
    deleteRoster,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    createWinner,
    updateWinner,
    deleteWinner,
    createSocial,
    updateSocial,
    deleteSocial,
    createManagement,
    updateManagement,
    deleteManagement,
    updateSettings,
    getTickets,
    resolveTicket,
    getAllUsers,
    verifyUser,
    suspendUser,
    deleteUser,
    getCollections,
    getCollectionDocs,
    updateCollectionDoc,
    deleteCollectionDoc
};
