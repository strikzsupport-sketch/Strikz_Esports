const { models, nextNumberId, clean } = require('../config/db');

const logAdminAction = async (req, action, details) => {
    try {
        await models.AuditLog.create({
            id: await nextNumberId(models.AuditLog),
            admin_id: req.user ? req.user.id : null,
            action,
            details: JSON.stringify(details),
            ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
    } catch (err) {
        console.error('Audit Log Error:', err.message);
    }
};

const updateById = async (Model, id, data) => Model.updateOne({ id: Number.isNaN(Number(id)) ? id : Number(id) }, { $set: data });
const deleteById = async (Model, id) => Model.deleteOne({ id: Number.isNaN(Number(id)) ? id : Number(id) });

const getStats = async (req, res, next) => {
    try {
        const [totalReg, pendingReg, approvedReg, activeTourneys, openTickets, registrations, tournaments] = await Promise.all([
            models.Registration.countDocuments(),
            models.Registration.countDocuments({ status: 'Pending' }),
            models.Registration.countDocuments({ status: 'Approved' }),
            models.Tournament.countDocuments({ status: 'Open' }),
            models.ChatbotTicket.countDocuments({ status: 'Pending' }),
            models.Registration.find().lean(),
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

const getRegistrations = async (req, res, next) => {
    try {
        const registrations = await models.Registration.find().sort({ created_at: -1 }).lean();
        const enriched = [];

        for (const reg of registrations) {
            const tourney = await models.Tournament.findOne({ id: reg.tournament_id }).select('name').lean();
            const players = reg.type !== 'Solo'
                ? await models.RegistrationPlayer.find({ registration_id: reg.id }).lean()
                : [];

            enriched.push({
                ...clean(reg),
                tournamentName: tourney ? tourney.name : '',
                tournamentId: reg.tournament_id,
                submissionDate: reg.submission_date,
                players: players.map((p) => ({
                    ...clean(p),
                    gameUid: p.game_uid,
                    realName: p.real_name,
                    confirmed: p.confirmed === true
                }))
            });
        }

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

const createTournament = async (req, res, next) => {
    try {
        const { id, name, game, mode, category, prizePool, startDate, regCloseDate, rules, ruleBook, soloRegistrationEnabled, description, image, featured } = req.body;
        
        let tourneyId = id;
        if (!tourneyId && name) {
            tourneyId = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
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
        await models.Tournament.create({ id: tourneyId, name, game, mode, category, prizePool, startDate, regCloseDate, status: 'Open', rules, ruleBook, soloRegistrationEnabled: !!soloRegistrationEnabled, description, image, featured: !!featured });
        await logAdminAction(req, 'CREATE_TOURNAMENT', { id: tourneyId, name });
        res.status(201).json({ success: true, message: 'Tournament arena initialized successfully' });
    } catch (err) {
        next(err);
    }
};

const updateTournament = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = { ...req.body, soloRegistrationEnabled: !!req.body.soloRegistrationEnabled, featured: !!req.body.featured };
        delete data.id;
        const result = await models.Tournament.updateOne({ id }, { $set: data });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Tournament arena not found'));
        }
        await logAdminAction(req, 'UPDATE_TOURNAMENT', { id, name: req.body.name });
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

const createNews = async (req, res, next) => {
    try {
        const { title, tag, summary, content, image, contentType, redirectLink } = req.body;
        const id = 'news-' + Date.now();
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        await models.News.create({ id, title, tag, date, summary, content, image, contentType, redirectLink: redirectLink || '' });
        await logAdminAction(req, 'CREATE_NEWS', { id, title });
        res.status(201).json({ success: true, message: 'News dispatch posted' });
    } catch (err) { next(err); }
};

const updateNews = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await models.News.updateOne({ id }, { $set: { ...req.body, redirectLink: req.body.redirectLink || '' } });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('News item not found'));
        }
        await logAdminAction(req, 'UPDATE_NEWS', { id, title: req.body.title });
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

const createGallery = async (req, res, next) => {
    try {
        const { title, url, type } = req.body;
        await models.Gallery.create({ id: await nextNumberId(models.Gallery), type: type || 'image', title, url });
        await logAdminAction(req, 'CREATE_GALLERY', { title, url });
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

const createRoster = async (req, res, next) => {
    try {
        const data = { ...req.body, id: req.body.tag, twitter: req.body.twitter || '#', youtube: req.body.youtube || '#', instagram: req.body.instagram || '#' };
        await models.Roster.create(data);
        await logAdminAction(req, 'CREATE_ROSTER', { tag: req.body.tag, fullName: req.body.fullName });
        res.status(201).json({ success: true, message: 'Official roster player registered' });
    } catch (err) { next(err); }
};

const updateRoster = async (req, res, next) => {
    try {
        const result = await models.Roster.updateOne({ tag: req.params.tag }, { $set: { ...req.body, twitter: req.body.twitter || '#', youtube: req.body.youtube || '#', instagram: req.body.instagram || '#' } });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Roster player tag not found'));
        }
        await logAdminAction(req, 'UPDATE_ROSTER', { tag: req.params.tag, fullName: req.body.fullName });
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

const createSponsor = async (req, res, next) => {
    try {
        await models.Sponsor.create({ id: await nextNumberId(models.Sponsor), ...req.body });
        await logAdminAction(req, 'CREATE_SPONSOR', { name: req.body.name, tier: req.body.tier });
        res.status(201).json({ success: true, message: 'Sponsor catalog updated' });
    } catch (err) { next(err); }
};

const updateSponsor = async (req, res, next) => {
    try {
        const result = await updateById(models.Sponsor, req.params.id, req.body);
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Sponsor not found'));
        }
        await logAdminAction(req, 'UPDATE_SPONSOR', { id: req.params.id, name: req.body.name });
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

const createWinner = async (req, res, next) => {
    try {
        const id = Date.now();
        await models.Achievement.create({ id, ...req.body, tier: req.body.tier || 'gold' });
        await logAdminAction(req, 'CREATE_WINNER', { id, teamName: req.body.teamName, event: req.body.event });
        res.status(201).json({ success: true, message: 'Winners achievement added' });
    } catch (err) { next(err); }
};

const updateWinner = async (req, res, next) => {
    try {
        const result = await updateById(models.Achievement, req.params.id, { ...req.body, tier: req.body.tier || 'gold' });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Achievement not found'));
        }
        await logAdminAction(req, 'UPDATE_WINNER', { id: req.params.id, teamName: req.body.teamName, event: req.body.event });
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

const createSocial = async (req, res, next) => {
    try {
        const id = 'social-' + Date.now();
        await models.SocialFeed.create({ id, ...req.body, date: req.body.date || 'Just now', likes: Math.floor(Math.random() * 200) + 10 });
        await logAdminAction(req, 'CREATE_SOCIAL', { id, platform: req.body.platform, author: req.body.author });
        res.status(201).json({ success: true, message: 'Social post added' });
    } catch (err) { next(err); }
};

const updateSocial = async (req, res, next) => {
    try {
        const result = await models.SocialFeed.updateOne({ id: req.params.id }, { $set: req.body });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Social post not found'));
        }
        await logAdminAction(req, 'UPDATE_SOCIAL', { id: req.params.id, platform: req.body.platform, author: req.body.author });
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

const createManagement = async (req, res, next) => {
    try {
        const id = Date.now();
        await models.Management.create({ id, ...req.body, instagram: req.body.instagram || '#', youtube: req.body.youtube || '#' });
        await logAdminAction(req, 'CREATE_MANAGEMENT', { id, name: req.body.name, role: req.body.role });
        res.status(201).json({ success: true, message: 'Management member registered' });
    } catch (err) { next(err); }
};

const updateManagement = async (req, res, next) => {
    try {
        const result = await updateById(models.Management, req.params.id, { ...req.body, instagram: req.body.instagram || '#', youtube: req.body.youtube || '#' });
        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('Management member not found'));
        }
        await logAdminAction(req, 'UPDATE_MANAGEMENT', { id: req.params.id, name: req.body.name, role: req.body.role });
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

const updateSettings = async (req, res, next) => {
    try {
        await models.Setting.updateOne({ id: 1 }, { $set: req.body }, { upsert: true });
        await logAdminAction(req, 'UPDATE_SETTINGS', req.body);
        res.json({ success: true, message: 'Global website configurations updated' });
    } catch (err) { next(err); }
};

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

// ──────────────────────────────────────────────────────
// USER ACCOUNT MANAGEMENT (Admin)
// ──────────────────────────────────────────────────────

// List all user accounts (exclude password hash)
const getAllUsers = async (req, res, next) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.min(100, parseInt(req.query.limit) || 50);
        const search = req.query.search ? req.query.search.trim() : '';

        const filter = search
            ? { $or: [
                { username: { $regex: search, $options: 'i' } },
                { email:    { $regex: search, $options: 'i' } },
                { uid:      { $regex: search, $options: 'i' } }
              ] }
            : {};

        const [users, total] = await Promise.all([
            models.User.find(filter)
                .select('-password_hash -reset_token -reset_token_expiry')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            models.User.countDocuments(filter)
        ]);

        res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

// Verify a user account
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

// Toggle suspend / reactivate a user account
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

// Permanently delete a user account
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
    deleteUser
};
