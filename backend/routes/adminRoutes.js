const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
    resolveTicket
} = require('../controllers/adminController');
const {
    getAllUsers,
    verifyUser,
    suspendUser,
    deleteUser,
    getCollections,
    getCollectionDocs,
    updateCollectionDoc,
    deleteCollectionDoc,
    createHistory,
    updateHistory,
    deleteHistory,
    promoteUser
} = require('../controllers/adminController');

const {
    getEmailSettings,
    updateEmailSettings,
    getEmailTemplates,
    updateEmailTemplate,
    getEmailHistory,
    getEmailQueue,
    resendQueueEmail,
    getEmailAnalytics,
    sendTestEmail,
    sendBulkInvite,
    broadcastTournamentUpdate,
    broadcastResultsAndWinners
} = require('../controllers/emailAdminController');

// Secure all routes in this router with JWT auth & Admin role verification
router.use(protect);
router.use(admin);

// Admin dashboard analytics stats
router.get('/stats', getStats);

// Registrations management
router.get('/registrations', getRegistrations);
router.put('/registrations/:id/status', updateRegistrationStatus);
router.delete('/registrations/:id', deleteRegistration);

// Tournaments management
router.post('/tournaments', createTournament);
router.put('/tournaments/:id', updateTournament);
router.delete('/tournaments/:id', deleteTournament);

// News CRUD
router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

// Gallery CRUD
router.post('/gallery', createGallery);
router.delete('/gallery/:id', deleteGallery);

// Official Team Roster CRUD
router.post('/roster', createRoster);
router.put('/roster/:tag', updateRoster);
router.delete('/roster/:tag', deleteRoster);

// Sponsors CRUD
router.post('/sponsors', createSponsor);
router.put('/sponsors/:id', updateSponsor);
router.delete('/sponsors/:id', deleteSponsor);

// Achievements (Winners) CRUD
router.post('/winners', createWinner);
router.put('/winners/:id', updateWinner);
router.delete('/winners/:id', deleteWinner);

// Social Feed CRUD
router.post('/social', createSocial);
router.put('/social/:id', updateSocial);
router.delete('/social/:id', deleteSocial);

// Management Team CRUD
router.post('/management', createManagement);
router.put('/management/:id', updateManagement);
router.delete('/management/:id', deleteManagement);

// History CRUD
router.post('/history', createHistory);
router.put('/history/:id', updateHistory);
router.delete('/history/:id', deleteHistory);

// Global settings
router.put('/settings', updateSettings);

// Chatbot ticket inbox
router.get('/tickets', getTickets);
router.put('/tickets/:id/resolve', resolveTicket);

// User Account Management
router.get('/users', getAllUsers);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/promote', promoteUser);
router.delete('/users/:id', deleteUser);

// Database Explorer routes
router.get('/db/collections', getCollections);
router.get('/db/collection/:name', getCollectionDocs);
router.put('/db/collection/:name/:id', updateCollectionDoc);
router.delete('/db/collection/:name/:id', deleteCollectionDoc);

// Email System Admin routes
router.get('/email/settings', getEmailSettings);
router.put('/email/settings', updateEmailSettings);
router.get('/email/templates', getEmailTemplates);
router.put('/email/templates/:id', updateEmailTemplate);
router.get('/email/history', getEmailHistory);
router.get('/email/queue', getEmailQueue);
router.post('/email/queue/resend', resendQueueEmail);
router.get('/email/analytics', getEmailAnalytics);
router.post('/email/test', sendTestEmail);
router.post('/email/broadcast-invite', sendBulkInvite);
router.post('/email/broadcast-update', broadcastTournamentUpdate);
router.post('/email/broadcast-results', broadcastResultsAndWinners);

module.exports = router;
