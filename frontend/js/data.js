/* ==========================================================================
   STRIKZ ESPORTS - PRODUCTION API NETWORK MODULE
   ========================================================================== */

(function() {
    const API_BASE = '/api/v1';

    // Helper for making authenticated network requests
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Retrieve token from session or localStorage
        const token = localStorage.getItem('strikz_jwt_token') || sessionStorage.getItem('strikz_jwt_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const url = `${API_BASE}${endpoint}`;
        const res = await fetch(url, options);
        
        // Handle unauthorized errors gracefully
        if (res.status === 401) {
            localStorage.removeItem('strikz_jwt_token');
            sessionStorage.removeItem('strikz_jwt_token');
            localStorage.removeItem('strikz_user_profile');
            sessionStorage.removeItem('strikz_admin_logged_in');
        }

        const json = await res.json();
        if (!res.ok) {
            throw new Error(json.message || `HTTP error! status: ${res.status}`);
        }
        return json;
    }

    const strikzDb = {
        cachedData: null,
        loadPromise: null,

        // Initialize snapshot fetch
        init: function() {
            this.loadPromise = this.fetchSnapshot();
            return this.loadPromise;
        },

        // Fetch database tables snapshot
        fetchSnapshot: async function() {
            try {
                const response = await apiRequest('/snapshot', 'GET');
                if (response.success) {
                    this.cachedData = response.data;
                    return response.data;
                }
            } catch (err) {
                console.error("Strikz Database Snapshot Load Error:", err.message);
            }
            return null;
        },

        // Synchronous retrieval from cache
        get: function() {
            if (!this.cachedData) {
                console.warn("Snapshot cache empty. Return fallback mock structures.");
                return {
                    tournaments: [], sponsors: [], gallery: [], news: [], roster: [], achievements: [], management: [], socialFeed: [], settings: {}
                };
            }
            return this.cachedData;
        },

        getSettings: function() {
            const data = this.get();
            return data.settings || {};
        },

        // Dynamic status tracker queries (secure query of single ticket)
        trackRegistration: async function(id) {
            const res = await apiRequest(`/registrations/track/${id}`, 'GET');
            return res.registration;
        },

        // Client mutations mapped to API requests
        addRegistration: async function(reg) {
            const res = await apiRequest('/registrations', 'POST', reg);
            // Refresh snapshot in background
            this.fetchSnapshot();
            return res.registration;
        },

        confirmJoin: async function(regId) {
            const res = await apiRequest('/my-team/confirm-join', 'POST', { regId });
            this.fetchSnapshot();
            return res;
        },

        getMyTeamInbox: async function() {
            return await apiRequest('/my-team/inbox', 'GET');
        },

        dismissNotification: async function(id) {
            return await apiRequest(`/my-team/inbox/${id}`, 'DELETE');
        },

        leaveTeam: async function() {
            return await apiRequest('/my-team/leave', 'POST');
        },

        disbandTeam: async function() {
            return await apiRequest('/my-team/disband', 'POST');
        },

        kickMember: async function(memberUid) {
            return await apiRequest('/my-team/kick', 'POST', { memberUid });
        },

        updateTeamLogo: async function(logo) {
            return await apiRequest('/my-team/logo', 'PUT', { logo });
        },

        getMyTeam: async function() {
            return await apiRequest('/my-team', 'GET');
        },

        createMyTeam: async function(team) {
            const res = await apiRequest('/my-team', 'POST', team);
            return res.team;
        },

        updateMyTeam: async function(team) {
            return await apiRequest('/my-team', 'PUT', team);
        },

        acceptTeamInvite: async function(teamId) {
            return await apiRequest('/my-team/accept-invite', 'POST', { teamId });
        },

        declineTeamInvite: async function(teamId) {
            return await apiRequest('/my-team/decline-invite', 'POST', { teamId });
        },

        sendFriendRequest: async function(friendUid) {
            return await apiRequest('/friends/request', 'POST', { friendUid });
        },

        getFriendRequests: async function() {
            const res = await apiRequest('/friends/requests', 'GET');
            return res.requests || [];
        },

        acceptFriendRequest: async function(friendshipId) {
            return await apiRequest('/friends/accept', 'POST', { friendshipId });
        },

        rejectFriendRequest: async function(friendshipId) {
            return await apiRequest('/friends/reject', 'POST', { friendshipId });
        },

        getFriends: async function() {
            const res = await apiRequest('/friends', 'GET');
            return res.friends || [];
        },

        sendChatMessage: async function(receiverUid, content) {
            return await apiRequest('/chats/send', 'POST', { receiverUid, content });
        },

        getChatMessageHistory: async function(friendUid) {
            const res = await apiRequest(`/chats/history/${friendUid}`, 'GET');
            return res.messages || [];
        },

        sendTeamMessage: async function(content) {
            return await apiRequest('/my-team/chat', 'POST', { content });
        },

        getTeamMessageHistory: async function() {
            const res = await apiRequest('/my-team/chat', 'GET');
            return res.messages || [];
        },

        addChatbotTicket: async function(ticket) {
            const res = await apiRequest('/chatbot-tickets', 'POST', ticket);
            return res.ticket;
        },

        addPartnerInquiry: async function(inquiry) {
            const res = await apiRequest('/partner-inquiries', 'POST', inquiry);
            return res.inquiry;
        },

        // ==========================================
        // ADMIN DASHBOARD ACTIONS (Requires Token)
        // ==========================================
        
        getStats: async function() {
            const res = await apiRequest('/admin/stats', 'GET');
            return res.stats;
        },

        getAdminRegistrations: async function() {
            const res = await apiRequest('/admin/registrations', 'GET');
            return res.registrations;
        },

        updateRegistrationStatus: async function(id, status) {
            const res = await apiRequest(`/admin/registrations/${id}/status`, 'PUT', { status });
            return res.success;
        },

        deleteRegistration: async function(id) {
            const res = await apiRequest(`/admin/registrations/${id}`, 'DELETE');
            return res.success;
        },

        addTournament: async function(t) {
            const res = await apiRequest('/admin/tournaments', 'POST', t);
            this.fetchSnapshot();
            return res.success;
        },

        updateTournament: async function(t) {
            const res = await apiRequest(`/admin/tournaments/${t.id}`, 'PUT', t);
            this.fetchSnapshot();
            return res.success;
        },

        deleteTournament: async function(id) {
            const res = await apiRequest(`/admin/tournaments/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addNews: async function(n) {
            const res = await apiRequest('/admin/news', 'POST', n);
            this.fetchSnapshot();
            return res.success;
        },

        updateNews: async function(n) {
            const res = await apiRequest(`/admin/news/${n.id}`, 'PUT', n);
            this.fetchSnapshot();
            return res.success;
        },

        deleteNews: async function(id) {
            const res = await apiRequest(`/admin/news/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addSocialPost: async function(item) {
            const res = await apiRequest('/admin/social', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        updateSocialPost: async function(item) {
            const res = await apiRequest(`/admin/social/${item.id}`, 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteSocialPost: async function(id) {
            const res = await apiRequest(`/admin/social/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addWinner: async function(item) {
            const res = await apiRequest('/admin/winners', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        updateWinner: async function(item) {
            const res = await apiRequest(`/admin/winners/${item.id}`, 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteWinner: async function(id) {
            const res = await apiRequest(`/admin/winners/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addManagement: async function(item) {
            const res = await apiRequest('/admin/management', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        updateManagement: async function(item) {
            const res = await apiRequest(`/admin/management/${item.id}`, 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteManagement: async function(id) {
            const res = await apiRequest(`/admin/management/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addHistory: async function(item) {
            const res = await apiRequest('/admin/history', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        updateHistory: async function(item) {
            const res = await apiRequest(`/admin/history/${item.id}`, 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteHistory: async function(id) {
            const res = await apiRequest(`/admin/history/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addSponsor: async function(item) {
            const res = await apiRequest('/admin/sponsors', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        updateSponsor: async function(item) {
            const res = await apiRequest(`/admin/sponsors/${item.id}`, 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteSponsor: async function(id) {
            const res = await apiRequest(`/admin/sponsors/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        updateSettings: async function(item) {
            const res = await apiRequest('/admin/settings', 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        addRosterPlayer: async function(item) {
            const res = await apiRequest('/admin/roster', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        updateRosterPlayer: async function(tag, item) {
            const res = await apiRequest(`/admin/roster/${tag}`, 'PUT', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteRosterPlayer: async function(tag) {
            const res = await apiRequest(`/admin/roster/${tag}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        addGalleryItem: async function(item) {
            const res = await apiRequest('/admin/gallery', 'POST', item);
            this.fetchSnapshot();
            return res.success;
        },

        deleteGalleryItem: async function(id) {
            const res = await apiRequest(`/admin/gallery/${id}`, 'DELETE');
            this.fetchSnapshot();
            return res.success;
        },

        getTickets: async function() {
            const res = await apiRequest('/admin/tickets', 'GET');
            return res.tickets;
        },

        getPendingConfirmations: async function() {
            const res = await apiRequest('/my-team/confirmations', 'GET');
            return res.confirmations;
        },

        resolveChatbotTicket: async function(id) {
            const res = await apiRequest(`/admin/tickets/${id}/resolve`, 'PUT');
            return res.success;
        },

        // Helper for file uploads
        uploadFile: async function(file) {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('strikz_jwt_token') || sessionStorage.getItem('strikz_jwt_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers,
                body: formData
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || `File upload failed with status: ${res.status}`);
            }
            return json;
        }
    };

    window.strikzDb = strikzDb;
    strikzDb.init();
})();
