/* ==========================================================================
   STRIKZ ESPORTS - ADMIN PORTAL (SECURE DASHBOARD)
   ========================================================================== */

(function() {
    function renderAdmin(container) {
        // Session validation — check sessionStorage flag OR localStorage admin profile
        let isLoggedIn = sessionStorage.getItem('strikz_admin_logged_in') === 'true';

        if (!isLoggedIn) {
            // Also check if already logged in as admin via localStorage
            try {
                const storedProfile = localStorage.getItem('strikz_user_profile');
                if (storedProfile) {
                    const profile = JSON.parse(storedProfile);
                    const token = localStorage.getItem('strikz_jwt_token');
                    if (profile.role === 'admin' && token) {
                        // Sync sessionStorage with existing admin login
                        sessionStorage.setItem('strikz_admin_logged_in', 'true');
                        sessionStorage.setItem('strikz_jwt_token', token);
                        isLoggedIn = true;
                    }
                }
            } catch(e) { /* ignore parse errors */ }
        }

        if (!isLoggedIn) {
            renderLoginScreen(container);
        } else {
            renderDashboard(container);
        }
    }

    // Login screen layout
    function renderLoginScreen(container) {
        container.innerHTML = `
            <section class="container admin-dashboard-root" style="padding-top: 60px; margin-bottom: 80px;">
                <div class="admin-login-card">
                    <div class="admin-login-left">
                        <div class="admin-login-left-overlay">
                            <div class="admin-brand-name font-orbitron">strikzesports</div>
                        </div>
                    </div>
                    
                    <div class="admin-login-right">
                        <h2 class="admin-login-heading">Admin Sign in</h2>
                        <p class="admin-login-subheading">Welcome back</p>
                        
                        <form id="admin-login-form" onsubmit="return false;">
                            <div class="admin-form-group">
                                <input type="text" id="admin-user" placeholder="Email or Username" required autocomplete="off">
                            </div>
                            <div class="admin-form-group">
                                <input type="password" id="admin-pass" placeholder="Password" required>
                            </div>
                            <button type="submit" class="admin-login-submit-btn">
                                <span class="btn-text">Admin Sign in</span>
                            </button>
                        </form>
                        
                        <div class="admin-login-links">
                            <a href="#/" class="admin-login-link-item">Back to home</a>
                        </div>
                        
                        <div class="admin-decor-blur"></div>
                    </div>
                </div>
            </section>
        `;

        const form = document.getElementById('admin-login-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const user = document.getElementById('admin-user').value.trim();
            const pass = document.getElementById('admin-pass').value.trim();

            if (!user || !pass) {
                alert("Please enter both username and password.");
                return;
            }

            if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('.btn-text').textContent = 'AUTHENTICATING...'; }

            const doLogin = async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Render cold start
                try {
                    const res = await fetch('/api/v1/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ usernameOrEmail: user, password: pass }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    return res;
                } catch (err) {
                    clearTimeout(timeoutId);
                    throw err;
                }
            };

            try {
                let res;
                try {
                    res = await doLogin();
                } catch (netErr) {
                    // Render cold-start: server may be waking up, retry once with user feedback
                    if (submitBtn) submitBtn.querySelector('.btn-text').textContent = 'SERVER WAKING UP... RETRYING';
                    await new Promise(r => setTimeout(r, 5000));
                    res = await doLogin();
                }

                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.message || 'Invalid credentials');
                }

                if (json.user.role !== 'admin') {
                    throw new Error('You do not have administrator privileges.');
                }

                // Persist auth state
                localStorage.setItem('strikz_jwt_token', json.token);
                localStorage.setItem('strikz_user_profile', JSON.stringify(json.user));
                sessionStorage.setItem('strikz_admin_logged_in', 'true');
                sessionStorage.setItem('strikz_jwt_token', json.token);

                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();

                // Re-render this page via SPA router (no full reload needed)
                if (window.strikzAuth && window.strikzAuth.getUser) {
                    // Sync auth manager state by triggering auth change event
                    window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: json.user }));
                }

                // Navigate away and back to force a clean re-render of admin dashboard
                window.location.hash = '#/';
                setTimeout(() => { window.location.hash = '#/admin'; }, 100);

            } catch (err) {
                const msg = err.name === 'AbortError' ? 'Server timeout. Please wait a minute and try again (Render server may be cold-starting).' : err.message;
                alert("Login Failed: " + msg);
                if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('.btn-text').textContent = 'Admin Sign in'; }
            }
        };
    }

    // Dashboard core layout
    function renderDashboard(container) {
        container.innerHTML = `
            <section class="container admin-dashboard-root" style="padding-top: 20px; margin-bottom: 80px;">
                <div class="section-header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div style="text-align: left;">
                        <span class="section-subtitle">COMMAND PORTAL</span>
                        <h2 class="section-title" style="font-size: 28px;">ADMIN <span>DASHBOARD</span></h2>
                    </div>
                    <button class="cta-button btn-neon-cyan" id="admin-logout-btn" style="padding: 8px 18px; font-size: 11px;">
                        <i class="fa-solid fa-right-from-bracket"></i> SHUT DOWN SESSION
                    </button>
                </div>

                <div class="admin-layout">
                    <!-- Sidebar Tabs -->
                    <aside class="admin-sidebar glass-panel" style="padding: 15px; display: flex; flex-direction: column; gap: 8px;">
                        <button class="admin-tab-btn active" data-tab="overview"><i class="fa-solid fa-chart-line"></i> Overview</button>
                        <button class="admin-tab-btn" data-tab="registrations"><i class="fa-solid fa-address-card"></i> Registrations</button>
                        <button class="admin-tab-btn" data-tab="tournaments"><i class="fa-solid fa-gamepad"></i> Tournaments</button>
                        <button class="admin-tab-btn" data-tab="news"><i class="fa-solid fa-newspaper"></i> News & Notices</button>
                        <button class="admin-tab-btn" data-tab="gallery"><i class="fa-solid fa-images"></i> Gallery Manager</button>
                        <button class="admin-tab-btn" data-tab="team_members"><i class="fa-solid fa-users-viewfinder"></i> Team Members</button>
                        <button class="admin-tab-btn" data-tab="sponsors"><i class="fa-solid fa-handshake"></i> Partners & Sponsors</button>
                        <button class="admin-tab-btn" data-tab="winners"><i class="fa-solid fa-trophy"></i> Winners</button>
                        <button class="admin-tab-btn" data-tab="social"><i class="fa-solid fa-share-nodes"></i> Recent Post</button>
                        <button class="admin-tab-btn" data-tab="management"><i class="fa-solid fa-users-gear"></i> Management</button>
                        <button class="admin-tab-btn" data-tab="settings"><i class="fa-solid fa-gears"></i> Website Settings</button>
                        <button class="admin-tab-btn" data-tab="history"><i class="fa-solid fa-clock-rotate-left"></i> History Timeline</button>
                        <button class="admin-tab-btn" data-tab="chatbot"><i class="fa-solid fa-comments"></i> Chatbot Inbox</button>
                        <button class="admin-tab-btn" data-tab="email"><i class="fa-solid fa-envelope"></i> Email Center</button>
                        <button class="admin-tab-btn" data-tab="players" style="border-top: 1px solid rgba(0,240,255,0.15); margin-top: 6px; padding-top: 10px; color: var(--neon-cyan);"><i class="fa-solid fa-users-gear"></i> Players</button>
                        <button class="admin-tab-btn" data-tab="db_explorer" style="border-top: 1px solid rgba(255,165,0,0.15); margin-top: 6px; padding-top: 10px; color: var(--neon-orange);"><i class="fa-solid fa-database"></i> Database Explorer</button>
                    </aside>

                    <!-- Main Dynamic Panels -->
                    <main class="glass-panel" id="admin-panel-content" style="border-color: rgba(255,255,255,0.05); min-height: 500px;">
                        <!-- Content loaded dynamically based on tab clicks -->
                    </main>
                </div>
            </section>
        `;

        // Bind logout button
        document.getElementById('admin-logout-btn').onclick = function() {
            sessionStorage.removeItem('strikz_admin_logged_in');
            window.location.reload();
        };

        const panelContent = document.getElementById('admin-panel-content');
        
        // Tab switching logic
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const tab = this.dataset.tab;
                loadTabContent(tab);
            };
        });

        // Initial Load
        loadTabContent('overview');

        async function loadTabContent(tab) {
            if (window.strikzPlayClickSound) window.strikzPlayClickSound();

            let db = window.strikzDb.get();
            let stats = {};

            try {
                if (tab === 'overview') {
                    stats = await window.strikzDb.getStats();
                    renderOverviewTab(panelContent, stats, db);
                } 
                else if (tab === 'registrations') {
                    const regs = await window.strikzDb.getAdminRegistrations();
                    db = { ...db, registrations: regs };
                    renderRegistrationsTab(panelContent, db);
                } 
                else if (tab === 'tournaments') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderTournamentsTab(panelContent, db);
                } 
                else if (tab === 'news') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderNewsTab(panelContent, db);
                }
                else if (tab === 'gallery') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderGalleryTab(panelContent, db);
                }
                else if (tab === 'team_members') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderTeamMembersTab(panelContent, db);
                }
                else if (tab === 'sponsors') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderSponsorsTab(panelContent, db);
                }
                else if (tab === 'winners') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderWinnersTab(panelContent, db);
                }
                else if (tab === 'social') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderSocialTab(panelContent, db);
                }
                else if (tab === 'management') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderManagementTab(panelContent, db);
                }
                else if (tab === 'settings') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderSettingsTab(panelContent, db);
                }
                else if (tab === 'history') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderHistoryTab(panelContent, db);
                }
                else if (tab === 'chatbot') {
                    const tickets = await window.strikzDb.getTickets();
                    db = { ...db, chatbotTickets: tickets };
                    renderChatbotTab(panelContent, db);
                }
                else if (tab === 'email') {
                    db = await window.strikzDb.fetchSnapshot();
                    renderEmailTab(panelContent, db);
                }
                else if (tab === 'players') {
                    await renderPlayersTab(panelContent, 1, '');
                }
                else if (tab === 'db_explorer') {
                    await renderDbExplorerTab(panelContent);
                }
            } catch (err) {
                console.error("Error loading admin tab " + tab + ":", err);
                panelContent.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: var(--neon-orange);">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; margin-bottom: 15px;"></i>
                        <h4 class="font-orbitron">FAILED TO INITIALIZE PANEL</h4>
                        <p style="font-size: 13px; color: var(--text-dim); margin-top: 8px;">${err.message || 'Check connection or admin credentials.'}</p>
                    </div>
                `;
            }
        }
    }

    // 1. OVERVIEW PANEL
    function renderOverviewTab(mount, stats, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-chart-line"></i> ANALYTICS MONITOR</h3>

            <!-- Stats grid -->
            <div class="analytics-grid">
                <div class="analytics-card">
                    <span class="analytics-lbl font-orbitron">TOTAL REGISTRATIONS</span>
                    <div class="analytics-val orange">${stats.totalReg}</div>
                    <span class="analytics-trend"><i class="fa-solid fa-arrow-trend-up"></i> Active submissions</span>
                </div>
                <div class="analytics-card">
                    <span class="analytics-lbl font-orbitron">PENDING REVIEW</span>
                    <div class="analytics-val cyan">${stats.pendingReg}</div>
                    <span class="analytics-trend" style="color: var(--text-dim);">Awaiting Verification</span>
                </div>
                <div class="analytics-card">
                    <span class="analytics-lbl font-orbitron">ACTIVE ARENAS</span>
                    <div class="analytics-val green">${stats.activeTourneys}</div>
                    <span class="analytics-trend" style="color: var(--neon-cyan);">Signups Open</span>
                </div>
                <div class="analytics-card">
                    <span class="analytics-lbl font-orbitron">CHATBOT INBOX</span>
                    <div class="analytics-val" style="color: var(--neon-magenta);">${stats.openTickets}</div>
                    <span class="analytics-trend" style="color: var(--neon-magenta);">Pending tickets</span>
                </div>
            </div>

            <!-- SVG Charts grid -->
            <div class="charts-grid">
                <!-- Chart 1: Registrations Line Chart -->
                <div class="chart-panel">
                    <h4 class="chart-title font-orbitron">Registrations Trend (Weekly)</h4>
                    <div class="svg-chart-container">
                        <svg width="100%" height="100%" viewBox="0 0 300 150" style="background: rgba(255,255,255,0.01);">
                            <!-- Grid lines -->
                            <line x1="30" y1="20" x2="280" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                            <line x1="30" y1="60" x2="280" y2="60" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                            <line x1="30" y1="100" x2="280" y2="100" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                            <line x1="30" y1="130" x2="280" y2="130" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                            <!-- Chart Line -->
                            <polyline fill="none" stroke="var(--neon-orange)" stroke-width="3" 
                                points="30,120 70,110 110,80 150,90 190,40 230,30 270,15"
                                style="filter: drop-shadow(0 0 5px var(--neon-orange-glow));" />
                            <!-- Dots -->
                            <circle cx="30" cy="120" r="4" fill="var(--neon-orange)"/>
                            <circle cx="70" cy="110" r="4" fill="var(--neon-orange)"/>
                            <circle cx="110" cy="80" r="4" fill="var(--neon-orange)"/>
                            <circle cx="150" cy="90" r="4" fill="var(--neon-orange)"/>
                            <circle cx="190" cy="40" r="4" fill="var(--neon-orange)"/>
                            <circle cx="230" cy="30" r="4" fill="var(--neon-orange)"/>
                            <circle cx="270" cy="15" r="4" fill="var(--neon-orange)"/>
                            <!-- Text tags -->
                            <text x="30" y="145" fill="var(--text-dim)" font-size="8" text-anchor="middle">Wk 1</text>
                            <text x="110" y="145" fill="var(--text-dim)" font-size="8" text-anchor="middle">Wk 3</text>
                            <text x="190" y="145" fill="var(--text-dim)" font-size="8" text-anchor="middle">Wk 5</text>
                            <text x="270" y="145" fill="var(--text-dim)" font-size="8" text-anchor="middle">Wk 7</text>
                            
                            <text x="15" y="24" fill="var(--text-dim)" font-size="8" text-anchor="end">100</text>
                            <text x="15" y="64" fill="var(--text-dim)" font-size="8" text-anchor="end">50</text>
                            <text x="15" y="104" fill="var(--text-dim)" font-size="8" text-anchor="end">10</text>
                        </svg>
                    </div>
                </div>

                <!-- Chart 2: Registrations per Tournament Horizontal Bar Chart -->
                <div class="chart-panel">
                    <h4 class="chart-title font-orbitron">Registrations Game Distribution</h4>
                    <div class="svg-chart-container">
                        <svg width="100%" height="100%" viewBox="0 0 300 150" style="background: rgba(255,255,255,0.01);">
                            <!-- CS Showdown Bar -->
                            <text x="10" y="25" fill="#fff" font-size="9" font-family="var(--font-header)">CLASH SQUAD</text>
                            <rect x="10" y="32" width="220" height="15" fill="var(--neon-cyan)" rx="3" style="filter: drop-shadow(0 0 4px var(--neon-cyan-border));"/>
                            <text x="240" y="44" fill="var(--neon-cyan)" font-size="10" font-weight="800">22 Teams</text>

                            <!-- FFWS Bar -->
                            <text x="10" y="75" fill="#fff" font-size="9" font-family="var(--font-header)">BATTLE ROYALE SQUAD</text>
                            <rect x="10" y="82" width="160" height="15" fill="var(--neon-orange)" rx="3" style="filter: drop-shadow(0 0 4px var(--neon-orange-glow));"/>
                            <text x="180" y="94" fill="var(--neon-orange)" font-size="10" font-weight="800">16 Teams</text>

                            <!-- Solo Bar -->
                            <text x="10" y="120" fill="#fff" font-size="9" font-family="var(--font-header)">SOLO REGISTRANTS</text>
                            <rect x="10" y="127" width="80" height="15" fill="var(--neon-green)" rx="3"/>
                            <text x="100" y="139" fill="var(--neon-green)" font-size="10" font-weight="800">8 Players</text>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. REGISTRATIONS LIST PANEL
    function renderRegistrationsTab(mount, db) {
        mount.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan);"><i class="fa-solid fa-address-card"></i> REGISTRATIONS MANAGEMENT</h3>
                <button class="cta-button btn-neon-orange" id="btn-export-csv" style="padding: 8px 16px; font-size: 11px;">
                    <i class="fa-solid fa-file-csv"></i> EXPORT CSV
                </button>
            </div>

            <!-- Controls (Search + Filters) -->
            <div class="admin-table-controls">
                <input type="text" id="admin-reg-search" class="admin-search-input" placeholder="Search team, captain, player ID...">
                
                <select id="admin-reg-filter" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); padding: 8px 15px; border-radius: 4px; color: #fff; font-size: 13px;">
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending Only</option>
                    <option value="Approved">Approved Only</option>
                    <option value="Rejected">Rejected Only</option>
                </select>
            </div>

            <!-- Scrollable Table -->
            <div class="history-table-container" style="max-height: 400px; overflow-y: auto;">
                <table class="history-table" id="admin-reg-table">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Competitor</th>
                            <th>Type</th>
                            <th>Tournament</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="admin-reg-table-body">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        `;

        const searchInput = document.getElementById('admin-reg-search');
        const filterSelect = document.getElementById('admin-reg-filter');
        const tableBody = document.getElementById('admin-reg-table-body');
        const csvBtn = document.getElementById('btn-export-csv');

        function loadTable() {
            const query = searchInput.value.trim().toLowerCase();
            const statusFilter = filterSelect.value;
            let list = db.registrations;

            // Apply filter
            if (statusFilter !== 'All') {
                list = list.filter(r => r.status === statusFilter);
            }

            // Apply search
            if (query) {
                list = list.filter(r => {
                    const competitorName = r.type === 'Team' ? r.teamName : r.playerName;
                    const contactName = r.type === 'Team' ? r.captainName : r.playerName;
                    const matchesPlayers = r.players && r.players.some(p => 
                        (p.name && p.name.toLowerCase().includes(query)) || 
                        (p.realName && p.realName.toLowerCase().includes(query)) ||
                        (p.gameUid && p.gameUid.toLowerCase().includes(query))
                    );
                    return r.id.toLowerCase().includes(query) || 
                           (competitorName && competitorName.toLowerCase().includes(query)) || 
                           (contactName && contactName.toLowerCase().includes(query)) ||
                           (r.tournamentName && r.tournamentName.toLowerCase().includes(query)) ||
                           matchesPlayers;
                });
            }

            if (list.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center" style="padding: 30px; color: var(--text-dim);">No registration applications found.</td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = list.map(r => {
                const statusClass = r.status === 'Approved' ? 'status-approved' : (r.status === 'Pending' ? 'status-pending' : 'status-rejected');
                const competitorName = r.type === 'Team' ? r.teamName : r.playerName;

                let confirmationsLabel = '';
                if (r.type === 'Team' || r.type === 'Squad' || r.type === 'Duo') {
                    const confirmedCount = r.players ? r.players.filter(p => p.confirmed).length : 0;
                    const totalPlayers = r.players ? r.players.length : 0;
                    confirmationsLabel = `
                        <div style="font-size: 11px; margin-top: 5px; color: var(--text-dim);">
                            Confirmations: <strong style="color: var(--neon-yellow);">${confirmedCount}/${totalPlayers}</strong>
                            <span style="cursor: pointer; color: var(--neon-orange); margin-left: 8px;" class="toggle-roster-btn" data-id="${r.id}">(View Details)</span>
                            <div id="roster-details-${r.id}" style="display: none; margin-top: 5px; background: rgba(0,0,0,0.3); padding: 8px; border: 1px solid var(--glass-border); border-radius: 4px; max-width: 250px; text-align: left;">
                                ${r.players ? r.players.map(p => `
                                    <div style="font-size: 10px; display: flex; justify-content: space-between; margin-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 2px;">
                                        <span style="color: #eee;">${p.name} (${p.realName || 'No Real Name'})</span>
                                        <span style="color: ${p.confirmed ? 'var(--neon-green)' : 'var(--neon-orange)'}; font-weight: bold;">
                                            ${p.confirmed ? 'Confirmed' : 'Pending'}
                                        </span>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    `;
                } else {
                    confirmationsLabel = `
                        <div style="font-size: 11px; margin-top: 5px; color: var(--text-dim);">
                            UID: <strong style="color: var(--neon-yellow);">${r.gameUid || 'N/A'}</strong> | Role: <strong>${r.role || 'N/A'}</strong>
                        </div>
                    `;
                }

                return `
                    <tr>
                        <td class="font-orbitron" style="font-size: 11px; font-weight: 700; color: var(--neon-cyan);">${r.id}</td>
                        <td style="font-weight: 600; color: #fff; text-align: left;">
                            <div>${competitorName}</div>
                            ${confirmationsLabel}
                        </td>
                        <td><span style="font-size: 10px; color: var(--text-silver); text-transform: uppercase;">${r.type}</span></td>
                        <td style="font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.tournamentName}</td>
                        <td style="font-size: 12px;">${window.strikzFormatDate(r.submissionDate)}</td>
                        <td><span class="badge-status ${statusClass}">${r.status}</span></td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="action-icon-btn approve" data-id="${r.id}" title="Approve Registration"><i class="fa-solid fa-check"></i></button>
                                <button class="action-icon-btn reject" data-id="${r.id}" title="Reject Registration"><i class="fa-solid fa-xmark"></i></button>
                                <button class="action-icon-btn delete" data-id="${r.id}" title="Delete Record"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Bind Roster Toggle click
            tableBody.querySelectorAll('.toggle-roster-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const detailsDiv = document.getElementById(`roster-details-${id}`);
                    if (detailsDiv.style.display === 'none') {
                        detailsDiv.style.display = 'block';
                        this.textContent = '(Hide Details)';
                    } else {
                        detailsDiv.style.display = 'none';
                        this.textContent = '(View Details)';
                    }
                };
            });

            // Bind Actions click
            tableBody.querySelectorAll('.approve').forEach(btn => {
                btn.onclick = async function() {
                    const id = this.dataset.id;
                    try {
                        await window.strikzDb.updateRegistrationStatus(id, 'Approved');
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        await loadTabContentAndRefresh();
                    } catch (err) {
                        alert("Error: " + err.message);
                    }
                };
            });

            tableBody.querySelectorAll('.reject').forEach(btn => {
                btn.onclick = async function() {
                    const id = this.dataset.id;
                    try {
                        await window.strikzDb.updateRegistrationStatus(id, 'Rejected');
                        await loadTabContentAndRefresh();
                    } catch (err) {
                        alert("Error: " + err.message);
                    }
                };
            });

            tableBody.querySelectorAll('.delete').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this competitor registration record permanently?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteRegistration(id);
                            await loadTabContentAndRefresh();
                        } catch (err) {
                            alert("Error: " + err.message);
                        }
                    }
                };
            });
        }

        async function loadTabContentAndRefresh() {
            const regs = await window.strikzDb.getAdminRegistrations();
            db.registrations = regs;
            loadTable();
        }

        // CSV Export Logic
        csvBtn.onclick = function() {
            const list = db.registrations || [];
            let csvContent = "Ticket ID,Competitor,Type,Tournament,Contact Email,Contact Phone,Filed Date,Status,Roster Details\n";

            list.forEach(r => {
                const competitorName = r.type === 'Team' ? (r.teamName || '') : (r.playerName || '');
                const contactEmail = r.type === 'Team' ? (r.captainEmail || '') : (r.playerEmail || '');
                const contactPhone = r.type === 'Team' ? (r.captainPhone || '') : (r.playerPhone || '');
                
                let rosterStr = '';
                if (r.players && r.players.length > 0) {
                    rosterStr = r.players.map(p => `${p.name || ''} (${p.realName || 'N/A'}) [${p.gameUid || 'N/A'}] - ${p.confirmed ? 'Confirmed' : 'Pending'}`).join('; ');
                } else {
                    rosterStr = 'Solo Competitor';
                }

                const row = [
                    r.id || '',
                    `"${competitorName.replace(/"/g, '""')}"`,
                    r.type || '',
                    `"${(r.tournamentName || '').replace(/"/g, '""')}"`,
                    contactEmail,
                    contactPhone,
                    window.strikzFormatDate(r.submissionDate),
                    r.status || '',
                    `"${rosterStr.replace(/"/g, '""')}"`
                ].join(",");
                csvContent += row + "\n";
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `strikz_registrations_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        // Inputs binding
        searchInput.oninput = loadTable;
        filterSelect.onchange = loadTable;

        // Run initial load
        loadTable();
    }

    // 3. TOURNAMENTS CRUD PANEL
    function renderTournamentsTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-trophy"></i> TOURNAMENT SQUAD SETUP</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- Tournament Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> CREATE / EDIT ARENA</h4>
                    
                    <form id="admin-tourney-form" onsubmit="return false;">
                        <input type="hidden" id="edit-tourney-id">
                        <div class="form-group">
                            <label for="tourney-name">Tournament Title</label>
                            <input type="text" id="tourney-name" placeholder="E.g. Free Fire India Championship" required style="color: #fff;">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tourney-prize">Prize Pool</label>
                                <input type="text" id="tourney-prize" placeholder="E.g. $200,000 USD" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="tourney-mode">Game Mode Settings (Visual)</label>
                                <input type="text" id="tourney-mode" placeholder="E.g. Squad Battle Royale" required style="color: #fff;">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tourney-category">Roster Category</label>
                                <select id="tourney-category" style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px;">
                                    <option value="Squad">Squad (4-5 Players)</option>
                                    <option value="Duo">Duo (2 Players)</option>
                                    <option value="Solo">Solo (1 Player)</option>
                                </select>
                            </div>
                            <div class="form-group" style="display:flex; align-items:center; gap:8px; padding-top:20px;">
                                <input type="checkbox" id="tourney-solo-enabled" checked style="width:16px; height:16px;">
                                <label for="tourney-solo-enabled" style="margin-bottom:0; font-size:12px;">Enable Solo Registration</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tourney-start">Start Date</label>
                                <input type="date" id="tourney-start" required style="color: #fff; display: block;">
                            </div>
                            <div class="form-group">
                                <label for="tourney-close">Registration Close Date</label>
                                <input type="date" id="tourney-close" required style="color: #fff; display: block;">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tourney-status">Registration Status</label>
                                <select id="tourney-status" style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px; width: 100%;">
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Temporary Close">Temporary Close</option>
                                    <option value="Slot Full">Slot Full</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="tourney-rules">Official Rules Overview</label>
                            <input type="text" id="tourney-rules" placeholder="Brief rules overview..." required style="color:#fff;">
                        </div>
                        <div class="form-group">
                            <label for="tourney-rulebook">Detailed Rule Book</label>
                            <textarea id="tourney-rulebook" rows="4" placeholder="Detailed rule book lines..." required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="tourney-banner-upload">Tournament Banner (Upload Image)</label>
                            <input type="file" id="tourney-banner-upload" accept="image/*" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color:#fff; font-size: 11px; width: 100%;">
                            <input type="hidden" id="tourney-banner-base64">
                        </div>
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-tourney">
                            <span class="btn-text">SAVE TOURNAMENT</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Tournaments List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">REGISTERED ARENA BOARDS</h4>
                    <div id="admin-tournaments-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 450px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-tourney-form');
        const listMount = document.getElementById('admin-tournaments-list');
        const editIdInput = document.getElementById('edit-tourney-id');
        const nameInput = document.getElementById('tourney-name');
        const prizeInput = document.getElementById('tourney-prize');
        const modeInput = document.getElementById('tourney-mode');
        const categorySelect = document.getElementById('tourney-category');
        const soloEnabledCheck = document.getElementById('tourney-solo-enabled');
        const startInput = document.getElementById('tourney-start');
        const closeInput = document.getElementById('tourney-close');
        const rulesInput = document.getElementById('tourney-rules');
        const rulebookInput = document.getElementById('tourney-rulebook');
        const bannerFileInput = document.getElementById('tourney-banner-upload');
        const bannerBase64Input = document.getElementById('tourney-banner-base64');
        const saveBtn = document.getElementById('btn-save-tourney');
        const statusSelect = document.getElementById('tourney-status');

        // Bind banner file loader
        if (bannerFileInput) {
            bannerFileInput.onchange = async function() {
                const file = bannerFileInput.files[0];
                if (!file) return;
                try {
                    const res = await window.strikzDb.uploadFile(file);
                    bannerBase64Input.value = res.imageUrl;
                    alert("Image uploaded successfully!");
                } catch (err) {
                    alert("Upload failed: " + err.message);
                }
            };
        }

        function loadTournamentsList() {
            const list = db.tournaments;
            listMount.innerHTML = list.map(t => `
                <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; border-color: ${t.status === 'Open' ? 'var(--neon-green-border)' : 'var(--glass-border)'};">
                    <div>
                        <span class="font-orbitron" style="font-size: 10px; color: var(--neon-orange);">${t.category.toUpperCase()} | ${t.game.toUpperCase()}</span>
                        <span class="font-orbitron" style="font-size: 9px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; font-weight: bold; background: ${
                            t.status === 'Open' ? 'rgba(34, 197, 94, 0.15)' :
                            t.status === 'Closed' ? 'rgba(239, 68, 68, 0.15)' :
                            t.status === 'Temporary Close' ? 'rgba(255, 165, 0, 0.15)' :
                            t.status === 'Slot Full' ? 'rgba(255, 0, 255, 0.15)' :
                            t.status === 'Completed' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(156, 163, 175, 0.15)'
                        }; color: ${
                            t.status === 'Open' ? '#22c55e' :
                            t.status === 'Closed' ? '#ef4444' :
                            t.status === 'Temporary Close' ? '#ffa500' :
                            t.status === 'Slot Full' ? '#ff00ff' :
                            t.status === 'Completed' ? '#3b82f6' : '#9ca3af'
                        };">${(t.status || 'Open').toUpperCase()}</span>
                        <h5 class="font-orbitron" style="font-size: 13px; color: #fff; margin: 2px 0;">${t.name}</h5>
                        <p style="font-size: 11px; color: var(--text-dim);">Prize Pool: <strong style="color: var(--neon-yellow);">${t.prizePool}</strong> | Solo Allowed: <strong>${t.soloRegistrationEnabled !== false ? 'YES' : 'NO'}</strong></p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select class="admin-tourney-status-select" data-id="${t.id}" style="background: rgba(16, 16, 16, 0.8); border: 1px solid var(--glass-border); padding: 5px; color: #fff; border-radius: 4px; font-size: 11px; cursor: pointer;">
                            <option value="Open" ${t.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="Closed" ${t.status === 'Closed' ? 'selected' : ''}>Closed</option>
                            <option value="Temporary Close" ${t.status === 'Temporary Close' ? 'selected' : ''}>Temporary Close</option>
                            <option value="Slot Full" ${t.status === 'Slot Full' ? 'selected' : ''}>Slot Full</option>
                            <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${t.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button class="action-icon-btn approve edit-tourney-btn" data-id="${t.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-tourney-btn" data-id="${t.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');

            // Bind status change dropdown
            listMount.querySelectorAll('.admin-tourney-status-select').forEach(select => {
                select.onchange = async function() {
                    const id = this.dataset.id;
                    const status = this.value;
                    try {
                        await window.strikzDb.updateTournament({ id, status });
                        alert(`Tournament status set to ${status} successfully!`);
                        db = await window.strikzDb.fetchSnapshot();
                        loadTournamentsList();
                    } catch (err) {
                        alert("Failed to update status: " + err.message);
                        const t = db.tournaments.find(x => x.id === id);
                        if (t) this.value = t.status || 'Open';
                    }
                };
            });

            // Bind delete tourney
            listMount.querySelectorAll('.delete-tourney-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this tournament structure permanently? This will remove it from the home page schedule.")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteTournament(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadTournamentsList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            // Bind edit tourney
            listMount.querySelectorAll('.edit-tourney-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const t = db.tournaments.find(x => x.id === id);
                    if (t) {
                        editIdInput.value = t.id;
                        nameInput.value = t.name;
                        prizeInput.value = t.prizePool;
                        modeInput.value = t.mode;
                        categorySelect.value = t.category || 'Squad';
                        soloEnabledCheck.checked = t.soloRegistrationEnabled !== false;
                        startInput.value = t.startDate;
                        closeInput.value = t.regCloseDate;
                        rulesInput.value = t.rules;
                        rulebookInput.value = t.ruleBook || t.rules || '';
                        bannerBase64Input.value = t.image || '';
                        if (statusSelect) {
                            statusSelect.value = t.status || 'Open';
                        }
                        
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE TOURNAMENT';
                    }
                };
            });
        }

        // Form Submit
        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;
            const tourneyObj = {
                name: nameInput.value.trim(),
                game: 'Free Fire Max',
                mode: modeInput.value.trim(),
                category: categorySelect.value,
                soloRegistrationEnabled: soloEnabledCheck.checked,
                prizePool: prizeInput.value.trim(),
                startDate: startInput.value,
                regCloseDate: closeInput.value,
                rules: rulesInput.value.trim(),
                ruleBook: rulebookInput.value.trim(),
                image: bannerBase64Input.value.trim() || 'assets/tournament_banner.png',
                status: statusSelect ? statusSelect.value : 'Open'
            };

            try {
                if (id) {
                    tourneyObj.id = id;
                    await window.strikzDb.updateTournament(tourneyObj);
                    alert("Tournament updated successfully!");
                } else {
                    await window.strikzDb.addTournament(tourneyObj);
                    alert("New tournament created successfully!");
                }

                form.reset();
                editIdInput.value = '';
                bannerBase64Input.value = '';
                if (statusSelect) statusSelect.value = 'Open';
                saveBtn.querySelector('.btn-text').textContent = 'SAVE TOURNAMENT';
                
                db = await window.strikzDb.fetchSnapshot();
                loadTournamentsList();
            } catch (err) {
                alert("Error saving tournament: " + err.message);
            }
        };

        // Run list loader
        loadTournamentsList();
    }

    // 4. NEWS & NOTICES CRUD PANEL
    function renderNewsTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-newspaper"></i> NEWS & NOTICES CONTROL</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- News Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> PUBLISH UPDATE</h4>
                    
                    <form id="admin-news-form" onsubmit="return false;">
                        <input type="hidden" id="edit-news-id">
                        <div class="form-group">
                            <label for="news-title">Article Title</label>
                            <input type="text" id="news-title" placeholder="Title of article..." required style="color: #fff;">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="news-tag">Tag / Category</label>
                                <select id="news-tag" required style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px;">
                                    <option value="Tournament">Tournament</option>
                                    <option value="Roster Update">Roster Update</option>
                                    <option value="Guides">Guides</option>
                                    <option value="Notice">Notice (Sidebar)</option>
                                    <option value="Alert">Alert (Sidebar)</option>
                                    <option value="System">System (Sidebar)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="news-image">Header Image Path / Upload</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="text" id="news-image" value="assets/tournament_banner.png" required style="color: #fff; flex: 1;">
                                    <div style="position: relative; overflow: hidden; display: inline-block;">
                                        <button type="button" class="admin-action-btn green" style="margin: 0; padding: 10px 14px; height: 100%; white-space: nowrap;"><i class="fa-solid fa-upload"></i> UPLOAD</button>
                                        <input type="file" id="news-image-file" accept="image/*" style="position: absolute; font-size: 100px; opacity: 0; right: 0; top: 0; cursor: pointer;">
                                    </div>
                                </div>
                                <div id="news-image-preview" style="margin-top: 8px; display: none;">
                                    <img src="" style="max-height: 80px; border-radius: 4px; border: 1px solid var(--glass-border);">
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="news-content-type">Content Media Type</label>
                                <select id="news-content-type" style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px;">
                                    <option value="Article">Standard Article</option>
                                    <option value="Video">Video Link</option>
                                    <option value="Post">Social Post Link</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="news-redirect-link">Direct Redirect Link (Optional)</label>
                                <input type="text" id="news-redirect-link" placeholder="E.g. https://youtube.com/live/..." style="color: #fff;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="news-summary">Brief Summary (Card Snippet)</label>
                            <input type="text" id="news-summary" placeholder="One sentence summary..." required style="color: #fff;">
                        </div>
                        <div class="form-group">
                            <label for="news-content">Full Body Content</label>
                            <textarea id="news-content" rows="4" placeholder="Detailed content..." style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                        </div>
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-news">
                            <span class="btn-text">PUBLISH UPDATE</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Articles List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">PUBLISHED ARTICLES</h4>
                    <div id="admin-news-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-news-form');
        const listMount = document.getElementById('admin-news-list');
        const editIdInput = document.getElementById('edit-news-id');
        const titleInput = document.getElementById('news-title');
        const tagSelect = document.getElementById('news-tag');
        const imageInput = document.getElementById('news-image');
        const summaryInput = document.getElementById('news-summary');
        const contentInput = document.getElementById('news-content');
        const contentTypeSelect = document.getElementById('news-content-type');
        const redirectLinkInput = document.getElementById('news-redirect-link');
        const saveBtn = document.getElementById('btn-save-news');

        const imageFileInput = document.getElementById('news-image-file');
        const imagePreviewContainer = document.getElementById('news-image-preview');
        const imagePreviewImg = imagePreviewContainer.querySelector('img');

        function updateNewsPreview(src) {
            if (src && src !== 'assets/tournament_banner.png') {
                imagePreviewImg.src = src;
                imagePreviewContainer.style.display = 'block';
            } else {
                imagePreviewContainer.style.display = 'none';
            }
        }

        imageInput.addEventListener('input', () => updateNewsPreview(imageInput.value.trim()));

        imageFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const res = await window.strikzDb.uploadFile(file);
                    imageInput.value = res.imageUrl;
                    updateNewsPreview(res.imageUrl);
                    alert("Image uploaded successfully!");
                } catch (err) {
                    alert("Upload failed: " + err.message);
                }
            }
        });

        function loadNewsList() {
            const list = db.news || [];
            listMount.innerHTML = list.map(n => `
                <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span class="font-orbitron" style="font-size: 9px; color: var(--neon-cyan); border: 1px solid var(--neon-cyan-border); padding: 2px 6px; border-radius: 3px;">${n.tag.toUpperCase()}</span>
                        <h5 style="font-size: 13px; color: #fff; margin: 6px 0 2px 0; font-weight:700;">${n.title}</h5>
                        <p style="font-size: 11px; color: var(--text-dim);">${window.strikzFormatDate(n.date)}</p>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="action-icon-btn approve edit-news-btn" data-id="${n.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-news-btn" data-id="${n.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');

            // Bind delete
            listMount.querySelectorAll('.delete-news-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this news article/notice permanently?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteNews(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadNewsList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            // Bind edit
            listMount.querySelectorAll('.edit-news-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const n = db.news.find(x => x.id === id);
                    if (n) {
                        editIdInput.value = n.id;
                        titleInput.value = n.title;
                        tagSelect.value = n.tag;
                        imageInput.value = n.image;
                        updateNewsPreview(n.image);
                        summaryInput.value = n.summary;
                        contentInput.value = n.content || '';
                        contentTypeSelect.value = n.contentType || 'Article';
                        redirectLinkInput.value = n.redirectLink || '';
                        
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE ARTICLE';
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;
            const newsObj = {
                title: titleInput.value.trim(),
                tag: tagSelect.value,
                image: imageInput.value.trim(),
                summary: summaryInput.value.trim(),
                content: contentInput.value.trim(),
                contentType: contentTypeSelect.value,
                redirectLink: redirectLinkInput.value.trim()
            };

            try {
                if (id) {
                    newsObj.id = id;
                    await window.strikzDb.updateNews(newsObj);
                    alert("Article updated successfully!");
                } else {
                    await window.strikzDb.addNews(newsObj);
                    alert("New article published successfully!");
                }

                form.reset();
                editIdInput.value = '';
                imageInput.value = 'assets/tournament_banner.png';
                updateNewsPreview('');
                saveBtn.querySelector('.btn-text').textContent = 'PUBLISH UPDATE';
                
                db = await window.strikzDb.fetchSnapshot();
                loadNewsList();
            } catch (err) {
                alert("Error publishing article: " + err.message);
            }
        };

        loadNewsList();
    }

    // 5. SOCIAL FEED CRUD PANEL
    function renderSocialTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-share-nodes"></i> SOCIAL FEED COMMUNITY OVERRIDE</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- Social Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> ADD SOCIAL POST</h4>
                    
                    <form id="admin-social-form" onsubmit="return false;">
                        <input type="hidden" id="edit-social-id">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social-platform">Platform</label>
                                <select id="social-platform" required style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px;">
                                    <option value="Discord">Discord</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="YouTube">YouTube</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="social-author">Author handle</label>
                                <input type="text" id="social-author" placeholder="E.g. @strikz_esports" required style="color: #fff;">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social-date">Timestamp String</label>
                                <input type="text" id="social-date" placeholder="E.g. 2 hours ago" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="social-url">Target URL Link</label>
                                <input type="text" id="social-url" value="#" required style="color: #fff;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="social-content">Post Content</label>
                            <textarea id="social-content" rows="3" placeholder="Social post text details..." required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                        </div>
                        <input type="hidden" id="social-image" value="">
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-social">
                            <span class="btn-text">SAVE POST</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Social Cards List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">LIVE SOCIAL POSTS</h4>
                    <div id="admin-social-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-social-form');
        const listMount = document.getElementById('admin-social-list');
        const editIdInput = document.getElementById('edit-social-id');
        const platformSelect = document.getElementById('social-platform');
        const authorInput = document.getElementById('social-author');
        const dateInput = document.getElementById('social-date');
        const urlInput = document.getElementById('social-url');
        const contentInput = document.getElementById('social-content');
        const saveBtn = document.getElementById('btn-save-social');

        const imageInput = document.getElementById('social-image');
        const imageFileInput = document.getElementById('social-image-file');
        const imagePreviewContainer = document.getElementById('social-image-preview');
        const imagePreviewImg = imagePreviewContainer ? imagePreviewContainer.querySelector('img') : null;

        function updateSocialPreview(src) {
            if (!imagePreviewContainer || !imagePreviewImg) return;
            if (src) {
                imagePreviewImg.src = src;
                imagePreviewContainer.style.display = 'block';
            } else {
                imagePreviewContainer.style.display = 'none';
            }
        }

        if (imageInput) {
            imageInput.addEventListener('input', () => updateSocialPreview(imageInput.value.trim()));
        }

        if (imageFileInput) {
            imageFileInput.addEventListener('change', async function(e) {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const res = await window.strikzDb.uploadFile(file);
                        imageInput.value = res.imageUrl;
                        updateSocialPreview(res.imageUrl);
                        alert("Image uploaded successfully!");
                    } catch (err) {
                        alert("Upload failed: " + err.message);
                    }
                }
            });
        }

        function loadSocialList() {
            const list = db.socialFeed || [];
            listMount.innerHTML = list.map(s => `
                <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span class="font-orbitron" style="font-size: 9px; color: var(--neon-cyan);">${s.platform.toUpperCase()}</span>
                        <h5 style="font-size: 12px; color: #fff; margin: 4px 0 2px 0;">${s.author}</h5>
                        <p style="font-size: 11px; color: var(--text-silver); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.content}</p>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="action-icon-btn approve edit-social-btn" data-id="${s.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-social-btn" data-id="${s.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');

            // Bind delete
            listMount.querySelectorAll('.delete-social-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this social feed post?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteSocialPost(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadSocialList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            // Bind edit
            listMount.querySelectorAll('.edit-social-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const s = db.socialFeed.find(x => x.id === id);
                    if (s) {
                        editIdInput.value = s.id;
                        platformSelect.value = s.platform;
                        authorInput.value = s.author;
                        dateInput.value = s.date;
                        urlInput.value = s.link || s.url || '#';
                        contentInput.value = s.content;
                        imageInput.value = s.image || '';
                        updateSocialPreview(s.image || '');
                        
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE POST';
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;
            const postObj = {
                platform: platformSelect.value,
                author: authorInput.value.trim(),
                date: dateInput.value.trim(),
                link: urlInput.value.trim(),
                content: contentInput.value.trim(),
                image: imageInput.value.trim()
            };

            try {
                if (id) {
                    postObj.id = id;
                    await window.strikzDb.updateSocialPost(postObj);
                    alert("Social post updated successfully!");
                } else {
                    await window.strikzDb.addSocialPost(postObj);
                    alert("Social post added successfully!");
                }

                form.reset();
                editIdInput.value = '';
                urlInput.value = '#';
                imageInput.value = '';
                updateSocialPreview('');
                saveBtn.querySelector('.btn-text').textContent = 'SAVE POST';
                
                db = await window.strikzDb.fetchSnapshot();
                loadSocialList();
            } catch (err) {
                alert("Error saving social post: " + err.message);
            }
        };

        loadSocialList();
    }
    // 6. WINNERS CRUD PANEL (REDESIGNED)
    function renderWinnersTab(mount, db) {
        /* ---- Medal / tier colour helpers ---- */
        const medalColors = {
            1: { color: '#FFE600', label: '🥇 1ST PLACE', bg: 'rgba(255,230,0,0.12)', border: 'rgba(255,230,0,0.3)' },
            2: { color: '#c0c0c0', label: '🥈 2ND PLACE', bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.25)' },
            3: { color: '#cd7f32', label: '🥉 3RD PLACE', bg: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.25)' },
        };
        const getMedal = (r) => medalColors[r] || { color: '#7e7e7e', label: `#${r} PLACE`, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' };

        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-trophy"></i> TOURNAMENT STANDINGS &amp; WINNERS</h3>

            <div class="grid-2" style="align-items: start;">
                <!-- Left: Form -->
                <div class="glass-panel" style="padding: 22px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 18px;">
                        <i class="fa-solid fa-circle-plus"></i> NEW / EDIT TOURNAMENT ANNOUNCEMENT
                    </h4>

                    <form id="admin-winner-form" onsubmit="return false;">
                        <input type="hidden" id="edit-winner-id">

                        <!-- Row 1: Event & Date -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="winner-event">Event / Tournament Name</label>
                                <input type="text" id="winner-event" placeholder="E.g. Free Fire Grand Slam" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label for="winner-date">Event Date</label>
                                <input type="text" id="winner-date" placeholder="E.g. Oct 2025" required style="color:#fff;">
                            </div>
                        </div>

                        <!-- Row 2: Title & Overall Reward -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="winner-title">Championship Title</label>
                                <input type="text" id="winner-title" placeholder="E.g. Season 5 Champions" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label for="winner-reward">Total Prize Pool (optional)</label>
                                <input type="text" id="winner-reward" placeholder="E.g. $10,000 USD" style="color:#fff;">
                            </div>
                        </div>

                        <!-- Banner (1st Place Only) -->
                        <div class="form-group">
                            <label for="winner-image">
                                <i class="fa-solid fa-image" style="color: var(--neon-yellow);"></i>
                                Banner Image — <span style="color: var(--neon-yellow); font-size:10px;">1ST PLACE TEAM ONLY</span>
                            </label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="text" id="winner-image" placeholder="URL or upload..." style="color:#fff; flex:1;">
                                <div style="position:relative; overflow:hidden; display:inline-block; flex-shrink:0;">
                                    <button type="button" class="admin-action-btn green" id="winner-banner-btn" style="margin:0; padding:10px 14px; white-space:nowrap;">
                                        <i class="fa-solid fa-upload"></i> UPLOAD
                                    </button>
                                    <input type="file" id="winner-image-file" accept="image/*" style="position:absolute; font-size:100px; opacity:0; right:0; top:0; cursor:pointer;">
                                </div>
                            </div>
                            <img id="admin-banner-preview" class="admin-banner-preview" src="" alt="Banner preview">
                        </div>

                        <!-- Description -->
                        <div class="form-group">
                            <label for="winner-details">Tournament Summary / Highlights</label>
                            <textarea id="winner-details" rows="3" placeholder="Brief tournament summary, roster highlights, tactical notes..." style="width:100%; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); padding:10px; border-radius:6px; color:#fff; font-size:13px; resize:vertical;"></textarea>
                        </div>

                        <!-- Ranked Team Entries -->
                        <div style="margin-top:20px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
                            <h5 class="font-orbitron" style="font-size:11px; color:var(--neon-yellow); letter-spacing:0.07em;">
                                <i class="fa-solid fa-list-ol"></i> RANKED TEAMS (FLEXIBLE — TOP 3, 9, 10, ETC.)
                            </h5>
                            <span style="font-size:10px; color:var(--text-dim);">Add up to 10</span>
                        </div>
                        <div id="winners-rank-inputs" style="display:flex; flex-direction:column; gap:10px; margin-bottom:10px; max-height:520px; overflow-y:auto; padding-right:4px;"></div>
                        <button type="button" class="winner-add-rank-btn" id="btn-add-rank">
                            <i class="fa-solid fa-plus"></i> ADD NEXT RANK POSITION
                        </button>

                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-winner" style="margin-top:18px;">
                            <span class="btn-text">SAVE WINNER RECORD</span>
                        </button>
                    </form>
                </div>

                <!-- Right: Existing Records -->
                <div style="display:flex; flex-direction:column; gap:15px;">
                    <h4 class="font-orbitron" style="font-size:13px; color:var(--text-silver); margin-bottom:5px;">
                        <i class="fa-solid fa-layer-group"></i> EXISTING ANNOUNCEMENTS
                    </h4>
                    <div id="admin-winners-list" style="display:flex; flex-direction:column; gap:10px; max-height:600px; overflow-y:auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        /* ---- Element refs ---- */
        const form           = document.getElementById('admin-winner-form');
        const listMount      = document.getElementById('admin-winners-list');
        const editIdInput    = document.getElementById('edit-winner-id');
        const eventInput     = document.getElementById('winner-event');
        const dateInput      = document.getElementById('winner-date');
        const titleInput     = document.getElementById('winner-title');
        const rewardInput    = document.getElementById('winner-reward');
        const imageInput     = document.getElementById('winner-image');
        const detailsInput   = document.getElementById('winner-details');
        const saveBtn        = document.getElementById('btn-save-winner');
        const addRankBtn     = document.getElementById('btn-add-rank');
        const rankContainer  = document.getElementById('winners-rank-inputs');
        const imageFileInput = document.getElementById('winner-image-file');
        const bannerPreview  = document.getElementById('admin-banner-preview');

        /* ---- Banner preview helper ---- */
        function updateBannerPreview(src) {
            if (src && src.trim()) {
                bannerPreview.src = src.trim();
                bannerPreview.style.display = 'block';
            } else {
                bannerPreview.style.display = 'none';
            }
        }
        imageInput.addEventListener('input', () => updateBannerPreview(imageInput.value));

        /* ---- Banner file upload ---- */
        imageFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const res = await window.strikzDb.uploadFile(file);
                imageInput.value = res.imageUrl;
                updateBannerPreview(res.imageUrl);
            } catch (err) {
                alert('Upload failed: ' + err.message);
            }
        });

        /* ---- Medal metadata ---- */
        const rankMeta = {
            1: { color: '#FFE600', border: 'rgba(255,230,0,0.3)', label: '🥇 1ST' },
            2: { color: '#c0c0c0', border: 'rgba(192,192,192,0.25)', label: '🥈 2ND' },
            3: { color: '#cd7f32', border: 'rgba(205,127,50,0.25)', label: '🥉 3RD' },
        };
        const getRankMeta = (r) => rankMeta[r] || { color: '#7e7e7e', border: 'rgba(255,255,255,0.07)', label: `#${r}` };

        /* ---- Build a single rank entry DOM element ---- */
        function buildRankEntry(rank, data = {}) {
            const rm = getRankMeta(rank);
            const isFirst = rank === 1;
            const tierOptions = ['', 'diamond', 'platinum', 'gold', 'silver', 'bronze'].map(t => {
                const label = t ? t.charAt(0).toUpperCase() + t.slice(1) : 'No Tier';
                const sel = (data.tier === t) ? 'selected' : '';
                return `<option value="${t}" ${sel}>${label}</option>`;
            }).join('');

            const el = document.createElement('div');
            el.className = `winner-rank-entry${isFirst ? ' rank-1-entry' : ''}`;
            el.dataset.rank = rank;
            el.innerHTML = `
                <div class="winner-rank-header">
                    <span class="winner-rank-badge-admin" style="color:${rm.color}; border-color:${rm.border}; background:${rm.border.replace('0.3','0.08').replace('0.25','0.06').replace('0.07','0.04')};">
                        ${rm.label} PLACE
                    </span>
                    ${rank > 1 ? `<button type="button" class="winner-remove-btn" title="Remove this rank"><i class="fa-solid fa-times"></i></button>` : '<span style="font-size:9px; color:var(--text-dim);">Required</span>'}
                </div>
                <div style="display:grid; grid-template-columns:1.8fr 1fr; gap:10px; margin-bottom:10px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:9px; margin-bottom:4px; display:block;">Team Name</label>
                        <input type="text" class="rank-team-name" value="${data.teamName || ''}"
                            placeholder="${isFirst ? 'E.g. STRIKZ ESPORTS (required)' : 'Leave blank to skip'}"
                            ${isFirst ? 'required' : ''}
                            style="color:#fff; font-size:12px; padding:8px;">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:9px; margin-bottom:4px; display:block;">Prize / Reward</label>
                        <input type="text" class="rank-prize" value="${data.prize || ''}" placeholder="E.g. $2,000" style="color:#fff; font-size:12px; padding:8px;">
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:9px; margin-bottom:4px; display:block;">Tier / Badge</label>
                        <select class="rank-tier" style="background:#101010; border:1px solid var(--glass-border); padding:8px; color:#fff; border-radius:4px; font-size:11px; height:36px; width:100%;">
                            ${tierOptions}
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:9px; margin-bottom:4px; display:block;">Team Logo</label>
                        <div style="display:flex; gap:5px; align-items:center;">
                            <input type="text" class="rank-logo" value="${data.teamLogo || ''}" placeholder="URL or upload..." style="color:#fff; font-size:11px; padding:8px; flex:1;">
                            <div style="position:relative; overflow:hidden; display:inline-block; flex-shrink:0;">
                                <button type="button" class="admin-action-btn green btn-rank-upload" style="margin:0; padding:7px 10px; height:36px; font-size:10px;">
                                    <i class="fa-solid fa-upload"></i>
                                </button>
                                <input type="file" class="rank-logo-file" accept="image/*" style="position:absolute; font-size:100px; opacity:0; right:0; top:0; cursor:pointer;">
                            </div>
                        </div>
                    </div>
                </div>
                ${isFirst ? `
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:9px; margin-bottom:4px; display:block; color:var(--neon-yellow);">
                        <i class="fa-solid fa-image"></i> 1ST PLACE LOGO PREVIEW
                    </label>
                    <div id="rank1-logo-preview-wrap" style="display:${data.teamLogo ? 'block' : 'none'}; margin-top:4px;">
                        <img id="rank1-logo-preview" src="${data.teamLogo || ''}" style="width:50px; height:50px; border-radius:50%; border:2px solid var(--neon-yellow); object-fit:contain; background:#000; padding:4px;">
                    </div>
                </div>` : ''}
            `;

            /* ---- Remove button ---- */
            const removeBtn = el.querySelector('.winner-remove-btn');
            if (removeBtn) {
                removeBtn.onclick = () => {
                    el.remove();
                    syncRankBadges();
                };
            }

            /* ---- Logo file upload per-rank ---- */
            const logoFileInput = el.querySelector('.rank-logo-file');
            const logoUrlInput  = el.querySelector('.rank-logo');
            if (logoFileInput) {
                logoFileInput.onchange = async function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                        const res = await window.strikzDb.uploadFile(file);
                        logoUrlInput.value = res.imageUrl;
                        if (isFirst) updateRank1LogoPreview(res.imageUrl);
                    } catch (err) {
                        alert('Upload failed: ' + err.message);
                    }
                };
            }

            /* ---- Rank 1: live logo preview from URL ---- */
            if (isFirst) {
                logoUrlInput.addEventListener('input', () => updateRank1LogoPreview(logoUrlInput.value.trim()));
            }

            return el;
        }

        function updateRank1LogoPreview(src) {
            const wrap = document.getElementById('rank1-logo-preview-wrap');
            const img  = document.getElementById('rank1-logo-preview');
            if (!wrap || !img) return;
            if (src) {
                img.src = src;
                wrap.style.display = 'block';
            } else {
                wrap.style.display = 'none';
            }
        }

        /* ---- Sync rank position labels after removal ---- */
        function syncRankBadges() {
            const entries = rankContainer.querySelectorAll('.winner-rank-entry');
            entries.forEach((el, idx) => {
                const newRank = idx + 1;
                el.dataset.rank = newRank;
                const rm = getRankMeta(newRank);
                const badge = el.querySelector('.winner-rank-badge-admin');
                if (badge) {
                    badge.style.color = rm.color;
                    badge.style.borderColor = rm.border;
                    badge.textContent = `${rm.label} PLACE`;
                }
                el.classList.toggle('rank-1-entry', newRank === 1);
            });
        }

        /* ---- Load rank entries from data ---- */
        function loadRankInputs(winnersList = []) {
            rankContainer.innerHTML = '';
            if (winnersList.length === 0) {
                // Start with rank 1 by default
                rankContainer.appendChild(buildRankEntry(1, {}));
            } else {
                const sorted = [...winnersList].sort((a, b) => a.rank - b.rank);
                sorted.forEach((w, i) => rankContainer.appendChild(buildRankEntry(i + 1, w)));
            }
        }

        /* ---- Add Rank Button ---- */
        addRankBtn.addEventListener('click', () => {
            const current = rankContainer.querySelectorAll('.winner-rank-entry').length;
            if (current >= 10) {
                alert('Maximum 10 ranked positions allowed.');
                return;
            }
            rankContainer.appendChild(buildRankEntry(current + 1, {}));
        });

        /* ---- Initial load ---- */
        loadRankInputs([]);

        /* ---- Render existing winners list ---- */
        function loadWinnersList() {
            const list = db.achievements || [];
            if (list.length === 0) {
                listMount.innerHTML = `
                    <div class="glass-panel" style="padding:30px; text-align:center; border-color:rgba(255,255,255,0.02);">
                        <i class="fa-solid fa-trophy" style="font-size:28px; color:var(--text-dim); margin-bottom:12px; display:block;"></i>
                        <p style="font-size:12px; color:var(--text-dim);">No tournament records yet. Create your first announcement above.</p>
                    </div>
                `;
                return;
            }
            listMount.innerHTML = list.map(w => {
                const winCount = (w.winnersList || []).length;
                const rank1 = (w.winnersList || []).find(x => x.rank === 1);
                const rank1Name = rank1 ? rank1.teamName : (w.teamName || '—');
                const rank1Logo = rank1 ? rank1.teamLogo : '';
                const logoHtml = rank1Logo
                    ? `<img src="${rank1Logo}" style="width:36px; height:36px; border-radius:50%; border:1.5px solid var(--neon-yellow); object-fit:contain; background:#000; padding:3px;">`
                    : `<div style="width:36px; height:36px; border-radius:50%; background:rgba(255,230,0,0.08); border:1.5px solid rgba(255,230,0,0.2); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-crown" style="color:var(--neon-yellow); font-size:14px;"></i></div>`;
                return `
                    <div class="glass-panel" style="padding:14px 16px; display:flex; justify-content:space-between; align-items:center; border-color:rgba(255,255,255,0.03);">
                        <div style="display:flex; align-items:center; gap:12px; text-align:left; flex:1; min-width:0;">
                            ${logoHtml}
                            <div style="min-width:0;">
                                <span class="font-orbitron" style="font-size:9px; color:var(--neon-yellow);">${w.title || w.event}</span>
                                <h5 class="font-orbitron" style="font-size:12px; color:#fff; margin:3px 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${w.event}</h5>
                                <p style="font-size:10px; color:var(--text-dim); margin:0;">
                                    🥇 <strong style="color:var(--text-silver);">${rank1Name}</strong>
                                    ${winCount > 0 ? ` &bull; <span style="color:var(--neon-cyan);">${winCount} team${winCount !== 1 ? 's' : ''} ranked</span>` : ''}
                                </p>
                            </div>
                        </div>
                        <div style="display:flex; gap:6px; flex-shrink:0; margin-left:10px;">
                            <button class="action-icon-btn approve edit-winner-btn" data-id="${w.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="action-icon-btn delete delete-winner-btn" data-id="${w.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                `;
            }).join('');

            /* Bind delete */
            listMount.querySelectorAll('.delete-winner-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm('Delete this tournament announcement permanently?')) {
                        try {
                            await window.strikzDb.deleteWinner(this.dataset.id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadWinnersList();
                        } catch (err) {
                            alert('Delete failed: ' + err.message);
                        }
                    }
                };
            });

            /* Bind edit */
            listMount.querySelectorAll('.edit-winner-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const w = db.achievements.find(x => x.id === Number(id));
                    if (!w) return;
                    editIdInput.value  = w.id;
                    eventInput.value   = w.event || '';
                    dateInput.value    = w.date  || '';
                    titleInput.value   = w.title || '';
                    rewardInput.value  = w.reward || '';
                    imageInput.value   = w.image || '';
                    updateBannerPreview(w.image || '');
                    detailsInput.value = w.details || '';
                    loadRankInputs(w.winnersList || []);
                    saveBtn.querySelector('.btn-text').textContent = 'UPDATE WINNER RECORD';
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                };
            });
        }

        /* ---- Form Submit ---- */
        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;

            /* Collect ranked team entries */
            const winnersList = [];
            rankContainer.querySelectorAll('.winner-rank-entry').forEach((el, idx) => {
                const rank     = idx + 1;
                const teamName = el.querySelector('.rank-team-name').value.trim();
                const tier     = el.querySelector('.rank-tier').value;
                const prize    = el.querySelector('.rank-prize').value.trim();
                const logo     = el.querySelector('.rank-logo').value.trim();
                if (teamName) {
                    winnersList.push({ rank, teamName, tier, prize, teamLogo: logo });
                }
            });

            /* Derive champion name from rank-1 entry */
            const rank1entry = winnersList.find(x => x.rank === 1);
            const championName = rank1entry ? rank1entry.teamName : 'TBD';

            const winObj = {
                teamName: championName,
                event:    eventInput.value.trim(),
                date:     dateInput.value.trim(),
                title:    titleInput.value.trim(),
                reward:   rewardInput.value.trim(),
                tier:     rank1entry ? (rank1entry.tier || 'gold') : 'gold',
                image:    imageInput.value.trim(),
                details:  detailsInput.value.trim(),
                winnersList
            };

            try {
                if (id) {
                    winObj.id = Number(id);
                    await window.strikzDb.updateWinner(winObj);
                    alert('Tournament standings updated successfully!');
                } else {
                    await window.strikzDb.addWinner(winObj);
                    alert('New tournament announcement created!');
                }

                /* Reset */
                form.reset();
                editIdInput.value = '';
                imageInput.value  = '';
                updateBannerPreview('');
                loadRankInputs([]);
                saveBtn.querySelector('.btn-text').textContent = 'SAVE WINNER RECORD';

                db = await window.strikzDb.fetchSnapshot();
                loadWinnersList();
            } catch (err) {
                alert('Error saving record: ' + err.message);
            }
        };

        loadWinnersList();
    }


    // 7. CHATBOT TICKET MANAGEMENT PANEL
    function renderChatbotTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-comments"></i> CHATBOT INBOX & ENQUIRIES</h3>

            <!-- Partners and Sponsors Section -->
            <div class="glass-panel" style="padding: 20px; margin-bottom: 30px; border-color: rgba(59, 130, 246, 0.15);">
                <h4 class="font-orbitron" style="font-size: 14px; color: #06b6d4; margin-bottom: 15px;"><i class="fa-solid fa-handshake"></i> PARTNER & SPONSOR RELATED QUERIES</h4>
                <div class="history-table-container">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Sender</th>
                                <th>Email Address</th>
                                <th>Enquiry Message</th>
                                <th>Date / Time</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="admin-chat-partner-body">
                            <!-- loaded dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Players Section -->
            <div class="glass-panel" style="padding: 20px; border-color: rgba(59, 130, 246, 0.15);">
                <h4 class="font-orbitron" style="font-size: 14px; color: #3b82f6; margin-bottom: 15px;"><i class="fa-solid fa-gamepad"></i> PLAYER & GAMER RELATED QUERIES</h4>
                <div class="history-table-container">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Sender</th>
                                <th>Email Address</th>
                                <th>Enquiry Message</th>
                                <th>Date / Time</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="admin-chat-player-body">
                            <!-- loaded dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const partnerBody = document.getElementById('admin-chat-partner-body');
        const playerBody = document.getElementById('admin-chat-player-body');

        function loadChatTickets() {
            const list = db.chatbotTickets || [];
            
            const partnerList = list.filter(t => t.type === 'Partner' || t.type === 'Sponsor');
            const playerList = list.filter(t => t.type === 'Player' || !t.type);

            function renderTableRows(tickets, bodyEl) {
                if (tickets.length === 0) {
                    bodyEl.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center" style="padding: 30px; color: var(--text-dim);">No queries in this category.</td>
                        </tr>
                    `;
                    return;
                }

                bodyEl.innerHTML = tickets.map(t => `
                    <tr>
                        <td class="font-orbitron" style="font-size: 11px; font-weight: 700; color: var(--neon-cyan);">${t.id}</td>
                        <td style="font-weight: 600; color: #fff;">${t.senderName}</td>
                        <td style="font-size: 12px;">${t.senderEmail}</td>
                        <td style="font-size: 13px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${t.message}">${t.message}</td>
                        <td style="font-size: 12px; white-space: nowrap;">${t.date}</td>
                        <td><span class="badge-status ${t.status === 'Resolved' ? 'status-approved' : 'status-pending'}">${t.status}</span></td>
                        <td>
                            ${t.status === 'Pending' ? `
                                <button class="admin-action-btn green resolve-btn" data-id="${t.id}" style="padding: 4px 10px; font-size: 9px;">RESOLVE</button>
                            ` : '<span style="color: var(--text-dim); font-size: 11px;">Completed</span>'}
                        </td>
                    </tr>
                `).join('');
            }

            renderTableRows(partnerList, partnerBody);
            renderTableRows(playerList, playerBody);

            [partnerBody, playerBody].forEach(body => {
                body.querySelectorAll('.resolve-btn').forEach(btn => {
                    btn.onclick = async function() {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.resolveChatbotTicket(id);
                            if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                            const tickets = await window.strikzDb.getTickets();
                            db.chatbotTickets = tickets;
                            loadChatTickets();
                        } catch (err) {
                            alert("Resolve failed: " + err.message);
                        }
                    };
                });
            });
        }

        // Run loader
        loadChatTickets();
    }

    function renderSponsorsTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-handshake"></i> PARTNERS & SPONSORS MANAGEMENT</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- Sponsor Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> ADD / EDIT PARTNER / SPONSOR</h4>
                    
                    <form id="admin-sponsor-form" onsubmit="return false;">
                        <input type="hidden" id="edit-sponsor-id">
                        <div class="form-group">
                            <label for="sponsor-name">Sponsor Name</label>
                            <input type="text" id="sponsor-name" placeholder="E.g. Red Bull" required style="color: #fff;">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="sponsor-logo-text">Logo Text (Fallback Label)</label>
                                <input type="text" id="sponsor-logo-text" placeholder="E.g. RED BULL" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="sponsor-tier">Sponsorship Tier</label>
                                <select id="sponsor-tier" style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px; width: 100%;">
                                    <option value="Title">Title Partner</option>
                                    <option value="Platinum">Platinum Sponsor</option>
                                    <option value="Gold">Gold Sponsor</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="sponsor-logo-upload">Sponsor Logo Image (Optional)</label>
                                <input type="file" id="sponsor-logo-upload" accept="image/*" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color:#fff; font-size: 11px; width: 100%;">
                                <input type="hidden" id="sponsor-logo-base64">
                                <div id="sponsor-logo-preview" style="margin-top: 8px; display: none;">
                                    <img src="" style="max-height: 50px; border: 1px solid var(--glass-border); border-radius: 4px; object-fit: contain; background: rgba(255,255,255,0.05); padding: 4px;">
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="sponsor-promo-type">Promotion Type</label>
                                <select id="sponsor-promo-type" style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px; width: 100%;">
                                    <option value="Website">External Website</option>
                                    <option value="Channel">YouTube Channel</option>
                                    <option value="Social">Social Profile</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="sponsor-link">Promotion Link URL</label>
                                <input type="text" id="sponsor-link" placeholder="E.g. https://youtube.com/..." required style="color: #fff;">
                            </div>
                        </div>
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-sponsor" style="margin-top: 15px;">
                            <span class="btn-text">SAVE PARTNER</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Sponsors List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">CURRENT PARTNERS & SPONSORS</h4>
                    <div id="admin-sponsors-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 450px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-sponsor-form');
        const listMount = document.getElementById('admin-sponsors-list');
        const editIdInput = document.getElementById('edit-sponsor-id');
        const nameInput = document.getElementById('sponsor-name');
        const logoTextInput = document.getElementById('sponsor-logo-text');
        const tierSelect = document.getElementById('sponsor-tier');
        const promoTypeSelect = document.getElementById('sponsor-promo-type');
        const linkInput = document.getElementById('sponsor-link');
        const logoFileInput = document.getElementById('sponsor-logo-upload');
        const logoBase64Input = document.getElementById('sponsor-logo-base64');
        const saveBtn = document.getElementById('btn-save-sponsor');

        const logoPreviewContainer = document.getElementById('sponsor-logo-preview');
        const logoPreviewImg = logoPreviewContainer.querySelector('img');

        function updateSponsorLogoPreview(src) {
            if (src) {
                logoPreviewImg.src = src;
                logoPreviewContainer.style.display = 'block';
            } else {
                logoPreviewContainer.style.display = 'none';
            }
        }

        // Bind logo file loader
        if (logoFileInput) {
            logoFileInput.onchange = async function() {
                const file = logoFileInput.files[0];
                if (!file) return;
                try {
                    const res = await window.strikzDb.uploadFile(file);
                    logoBase64Input.value = res.imageUrl;
                    updateSponsorLogoPreview(res.imageUrl);
                    alert("Image uploaded successfully!");
                } catch (err) {
                    alert("Upload failed: " + err.message);
                }
            };
        }

        function loadSponsorsList() {
            const list = db.sponsors || [];
            listMount.innerHTML = list.map(s => `
                <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left; display: flex; align-items: center; gap: 15px;">
                        ${s.logo ? `<img src="${s.logo}" style="max-height: 40px; max-width: 60px; object-fit: contain; border-radius: 4px; background: rgba(255,255,255,0.05); padding: 2px;">` : `<div style="border: 1px dashed var(--glass-border); padding: 5px 10px; font-size: 10px; font-weight:700;">No Image</div>`}
                        <div>
                            <span class="font-orbitron" style="font-size: 9px; color: var(--neon-yellow);">${s.tier.toUpperCase()} TIER</span>
                            <h5 class="font-orbitron" style="font-size: 13px; color: #fff; margin: 2px 0;">${s.name}</h5>
                            <p style="font-size: 11px; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; margin: 0;">
                                Type: <strong>${s.promoType}</strong> | Link: <a href="${s.link}" target="_blank" style="color: var(--neon-orange);">${s.link}</a>
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="action-icon-btn approve edit-sponsor-btn" data-id="${s.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-sponsor-btn" data-id="${s.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');

            listMount.querySelectorAll('.delete-sponsor-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this sponsor entity?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteSponsor(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadSponsorsList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            listMount.querySelectorAll('.edit-sponsor-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const s = db.sponsors.find(x => x.id === Number(id));
                    if (s) {
                        editIdInput.value = s.id;
                        nameInput.value = s.name;
                        logoTextInput.value = s.logoText;
                        tierSelect.value = s.tier;
                        promoTypeSelect.value = s.promoType || 'Website';
                        linkInput.value = s.link;
                        logoBase64Input.value = s.logo || '';
                        updateSponsorLogoPreview(s.logo || '');
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE PARTNER';
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;
            const sponsorObj = {
                name: nameInput.value.trim(),
                logoText: logoTextInput.value.trim(),
                tier: tierSelect.value,
                promoType: promoTypeSelect.value,
                link: linkInput.value.trim(),
                logo: logoBase64Input.value.trim() || ''
            };

            try {
                if (id) {
                    sponsorObj.id = id;
                    await window.strikzDb.updateSponsor(sponsorObj);
                    alert("Sponsor updated successfully!");
                } else {
                    await window.strikzDb.addSponsor(sponsorObj);
                    alert("Sponsor added successfully!");
                }

                form.reset();
                editIdInput.value = '';
                logoBase64Input.value = '';
                updateSponsorLogoPreview('');
                saveBtn.querySelector('.btn-text').textContent = 'SAVE PARTNER';
                db = await window.strikzDb.fetchSnapshot();
                loadSponsorsList();
            } catch (err) {
                alert("Error saving sponsor: " + err.message);
            }
        };

        loadSponsorsList();
    }

    function renderManagementTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-users-gear"></i> LEADERSHIP MANAGEMENT</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- Management Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> ADD / EDIT MEMBER</h4>
                    
                    <form id="admin-management-form" onsubmit="return false;">
                        <input type="hidden" id="edit-management-id">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="mgmt-name">Real Name</label>
                                <input type="text" id="mgmt-name" placeholder="E.g. Satyajit Mohanty" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="mgmt-tag">Gamer Tag</label>
                                <input type="text" id="mgmt-tag" placeholder="E.g. Viper" required style="color: #fff;">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="mgmt-role">Role / Title</label>
                                <input type="text" id="mgmt-role" placeholder="E.g. Founder & CEO" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="mgmt-avatar">Avatar Seed / Upload Image</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="text" id="mgmt-avatar" placeholder="E.g. viperceo" required style="color: #fff; flex: 1;">
                                    <div style="position: relative; overflow: hidden; display: inline-block;">
                                        <button type="button" class="admin-action-btn green" style="margin: 0; padding: 10px 14px; height: 100%; white-space: nowrap;"><i class="fa-solid fa-upload"></i> UPLOAD</button>
                                        <input type="file" id="mgmt-avatar-file" accept="image/*" style="position: absolute; font-size: 100px; opacity: 0; right: 0; top: 0; cursor: pointer;">
                                    </div>
                                </div>
                                <div id="mgmt-avatar-preview" style="margin-top: 8px; display: none;">
                                    <img src="" style="max-height: 80px; border-radius: 50%; border: 1px solid var(--glass-border); width: 80px; height: 80px; object-fit: cover;">
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="mgmt-insta">Instagram Link</label>
                                <input type="text" id="mgmt-insta" placeholder="E.g. https://instagram.com/..." style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="mgmt-youtube">YouTube Link</label>
                                <input type="text" id="mgmt-youtube" placeholder="E.g. https://youtube.com/..." style="color: #fff;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="mgmt-bio">Short Bio</label>
                            <textarea id="mgmt-bio" rows="3" placeholder="Bio lines..." required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                        </div>
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-management" style="margin-top: 15px;">
                            <span class="btn-text">SAVE MEMBER</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Management List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">CURRENT LEADERSHIP</h4>
                    <div id="admin-management-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 450px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-management-form');
        const listMount = document.getElementById('admin-management-list');
        const editIdInput = document.getElementById('edit-management-id');
        const nameInput = document.getElementById('mgmt-name');
        const tagInput = document.getElementById('mgmt-tag');
        const roleInput = document.getElementById('mgmt-role');
        const avatarInput = document.getElementById('mgmt-avatar');
        const instaInput = document.getElementById('mgmt-insta');
        const youtubeInput = document.getElementById('mgmt-youtube');
        const bioInput = document.getElementById('mgmt-bio');
        const saveBtn = document.getElementById('btn-save-management');

        const avatarFileInput = document.getElementById('mgmt-avatar-file');
        const avatarPreviewContainer = document.getElementById('mgmt-avatar-preview');
        const avatarPreviewImg = avatarPreviewContainer.querySelector('img');

        function updateAvatarPreview(src) {
            if (src) {
                if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/uploads')) {
                    avatarPreviewImg.src = src;
                } else {
                    avatarPreviewImg.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${src}&backgroundColor=0a0a0f`;
                }
                avatarPreviewContainer.style.display = 'block';
            } else {
                avatarPreviewContainer.style.display = 'none';
            }
        }

        avatarInput.addEventListener('input', () => updateAvatarPreview(avatarInput.value.trim()));

        avatarFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const res = await window.strikzDb.uploadFile(file);
                    avatarInput.value = res.imageUrl;
                    updateAvatarPreview(res.imageUrl);
                    alert("Image uploaded successfully!");
                } catch (err) {
                    alert("Upload failed: " + err.message);
                }
            }
        });

        function loadManagementList() {
            const list = db.management || [];
            listMount.innerHTML = list.map(m => `
                <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 12px; align-items: center; text-align: left;">
                        <img src="${m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.tag}&backgroundColor=0a0a0f`}" style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--glass-border);">
                        <div>
                            <span class="font-orbitron" style="font-size: 9px; color: var(--neon-orange);">${m.role}</span>
                            <h5 style="font-size: 13px; color: #fff; margin: 2px 0; font-weight:700;">${m.name} (${m.tag})</h5>
                            <p style="font-size: 11px; color: var(--text-dim); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;">${m.bio}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="action-icon-btn approve edit-mgmt-btn" data-id="${m.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-mgmt-btn" data-id="${m.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');

            listMount.querySelectorAll('.delete-mgmt-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this management member permanently?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteManagement(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadManagementList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            listMount.querySelectorAll('.edit-mgmt-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const m = db.management.find(x => x.id === Number(id));
                    if (m) {
                        editIdInput.value = m.id;
                        nameInput.value = m.name;
                        tagInput.value = m.tag;
                        roleInput.value = m.role;
                        
                        // Extract seed if it is a dicebear URL
                        let avatarSeed = m.avatar || '';
                        if (avatarSeed.includes('seed=')) {
                            avatarSeed = avatarSeed.split('seed=')[1].split('&')[0];
                        }
                        avatarInput.value = avatarSeed;
                        updateAvatarPreview(m.avatar || '');
                        
                        instaInput.value = m.socials ? (m.socials.instagram || '') : '';
                        youtubeInput.value = m.socials ? (m.socials.youtube || '') : '';
                        bioInput.value = m.bio;
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE MEMBER';
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;
            const seed = avatarInput.value.trim() || tagInput.value.trim();
            const avatarUrl = (seed.startsWith('http') || seed.startsWith('data:') || seed.startsWith('/uploads')) ? seed : `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=0a0a0f`;
            
            const mgmtObj = {
                name: nameInput.value.trim(),
                tag: tagInput.value.trim(),
                role: roleInput.value.trim(),
                avatar: avatarUrl,
                bio: bioInput.value.trim(),
                socials: {
                    instagram: instaInput.value.trim() || '#',
                    youtube: youtubeInput.value.trim() || '#'
                }
            };

            try {
                if (id) {
                    mgmtObj.id = id;
                    await window.strikzDb.updateManagement(mgmtObj);
                    alert("Management member updated successfully!");
                } else {
                    await window.strikzDb.addManagement(mgmtObj);
                    alert("Management member added successfully!");
                }

                form.reset();
                editIdInput.value = '';
                updateAvatarPreview('');
                saveBtn.querySelector('.btn-text').textContent = 'SAVE MEMBER';
                db = await window.strikzDb.fetchSnapshot();
                loadManagementList();
            } catch (err) {
                alert("Error saving management member: " + err.message);
            }
        };

        loadManagementList();
    }

    // 10. GALLERY CONTROL PANEL
    function renderGalleryTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-images"></i> GALLERY HIGHLIGHTS CONTROL</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- Upload Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> UPLOAD MEDIA ASSET</h4>
                    
                    <form id="admin-gallery-form" onsubmit="return false;">
                        <div class="form-group">
                            <label for="gallery-image-title">Asset Title</label>
                            <input type="text" id="gallery-image-title" placeholder="E.g. Lifting Trophy at FFIC" required style="color: #fff;">
                        </div>
                        <div class="form-group">
                            <label for="gallery-image-album">Album Name (Create new or select)</label>
                            <input type="text" id="gallery-image-album" placeholder="E.g. Championships, Bootcamp, Team Life" required style="color: #fff;" list="album-suggestions">
                            <datalist id="album-suggestions">
                                <!-- Populated dynamically -->
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label for="gallery-file-upload">Image File</label>
                            <input type="file" id="gallery-file-upload" accept="image/*" required style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color:#fff; font-size: 11px; width: 100%;">
                        </div>
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-gallery">
                            <span class="btn-text">UPLOAD ASSET</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Gallery Grid List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">CURRENT GALLERY ASSETS</h4>
                    <div id="admin-gallery-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 450px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-gallery-form');
        const listMount = document.getElementById('admin-gallery-list');
        const titleInput = document.getElementById('gallery-image-title');
        const albumInput = document.getElementById('gallery-image-album');
        const fileInput = document.getElementById('gallery-file-upload');
        const datalist = document.getElementById('album-suggestions');

        function loadGalleryList() {
            const list = db.gallery || [];
            
            // Populate datalist suggestions
            const uniqueAlbums = [...new Set(list.map(img => img.album || 'General'))];
            datalist.innerHTML = uniqueAlbums.map(a => `<option value="${a}">`).join('');

            listMount.innerHTML = list.length === 0 ? `
                <div class="text-center" style="padding: 30px; color: var(--text-dim);">No gallery images uploaded.</div>
            ` : list.map(g => `
                <div class="glass-panel" style="padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${g.url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid var(--glass-border);">
                        <div style="text-align: left;">
                            <span class="font-orbitron" style="font-size: 9px; color: var(--neon-yellow);">${(g.album || 'General').toUpperCase()}</span>
                            <h5 class="font-orbitron" style="font-size: 12px; color: #fff; margin: 2px 0;">${g.title}</h5>
                        </div>
                    </div>
                    <button class="action-icon-btn delete delete-gallery-btn" data-id="${g.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `).join('');

            // Bind Delete events
            listMount.querySelectorAll('.delete-gallery-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this gallery image permanently?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteGalleryItem(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadGalleryList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const file = fileInput.files[0];
            if (!file) return;

            try {
                const uploadRes = await window.strikzDb.uploadFile(file);
                const item = {
                    type: 'image',
                    url: uploadRes.imageUrl,
                    title: titleInput.value.trim(),
                    album: albumInput.value.trim() || 'General'
                };

                await window.strikzDb.addGalleryItem(item);
                alert("Gallery image uploaded successfully!");
                form.reset();
                db = await window.strikzDb.fetchSnapshot();
                loadGalleryList();
            } catch (err) {
                alert("Error uploading gallery image: " + err.message);
            }
        };

        loadGalleryList();
    }

    // 11. TEAM MEMBERS CONTROL PANEL
    function renderTeamMembersTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-users"></i> OFFICIAL ROSTER MEMBERS CONTROL</h3>
            
            <div class="admin-crud-grid">
                <!-- Player Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;" id="roster-form-title"><i class="fa-solid fa-circle-plus"></i> ADD TEAM MEMBER / STAFF</h4>
                    
                    <form id="admin-roster-form" onsubmit="return false;">
                        <input type="hidden" id="edit-player-tag">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="player-tag">Player Tag / Nickname (Unique)</label>
                                <input type="text" id="player-tag" placeholder="E.g. Viper" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="player-fullname">Full Name</label>
                                <input type="text" id="player-fullname" placeholder="E.g. Aarav Sharma" required style="color: #fff;">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="player-role">Roster Role</label>
                                <input type="text" id="player-role" placeholder="E.g. Rusher, IGL, Coach, Manager" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="player-avatar-upload">Avatar / Photo (Optional)</label>
                                <input type="file" id="player-avatar-upload" accept="image/*" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color:#fff; font-size: 11px; width: 100%;">
                                <input type="hidden" id="player-avatar-base64">
                            </div>
                        </div>

                        <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">STATISTICS</h5>
                        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
                            <div class="form-group">
                                <label style="font-size:9px;">K/D RATIO</label>
                                <input type="text" id="player-kd" placeholder="4.85" value="N/A" required style="color: #fff; padding: 6px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:9px;">HEADSHOT %</label>
                                <input type="text" id="player-hs" placeholder="65%" value="N/A" required style="color: #fff; padding: 6px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:9px;">MATCHES</label>
                                <input type="text" id="player-matches" placeholder="1200" value="N/A" required style="color: #fff; padding: 6px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:9px;">WIN RATE</label>
                                <input type="text" id="player-winrate" placeholder="45%" value="N/A" required style="color: #fff; padding: 6px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:9px;">RANK</label>
                                <input type="text" id="player-rank" placeholder="Master" value="N/A" required style="color: #fff; padding: 6px;">
                            </div>
                        </div>

                        <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">SOCIAL CHANNELS</h5>
                        <div class="form-row">
                            <div class="form-group">
                                <label style="font-size:9px;">X / TWITTER LINK</label>
                                <input type="text" id="player-twitter" value="#" required style="color: #fff; padding: 6px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:9px;">YOUTUBE LINK</label>
                                <input type="text" id="player-youtube" value="#" required style="color: #fff; padding: 6px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:9px;">INSTAGRAM LINK</label>
                                <input type="text" id="player-instagram" value="#" required style="color: #fff; padding: 6px;">
                            </div>
                        </div>

                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-roster" style="margin-top: 15px;">
                            <span class="btn-text">SAVE ROSTER MEMBER</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Members List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">CURRENT SQUAD MEMBERS</h4>
                    <div id="admin-roster-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 520px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-roster-form');
        const listMount = document.getElementById('admin-roster-list');
        const editTagInput = document.getElementById('edit-player-tag');
        
        const tagInput = document.getElementById('player-tag');
        const fullnameInput = document.getElementById('player-fullname');
        const roleInput = document.getElementById('player-role');
        const fileInput = document.getElementById('player-avatar-upload');
        const base64Input = document.getElementById('player-avatar-base64');
        
        const kdInput = document.getElementById('player-kd');
        const hsInput = document.getElementById('player-hs');
        const matchesInput = document.getElementById('player-matches');
        const winrateInput = document.getElementById('player-winrate');
        const rankInput = document.getElementById('player-rank');
        
        const twitterInput = document.getElementById('player-twitter');
        const youtubeInput = document.getElementById('player-youtube');
        const instagramInput = document.getElementById('player-instagram');
        
        const saveBtn = document.getElementById('btn-save-roster');
        const formTitle = document.getElementById('roster-form-title');

        // Bind Base64 File Loader
        fileInput.onchange = async function() {
            const file = fileInput.files[0];
            if (!file) return;
            try {
                const res = await window.strikzDb.uploadFile(file);
                base64Input.value = res.imageUrl;
                alert("Avatar uploaded successfully!");
            } catch (err) {
                alert("Upload failed: " + err.message);
            }
        };

        function loadRosterList() {
            const list = db.roster || [];
            listMount.innerHTML = list.length === 0 ? `
                <div class="text-center" style="padding: 30px; color: var(--text-dim);">No roster players configured.</div>
            ` : list.map(p => `
                <div class="glass-panel" style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                        <img src="${p.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + p.tag + '&backgroundColor=0a0a0f'}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 50%; border: 1px solid var(--neon-yellow-border);">
                        <div>
                            <span class="font-orbitron" style="font-size: 8px; color: var(--neon-yellow);">${p.role.toUpperCase()}</span>
                            <h5 class="font-orbitron" style="font-size: 13px; color: #fff; margin: 2px 0;">STRIKZ.${p.tag}</h5>
                            <p style="font-size: 11px; color: var(--text-dim);">${p.fullName}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="action-icon-btn approve edit-roster-btn" data-tag="${p.tag}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-roster-btn" data-tag="${p.tag}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');

            // Bind Delete
            listMount.querySelectorAll('.delete-roster-btn').forEach(btn => {
                btn.onclick = async function() {
                    const tag = this.dataset.tag;
                    if (confirm(`Remove STRIKZ.${tag} from the official team roster permanently?`)) {
                        try {
                            await window.strikzDb.deleteRosterPlayer(tag);
                            db = await window.strikzDb.fetchSnapshot();
                            loadRosterList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            // Bind Edit
            listMount.querySelectorAll('.edit-roster-btn').forEach(btn => {
                btn.onclick = function() {
                    const tag = this.dataset.tag;
                    const p = db.roster.find(x => x.tag === tag);
                    if (p) {
                        editTagInput.value = p.tag;
                        tagInput.value = p.tag;
                        tagInput.disabled = false; // allow editing unique key / Gamer Tag
                        fullnameInput.value = p.fullName;
                        roleInput.value = p.role;
                        
                        base64Input.value = p.avatar || '';
                        fileInput.required = false;

                        kdInput.value = p.stats ? p.stats.kd : 'N/A';
                        hsInput.value = p.stats ? p.stats.hs : 'N/A';
                        matchesInput.value = p.stats ? p.stats.matches : 'N/A';
                        winrateInput.value = p.stats ? p.stats.winRate || 'N/A' : 'N/A';
                        rankInput.value = p.stats ? p.stats.rank || 'N/A' : 'N/A';
                        
                        twitterInput.value = p.socials ? p.socials.twitter : '#';
                        youtubeInput.value = p.socials ? p.socials.youtube : '#';
                        instagramInput.value = p.socials ? p.socials.instagram : '#';

                        formTitle.innerHTML = `<i class="fa-solid fa-user-pen"></i> EDIT PLAYER PROFILE: STRIKZ.${p.tag}`;
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE PROFILE';
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const editTag = editTagInput.value;
            
            const playerObj = {
                tag: tagInput.value.trim(),
                fullName: fullnameInput.value.trim(),
                role: roleInput.value.trim(),
                avatar: base64Input.value.trim() || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + tagInput.value.trim() + '&backgroundColor=0a0a0f',
                stats: {
                    kd: kdInput.value.trim(),
                    hs: hsInput.value.trim(),
                    matches: matchesInput.value.trim(),
                    winRate: winrateInput.value.trim(),
                    rank: rankInput.value.trim()
                },
                socials: {
                    twitter: twitterInput.value.trim(),
                    youtube: youtubeInput.value.trim(),
                    instagram: instagramInput.value.trim()
                }
            };

            try {
                if (editTag) {
                    // Update
                    await window.strikzDb.updateRosterPlayer(editTag, playerObj);
                    alert("Player profile updated successfully!");
                } else {
                    // Check duplicate tag
                    const duplicate = db.roster.some(x => x.tag.toLowerCase() === playerObj.tag.toLowerCase());
                    if (duplicate) {
                        alert("A player with this Gamer Tag already exists!");
                        return;
                    }
                    // Insert
                    await window.strikzDb.addRosterPlayer(playerObj);
                    alert("New player added to team roster!");
                }

                form.reset();
                editTagInput.value = '';
                tagInput.disabled = false;
                base64Input.value = '';
                fileInput.required = false;
                
                formTitle.innerHTML = `<i class="fa-solid fa-circle-plus"></i> ADD TEAM MEMBER / STAFF`;
                saveBtn.querySelector('.btn-text').textContent = 'SAVE ROSTER MEMBER';
                
                db = await window.strikzDb.fetchSnapshot();
                loadRosterList();
            } catch (err) {
                alert("Error saving player profile: " + err.message);
            }
        };

        loadRosterList();
    }

    // 11b. HISTORY / TIMELINE MILESTONES TAB
    function renderHistoryTab(mount, db) {
        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-trophy"></i> TOURNAMENT WINNERS / HISTORY EDIT</h3>
            
            <div class="grid-2" style="align-items: start;">
                <!-- History Winners Form -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-circle-plus"></i> ADD / EDIT WINNER</h4>
                    
                    <form id="admin-history-form" onsubmit="return false;">
                        <input type="hidden" id="edit-history-id">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="history-type">Tournament Type</label>
                                <select id="history-type" required style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px; width: 100%;">
                                    <option value="recent">Recent Tournament</option>
                                    <option value="past">Past Tournament</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="history-rank">Winner Rank / Position</label>
                                <select id="history-rank" required style="background:#101010; border:1px solid var(--glass-border); padding:10px; color:#fff; border-radius:4px; width: 100%;">
                                    <option value="1">1st Place (Champion)</option>
                                    <option value="2">2nd Place (Runner Up)</option>
                                    <option value="3">3rd Place</option>
                                    <option value="4">4th Place</option>
                                    <option value="5">5th Place</option>
                                    <option value="6">6th Place</option>
                                    <option value="7">7th Place</option>
                                    <option value="8">8th Place</option>
                                    <option value="9">9th Place</option>
                                    <option value="10">10th Place</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="history-tournament-name">Tournament Name</label>
                                <input type="text" id="history-tournament-name" placeholder="E.g. FFMAX Championship 2025" required style="color: #fff;">
                            </div>
                            <div class="form-group">
                                <label for="history-date">Event Date</label>
                                <input type="text" id="history-date" placeholder="E.g. October 2025" required style="color: #fff;">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="history-title">Winning Team Name</label>
                            <input type="text" id="history-title" placeholder="E.g. STRIKZ ESPORTS" required style="color: #fff;">
                        </div>
                        
                        <div class="form-group">
                            <label for="history-logo">Team Logo Image / Upload</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="text" id="history-logo" placeholder="E.g. /uploads/logo.png" style="color: #fff; flex: 1;">
                                <div style="position: relative; overflow: hidden; display: inline-block;">
                                    <button type="button" class="admin-action-btn green" style="margin: 0; padding: 10px 14px; height: 100%; white-space: nowrap;"><i class="fa-solid fa-upload"></i> UPLOAD</button>
                                    <input type="file" id="history-logo-file" accept="image/*" style="position: absolute; font-size: 100px; opacity: 0; right: 0; top: 0; cursor: pointer;">
                                </div>
                            </div>
                            <div id="history-logo-preview" style="margin-top: 8px; display: none;">
                                <img src="" style="max-height: 50px; border: 1px solid var(--glass-border); border-radius: 4px; object-fit: contain; background: rgba(255,255,255,0.05); padding: 4px;">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="history-desc">Prize / Achievement Details</label>
                            <textarea id="history-desc" rows="3" placeholder="E.g. Champions - $80,000 USD Prize Pool" required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                        </div>
                        
                        <button type="submit" class="cta-button btn-neon-cyan w-full" id="btn-save-history" style="margin-top: 15px;">
                            <span class="btn-text">SAVE WINNER</span>
                        </button>
                    </form>
                </div>

                <!-- Existing Winners List -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--text-silver); margin-bottom: 5px;">CURRENT WINNERS BOARD</h4>
                    <div id="admin-history-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 520px; overflow-y: auto;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('admin-history-form');
        const listMount = document.getElementById('admin-history-list');
        const editIdInput = document.getElementById('edit-history-id');
        const typeSelect = document.getElementById('history-type');
        const rankSelect = document.getElementById('history-rank');
        const tournamentNameInput = document.getElementById('history-tournament-name');
        const dateInput = document.getElementById('history-date');
        const titleInput = document.getElementById('history-title');
        const logoInput = document.getElementById('history-logo');
        const logoFileInput = document.getElementById('history-logo-file');
        const logoPreviewContainer = document.getElementById('history-logo-preview');
        const logoPreviewImg = logoPreviewContainer.querySelector('img');
        const descInput = document.getElementById('history-desc');
        const saveBtn = document.getElementById('btn-save-history');

        function updateLogoPreview(src) {
            if (src) {
                logoPreviewImg.src = src;
                logoPreviewContainer.style.display = 'block';
            } else {
                logoPreviewContainer.style.display = 'none';
            }
        }

        logoInput.addEventListener('input', () => updateLogoPreview(logoInput.value.trim()));

        if (logoFileInput) {
            logoFileInput.onchange = async function() {
                const file = logoFileInput.files[0];
                if (!file) return;
                try {
                    const res = await window.strikzDb.uploadFile(file);
                    logoInput.value = res.imageUrl;
                    updateLogoPreview(res.imageUrl);
                    alert("Team logo uploaded successfully!");
                } catch (err) {
                    alert("Upload failed: " + err.message);
                }
            };
        }

        function loadHistoryList() {
            const list = [...(db.history || [])].sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'recent' ? -1 : 1;
                }
                return (a.rank || 99) - (b.rank || 99);
            });
            listMount.innerHTML = list.map(h => {
                const logoHtml = h.logo 
                    ? `<img src="${h.logo}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px; background: rgba(255,255,255,0.05); padding: 2px; border: 1px solid var(--glass-border);">` 
                    : `<div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border: 1px dashed var(--glass-border); border-radius:4px; font-size:16px; color:var(--neon-yellow);"><i class="fa-solid fa-shield"></i></div>`;
                const typeLabel = h.type === 'recent' 
                    ? `<span style="background:rgba(0,240,255,0.1); color:var(--neon-cyan); padding:2px 6px; border-radius:3px; font-size:8px; font-weight:bold; margin-left:6px; border:1px solid rgba(0,240,255,0.2);">RECENT</span>`
                    : `<span style="background:rgba(255,255,255,0.05); color:var(--text-dim); padding:2px 6px; border-radius:3px; font-size:8px; font-weight:bold; margin-left:6px; border:1px solid rgba(255,255,255,0.1);">PAST</span>`;
                return `
                <div class="glass-panel" style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="display: flex; gap: 12px; align-items: center; text-align: left;">
                        ${logoHtml}
                        <div>
                            <span class="font-orbitron" style="font-size: 9px; color: var(--neon-yellow); font-weight:800;">RANK #${h.rank || 'N/A'} ${typeLabel}</span>
                            <h5 class="font-orbitron" style="font-size: 13px; color: #fff; margin: 2px 0;">${h.title}</h5>
                            <p style="font-size: 11px; color: var(--text-dim); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;">
                                <strong>${h.tournamentName || h.year || '—'}</strong> (${h.date || '—'})
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="action-icon-btn approve edit-history-btn" data-id="${h.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-icon-btn delete delete-history-btn" data-id="${h.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                `;
            }).join('');

            listMount.querySelectorAll('.delete-history-btn').forEach(btn => {
                btn.onclick = async function() {
                    if (confirm("Delete this tournament winner permanently?")) {
                        const id = this.dataset.id;
                        try {
                            await window.strikzDb.deleteHistory(id);
                            db = await window.strikzDb.fetchSnapshot();
                            loadHistoryList();
                        } catch (err) {
                            alert("Delete failed: " + err.message);
                        }
                    }
                };
            });

            listMount.querySelectorAll('.edit-history-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const h = db.history.find(x => x.id === Number(id));
                    if (h) {
                        editIdInput.value = h.id;
                        typeSelect.value = h.type || 'recent';
                        rankSelect.value = h.rank || '1';
                        tournamentNameInput.value = h.tournamentName || h.year || '';
                        dateInput.value = h.date || '';
                        titleInput.value = h.title;
                        logoInput.value = h.logo || '';
                        updateLogoPreview(h.logo || '');
                        descInput.value = h.description;
                        saveBtn.querySelector('.btn-text').textContent = 'UPDATE WINNER';
                    }
                };
            });
        }

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const id = editIdInput.value;
            const historyObj = {
                type: typeSelect.value,
                rank: Number(rankSelect.value),
                tournamentName: tournamentNameInput.value.trim(),
                date: dateInput.value.trim(),
                year: dateInput.value.trim(),
                title: titleInput.value.trim(),
                logo: logoInput.value.trim(),
                description: descInput.value.trim()
            };

            try {
                if (id) {
                    historyObj.id = Number(id);
                    await window.strikzDb.updateHistory(historyObj);
                    alert("Winner updated successfully!");
                } else {
                    await window.strikzDb.addHistory(historyObj);
                    alert("Winner added successfully!");
                }

                form.reset();
                editIdInput.value = '';
                logoInput.value = '';
                updateLogoPreview('');
                saveBtn.querySelector('.btn-text').textContent = 'SAVE WINNER';
                db = await window.strikzDb.fetchSnapshot();
                loadHistoryList();
            } catch (err) {
                alert("Error saving winner: " + err.message);
            }
        };

        loadHistoryList();
    }

    // 12. WEBSITE SETTINGS PANEL
    function renderSettingsTab(mount, db) {
        const settings = window.strikzDb.getSettings();

        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-gears"></i> WEBSITE GLOBALS & SETTINGS</h3>
            
            <div class="glass-panel" style="padding: 30px; border-color: rgba(255,255,255,0.03); max-width: 700px;">
                <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 20px;"><i class="fa-solid fa-pen-to-square"></i> EDIT SITE INFORMATION</h4>
                
                <form id="admin-settings-form" onsubmit="return false;">
                    <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">COMMUNITY SOCIAL LINKS</h5>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="set-discord">Discord Invite Link</label>
                            <input type="text" id="set-discord" value="${settings.discordLink || ''}" required style="color: #fff;">
                        </div>
                        <div class="form-group">
                            <label for="set-instagram">Instagram Channel</label>
                            <input type="text" id="set-instagram" value="${settings.instagramLink || ''}" required style="color: #fff;">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="set-youtube">YouTube Channel Link</label>
                            <input type="text" id="set-youtube" value="${settings.youtubeLink || ''}" required style="color: #fff;">
                        </div>
                        <div class="form-group">
                            <label for="set-twitter">X / Twitter Channel Link</label>
                            <input type="text" id="set-twitter" value="${settings.twitterLink || ''}" required style="color: #fff;">
                        </div>
                    </div>

                    <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">DIRECT CONTACT DETAILS</h5>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="set-support-email">Support Communications Email</label>
                            <input type="email" id="set-support-email" value="${settings.supportEmail || ''}" required style="color: #fff;">
                        </div>
                        <div class="form-group">
                            <label for="set-partner-email">Brand Partnerships Email</label>
                            <input type="email" id="set-partner-email" value="${settings.partnerEmail || ''}" required style="color: #fff;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="set-address">HQ / Office Location Address</label>
                        <input type="text" id="set-address" value="${settings.address || ''}" required style="color: #fff;">
                    </div>

                    <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">ARENA META INFORMATION</h5>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="set-est-year">Established Year</label>
                            <input type="text" id="set-est-year" value="${settings.establishedYear || '2022'}" required style="color: #fff;">
                        </div>
                        <div class="form-group">
                            <label for="set-arena-location">Arena Location</label>
                            <input type="text" id="set-arena-location" value="${settings.arenaLocation || 'Bermuda Arena'}" required style="color: #fff;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="set-history-heading">Journey / History Section Heading</label>
                        <input type="text" id="set-history-heading" value="${settings.historyHeading || 'OUR JOURNEY TO GLORY'}" required style="color: #fff;">
                    </div>

                    <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">ROSTER STATISTICS VISIBILITY</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--text-silver);">
                            <input type="checkbox" id="set-show-kd" ${settings.showKd !== false ? 'checked' : ''} style="width: 16px; height: 16px;"> K/D Ratio
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--text-silver);">
                            <input type="checkbox" id="set-show-hs" ${settings.showHs !== false ? 'checked' : ''} style="width: 16px; height: 16px;"> Headshot %
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--text-silver);">
                            <input type="checkbox" id="set-show-matches" ${settings.showMatches !== false ? 'checked' : ''} style="width: 16px; height: 16px;"> Matches
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--text-silver);">
                            <input type="checkbox" id="set-show-winrate" ${settings.showWinRate === true ? 'checked' : ''} style="width: 16px; height: 16px;"> Win Rate
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--text-silver);">
                            <input type="checkbox" id="set-show-rank" ${settings.showRank !== false ? 'checked' : ''} style="width: 16px; height: 16px;"> Rank
                        </label>
                    </div>

                    <button type="submit" class="cta-button btn-neon-cyan w-full" style="margin-top: 20px; padding: 15px;">
                        <span class="btn-text">APPLY GLOBAL CHANGES</span>
                    </button>
                </form>
            </div>
        `;

        const form = document.getElementById('admin-settings-form');
        
        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const updated = {
                discordLink: document.getElementById('set-discord').value.trim(),
                instagramLink: document.getElementById('set-instagram').value.trim(),
                youtubeLink: document.getElementById('set-youtube').value.trim(),
                twitterLink: document.getElementById('set-twitter').value.trim(),
                supportEmail: document.getElementById('set-support-email').value.trim(),
                partnerEmail: document.getElementById('set-partner-email').value.trim(),
                address: document.getElementById('set-address').value.trim(),
                establishedYear: document.getElementById('set-est-year').value.trim(),
                arenaLocation: document.getElementById('set-arena-location').value.trim(),
                historyHeading: document.getElementById('set-history-heading').value.trim(),
                showKd: document.getElementById('set-show-kd').checked,
                showHs: document.getElementById('set-show-hs').checked,
                showMatches: document.getElementById('set-show-matches').checked,
                showWinRate: document.getElementById('set-show-winrate').checked,
                showRank: document.getElementById('set-show-rank').checked
            };

            try {
                await window.strikzDb.updateSettings(updated);
                alert("Global site settings updated successfully!");
                
                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
            } catch (err) {
                alert("Error updating settings: " + err.message);
            }
        };
    }

    // 13. EMAIL SYSTEM CONTROL CENTER Tab Panel
    async function renderEmailTab(mount, db) {
        const token = localStorage.getItem('strikz_jwt_token');
        const adminFetch = async (url, options = {}) => {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            };
            const res = await fetch(url, { ...options, headers });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        mount.innerHTML = `
            <div style="padding: 10px;">
                <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;">
                    <i class="fa-solid fa-envelope"></i> EMAIL TRANSMISSION CONTROL CENTER
                </h3>
                
                <!-- Tab sub-navigation -->
                <div class="admin-table-controls" style="margin-bottom: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px;">
                    <button class="cta-button btn-neon-cyan active sub-tab-btn" data-subtab="smtp-config" style="padding: 8px 16px; font-size: 11px;">SMTP CONFIG & CONTROLS</button>
                    <button class="cta-button btn-neon-yellow sub-tab-btn" data-subtab="templates-editor" style="padding: 8px 16px; font-size: 11px; margin-left: 10px;">TEMPLATES</button>
                    <button class="cta-button btn-neon-orange sub-tab-btn" data-subtab="broadcasts" style="padding: 8px 16px; font-size: 11px; margin-left: 10px;">BROADCAST ENGINE</button>
                    <button class="cta-button btn-neon-cyan sub-tab-btn" data-subtab="logs-queue" style="padding: 8px 16px; font-size: 11px; margin-left: 10px;">LOGS & QUEUE</button>
                </div>

                <!-- SUB TAB CONTENTS -->
                <div id="email-subtab-container"></div>
            </div>
        `;

        // Bind Sub-Tab navigation buttons
        const subTabBtns = mount.querySelectorAll('.sub-tab-btn');
        subTabBtns.forEach(btn => {
            btn.onclick = function() {
                subTabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const subtab = this.dataset.subtab;
                loadSubTab(subtab);
            };
        });

        // Initialize first subtab
        loadSubTab('smtp-config');

        async function loadSubTab(subtab) {
            const container = document.getElementById('email-subtab-container');
            container.innerHTML = `<div style="text-align:center; padding:40px;"><div class="loader-spinner"></div><p style="margin-top:10px; color:var(--text-dim);">FETCHING EMAIL SECTOR FILES...</p></div>`;
            
            try {
                if (subtab === 'smtp-config') {
                    const settingsRes = await adminFetch('/api/v1/admin/email/settings');
                    const analyticsRes = await adminFetch('/api/v1/admin/email/analytics');
                    renderSmtpConfig(container, settingsRes.settings, analyticsRes.analytics);
                } else if (subtab === 'templates-editor') {
                    const templatesRes = await adminFetch('/api/v1/admin/email/templates');
                    renderTemplatesEditor(container, templatesRes.templates);
                } else if (subtab === 'broadcasts') {
                    renderBroadcasts(container);
                } else if (subtab === 'logs-queue') {
                    const logsRes = await adminFetch('/api/v1/admin/email/history');
                    const queueRes = await adminFetch('/api/v1/admin/email/queue');
                    renderLogsQueue(container, logsRes.logs, queueRes.queue);
                }
            } catch (err) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 30px; text-align: center; border-color: var(--neon-orange-border);">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 30px; color: var(--neon-orange); margin-bottom: 15px;"></i>
                        <p style="color: #fff; font-weight: bold;">FAILED TO READ EMAIL SUBSYSTEM CONFIGS</p>
                        <p style="font-size: 13px; color: var(--text-dim);">${err.message}</p>
                    </div>
                `;
            }
        }

        // Subtab 1: SMTP Settings, Switches, Test Email & Analytics
        function renderSmtpConfig(target, settings, analytics) {
            target.innerHTML = `
                <div class="grid-2" style="align-items: start; gap: 20px;">
                    <!-- Left: SMTP Form & Switches -->
                    <div>
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03); margin-bottom: 20px;">
                            <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin-bottom: 20px;">
                                <i class="fa-solid fa-server"></i> SMTP HOST GATEWAY DETAILS
                            </h4>
                            <form id="smtp-settings-form" onsubmit="return false;">
                                <div class="form-group">
                                    <label>SMTP Relay Server Host</label>
                                    <input type="text" id="smtp-host" value="${settings.smtpHost || ''}" placeholder="smtp.mailtrap.io" required style="color:#fff;">
                                </div>
                                <div class="form-group">
                                    <label>SMTP Secure Port</label>
                                    <input type="number" id="smtp-port" value="${settings.smtpPort || 2525}" placeholder="2525 or 587" required style="color:#fff;">
                                </div>
                                <div class="form-group">
                                    <label>SMTP Credentials Username</label>
                                    <input type="text" id="smtp-user" value="${settings.smtpUser || ''}" placeholder="SMTP Username..." style="color:#fff;">
                                </div>
                                <div class="form-group">
                                    <label>SMTP Gateway Password</label>
                                    <input type="password" id="smtp-pass" value="${settings.smtpPass || ''}" placeholder="SMTP Password..." style="color:#fff;">
                                </div>
                                
                                <h4 class="font-orbitron" style="font-size: 12px; color: var(--neon-orange); margin-top: 30px; margin-bottom: 15px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                                    <i class="fa-solid fa-sliders"></i> EMAIL AUTOMATION SWITCHES
                                </h4>
                                <p style="font-size: 11px; color: var(--text-dim); margin-bottom: 15px;">
                                    Set each channel to <strong>Automatic</strong> to send emails immediately on actions (like team creation/tournament matches), or <strong>Manual</strong> to place them in the Queue for review.
                                </p>
                                
                                <div style="display:flex; flex-direction:column; gap:12px;">
                                    ${renderSwitchRow('Account Activation OTP', 'regConfirmation', settings.regConfirmation)}
                                    ${renderSwitchRow('Registration Confirmation', 'invites', settings.invites)}
                                    ${renderSwitchRow('Tournament Invitation alerts', 'reminders', settings.reminders)}
                                    ${renderSwitchRow('Attendance Lock Confirmations', 'attendanceConfirm', settings.attendanceConfirm)}
                                    ${renderSwitchRow('Tournament Live Rules & Notices', 'updates', settings.updates)}
                                    ${renderSwitchRow('Bracket Results & Certificates', 'results', settings.results)}
                                </div>

                                <button type="submit" class="cta-button btn-neon-cyan w-full" style="margin-top: 25px; padding: 12px;">
                                    <span class="btn-text">APPLY CONFIGURATION OVERRIDES</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Right: Analytics Monitor & Test Send -->
                    <div>
                        <!-- Analytics Overview -->
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03); margin-bottom: 20px;">
                            <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin-bottom: 20px;">
                                <i class="fa-solid fa-chart-pie"></i> LIVE TRANSACTION MONITOR
                            </h4>
                            <div class="analytics-grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                                <div class="analytics-card" style="padding: 10px;">
                                    <span class="analytics-lbl" style="font-size:8px;">SENT SUCCESS</span>
                                    <div class="analytics-val cyan" style="font-size:18px;">${analytics.totalSent}</div>
                                </div>
                                <div class="analytics-card" style="padding: 10px;">
                                    <span class="analytics-lbl" style="font-size:8px;">FAILED TRANS</span>
                                    <div class="analytics-val orange" style="font-size:18px;">${analytics.totalFailed}</div>
                                </div>
                                <div class="analytics-card" style="padding: 10px;">
                                    <span class="analytics-lbl" style="font-size:8px;">ACTIVE QUEUED</span>
                                    <div class="analytics-val yellow" style="font-size:18px;">${analytics.totalQueue}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Test Send Box -->
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03);">
                            <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;">
                                <i class="fa-solid fa-paper-plane"></i> SMTP INTEGRATION VERIFICATION
                            </h4>
                            <form id="smtp-test-form" onsubmit="return false;">
                                <div class="form-group">
                                    <label>Recipient verification email</label>
                                    <input type="email" id="test-email-to" placeholder="E.g. gamer@gmail.com" required style="color:#fff;">
                                </div>
                                <button type="submit" class="cta-button btn-neon-orange w-full" style="margin-top: 15px; padding: 10px;">
                                    <span class="btn-text">DISPATCH VERIFICATION EMAIL</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            function renderSwitchRow(label, key, val) {
                const isAuto = val === 'automatic' || val === true;
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:8px;">
                        <span style="font-size:12px; color:#fff;">${label}</span>
                        <select id="switch-${key}" style="background:#101015; color:#fff; border:1px solid var(--glass-border); padding:4px 8px; border-radius:4px; font-size:11px;">
                            <option value="automatic" ${isAuto ? 'selected' : ''}>Automatic</option>
                            <option value="manual" ${!isAuto ? 'selected' : ''}>Manual Queue</option>
                        </select>
                    </div>
                `;
            }

            // Save Settings Submit Handler
            const settingsForm = document.getElementById('smtp-settings-form');
            settingsForm.onsubmit = async function(e) {
                if (e) e.preventDefault();
                const updated = {
                    smtpHost: document.getElementById('smtp-host').value.trim(),
                    smtpPort: parseInt(document.getElementById('smtp-port').value) || 2525,
                    smtpUser: document.getElementById('smtp-user').value.trim(),
                    smtpPass: document.getElementById('smtp-pass').value.trim(),
                    regConfirmation: document.getElementById('switch-regConfirmation').value,
                    invites: document.getElementById('switch-invites').value,
                    reminders: document.getElementById('switch-reminders').value,
                    attendanceConfirm: document.getElementById('switch-attendanceConfirm').value,
                    updates: document.getElementById('switch-updates').value,
                    results: document.getElementById('switch-results').value
                };

                try {
                    const saveBtn = settingsForm.querySelector('button[type="submit"]');
                    saveBtn.disabled = true;
                    saveBtn.querySelector('.btn-text').textContent = 'APPLYING CONFIGS...';
                    
                    const res = await adminFetch('/api/v1/admin/email/settings', {
                        method: 'PUT',
                        body: JSON.stringify(updated)
                    });

                    alert("Email gateway and automation configurations updated successfully!");
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    loadSubTab('smtp-config');
                } catch (err) {
                    alert("Gateway override failed: " + err.message);
                }
            };

            // Test Email Submit Handler
            const testForm = document.getElementById('smtp-test-form');
            testForm.onsubmit = async function(e) {
                if (e) e.preventDefault();
                const toEmail = document.getElementById('test-email-to').value.trim();
                try {
                    const testBtn = testForm.querySelector('button[type="submit"]');
                    testBtn.disabled = true;
                    testBtn.querySelector('.btn-text').textContent = 'SENDING KEY...';
                    
                    await adminFetch('/api/v1/admin/email/test', {
                        method: 'POST',
                        body: JSON.stringify({ toEmail })
                    });

                    alert(`Test SMTP transmission successfully dispatched to: ${toEmail}!`);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    testForm.reset();
                } catch (err) {
                    alert("Verification dispatch failed: " + err.message);
                } finally {
                    const testBtn = testForm.querySelector('button[type="submit"]');
                    testBtn.disabled = false;
                    testBtn.querySelector('.btn-text').textContent = 'DISPATCH VERIFICATION EMAIL';
                }
            };
        }

        // Subtab 2: Templates Editor
        function renderTemplatesEditor(target, templates) {
            target.innerHTML = `
                <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin-bottom: 20px;">
                        <i class="fa-solid fa-rectangle-list"></i> TRANSMISSION FORMAT TEMPLATE LIBRARY
                    </h4>
                    
                    <div style="display:grid; grid-template-columns: 250px 1fr; gap:25px;">
                        <!-- Left Selector -->
                        <div style="border-right: 1px solid var(--glass-border); padding-right:15px; display:flex; flex-direction:column; gap:8px;">
                            ${templates.map((t, idx) => `
                                <button class="cta-button w-full template-select-btn ${idx === 0 ? 'btn-neon-cyan active' : 'btn-neon-yellow'}" 
                                        data-tempid="${t.id}" style="padding:10px 15px; font-size:11px; text-align:left;">
                                    ${t.name}
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Right Edit Form -->
                        <div id="template-editor-form-mount"></div>
                    </div>
                </div>
            `;

            // Bind Selector Clicks
            const tempBtns = target.querySelectorAll('.template-select-btn');
            tempBtns.forEach(btn => {
                btn.onclick = function() {
                    tempBtns.forEach(b => {
                        b.classList.remove('btn-neon-cyan', 'active');
                        b.classList.add('btn-neon-yellow');
                    });
                    this.classList.remove('btn-neon-yellow');
                    this.classList.add('btn-neon-cyan', 'active');
                    const temp = templates.find(t => t.id === this.dataset.tempid);
                    renderEditForm(temp);
                };
            });

            // Initialize first template form
            if (templates.length > 0) {
                renderEditForm(templates[0]);
            }

            function renderEditForm(t) {
                const mount = document.getElementById('template-editor-form-mount');
                mount.innerHTML = `
                    <form id="template-edit-form" onsubmit="return false;">
                        <h4 class="font-orbitron" style="font-size:14px; color:#fff; margin-bottom:15px; border-bottom:1px dashed var(--glass-border); padding-bottom:5px;">
                            EDIT FORMAT: ${t.name}
                        </h4>
                        <div class="form-group">
                            <label>Default Mail Subject</label>
                            <input type="text" id="temp-subject" value="${t.subject || ''}" required style="color:#fff;">
                        </div>
                        <div class="form-group">
                            <label>Template Purpose & Details</label>
                            <textarea id="temp-desc" rows="4" style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;">${t.description || ''}</textarea>
                        </div>
                        <p style="font-size: 11px; color: var(--text-dim); margin-top: 10px; line-height:1.4;">
                            * Templates use premium pre-styled responsive cyber containers. Placeholders are dynamically parsed by the gateway engine (e.g. <code>{{TOURNAMENT}}</code>, <code>{{TYPE}}</code>, <code>{{GUEST}}</code>).
                        </p>
                        <button type="submit" class="cta-button btn-neon-cyan w-full" style="margin-top: 20px; padding: 12px;">
                            <span class="btn-text">SAVE TRANSMISSION FORMAT</span>
                        </button>
                    </form>
                `;

                const editForm = document.getElementById('template-edit-form');
                editForm.onsubmit = async function(e) {
                    if (e) e.preventDefault();
                    const updated = {
                        subject: document.getElementById('temp-subject').value.trim(),
                        description: document.getElementById('temp-desc').value.trim()
                    };

                    try {
                        const saveBtn = editForm.querySelector('button[type="submit"]');
                        saveBtn.disabled = true;
                        saveBtn.querySelector('.btn-text').textContent = 'SAVING FORMAT...';
                        
                        await adminFetch(`/api/v1/admin/email/templates/${t.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(updated)
                        });

                        alert("Template updated successfully!");
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        
                        // Update template local state
                        t.subject = updated.subject;
                        t.description = updated.description;
                        renderEditForm(t);
                    } catch (err) {
                        alert("Template update failed: " + err.message);
                    }
                };
            }
        }

        // Subtab 3: Broadcasts (Invites, Updates, Results)
        function renderBroadcasts(target) {
            const openTournaments = db.tournaments.filter(t => t.status === 'Open');

            target.innerHTML = `
                <div class="grid-2" style="align-items: start; gap: 20px;">
                    <!-- Left: Invites & Updates -->
                    <div>
                        <!-- Bulk Invites -->
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03); margin-bottom: 20px;">
                            <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin-bottom: 15px;">
                                <i class="fa-solid fa-bullhorn"></i> BULK TOURNAMENT INVITATION
                            </h4>
                            <p style="font-size:11px; color:var(--text-dim); margin-bottom:15px;">
                                Dispatches invitation emails to all registered portal members.
                            </p>
                            <form id="invite-broadcast-form" onsubmit="return false;">
                                <div class="form-group">
                                    <label>Select Target Championship</label>
                                    <select id="invite-tourney-id" style="background:#101015; color:#fff; border:1px solid var(--glass-border); padding:10px; width:100%; border-radius:4px;" required>
                                        <option value="">-- Select Tournament --</option>
                                        ${openTournaments.map(t => `<option value="${t.id}">${t.name} (${t.startDate})</option>`).join('')}
                                    </select>
                                </div>
                                <button type="submit" class="cta-button btn-neon-cyan w-full" style="margin-top: 15px; padding: 10px;">
                                    <span class="btn-text">BROADCAST BULK INVITES</span>
                                </button>
                            </form>
                        </div>

                        <!-- Live Updates -->
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03);">
                            <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;">
                                <i class="fa-solid fa-triangle-exclamation"></i> GENERAL / SCHEDULE EMERGENCY BROADCAST
                            </h4>
                            <p style="font-size:11px; color:var(--text-dim); margin-bottom:15px;">
                                Send warnings, rule updates, or match schedules to all team captain email contacts registered for a specific tournament.
                            </p>
                            <form id="update-broadcast-form" onsubmit="return false;">
                                <div class="form-group">
                                    <label>Select Target Championship</label>
                                    <select id="update-tourney-id" style="background:#101015; color:#fff; border:1px solid var(--glass-border); padding:10px; width:100%; border-radius:4px;" required>
                                        <option value="">-- Select Tournament --</option>
                                        ${openTournaments.map(t => `<option value="${t.id}">${t.name} (${t.startDate})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Broadcast Title / Header Type</label>
                                    <input type="text" id="update-type" placeholder="E.g. Schedule Change, Emergency Rule, Server Delay" required style="color:#fff;">
                                </div>
                                <div class="form-group">
                                    <label>Broadcast Message Body</label>
                                    <textarea id="update-msg" rows="4" placeholder="Enter emergency details..." required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                                </div>
                                <button type="submit" class="cta-button btn-neon-orange w-full" style="margin-top: 15px; padding: 10px;">
                                    <span class="btn-text">DISPATCH BROADCAST MESSAGE</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Right: Results & Winner Certificates -->
                    <div>
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03);">
                            <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin-bottom: 15px;">
                                <i class="fa-solid fa-trophy"></i> BRACKET RESULTS & CERTIFICATES BROADCAST
                            </h4>
                            <p style="font-size:11px; color:var(--text-dim); margin-bottom:15px;">
                                Dispatches Booyah standings emails, congratulations to winners, and attaches secure dynamic PDF participation certificates to all contenders.
                            </p>
                            <form id="results-broadcast-form" onsubmit="return false;">
                                <div class="form-group">
                                    <label>Select Concluded Championship</label>
                                    <select id="results-tourney-id" style="background:#101015; color:#fff; border:1px solid var(--glass-border); padding:10px; width:100%; border-radius:4px;" required>
                                        <option value="">-- Select Tournament --</option>
                                        ${db.tournaments.map(t => `<option value="${t.id}">${t.name} (${t.status === 'Open' ? 'Active' : 'Completed'})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Winner / Championship Squad Name</label>
                                    <input type="text" id="results-winner" placeholder="E.g. VIPER ESPORTS" required style="color:#fff;">
                                </div>
                                <div class="form-group">
                                    <label>Standings & Ranking Summary</label>
                                    <textarea id="results-summary" rows="5" placeholder="1st Place: VIPER ESPORTS - 80 pts&#10;2nd Place: CLAW SQUAD - 65 pts&#10;3rd Place: TEAM STORM - 55 pts" required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; color: #fff; font-size: 13px;"></textarea>
                                </div>
                                <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" id="results-certificate" checked style="width:16px; height:16px;">
                                    <label for="results-certificate" style="margin-bottom:0; font-size:12px;">Attach secure PDF participation certificates</label>
                                </div>
                                <button type="submit" class="cta-button btn-neon-yellow w-full" style="margin-top: 20px; padding: 12px; color:#000 !important;">
                                    <span class="btn-text">BROADCAST STANDINGS & CERTIFICATES</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            // Bulk Invite Submit
            const inviteForm = document.getElementById('invite-broadcast-form');
            inviteForm.onsubmit = async function(e) {
                if (e) e.preventDefault();
                const tournamentId = document.getElementById('invite-tourney-id').value;
                if (!tournamentId) {
                    alert("Please select a target tournament");
                    return;
                }

                try {
                    const btn = inviteForm.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    btn.querySelector('.btn-text').textContent = 'BROADCASTING INVITES...';

                    const res = await adminFetch('/api/v1/admin/email/broadcast-invite', {
                        method: 'POST',
                        body: JSON.stringify({ tournamentId })
                    });

                    alert(res.message || "Invitation broadcasts queued successfully!");
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    inviteForm.reset();
                } catch (err) {
                    alert("Broadcast failed: " + err.message);
                } finally {
                    const btn = inviteForm.querySelector('button[type="submit"]');
                    btn.disabled = false;
                    btn.querySelector('.btn-text').textContent = 'BROADCAST BULK INVITES';
                }
            };

            // Emergency Update Submit
            const updateForm = document.getElementById('update-broadcast-form');
            updateForm.onsubmit = async function(e) {
                if (e) e.preventDefault();
                const tournamentId = document.getElementById('update-tourney-id').value;
                const updateType = document.getElementById('update-type').value.trim();
                const updateMessage = document.getElementById('update-msg').value.trim();

                try {
                    const btn = updateForm.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    btn.querySelector('.btn-text').textContent = 'BROADCASTING UPDATE...';

                    const res = await adminFetch('/api/v1/admin/email/broadcast-update', {
                        method: 'POST',
                        body: JSON.stringify({ tournamentId, updateType, updateMessage })
                    });

                    alert(res.message || "Emergency updates broadcast successfully!");
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    updateForm.reset();
                } catch (err) {
                    alert("Broadcast failed: " + err.message);
                } finally {
                    const btn = updateForm.querySelector('button[type="submit"]');
                    btn.disabled = false;
                    btn.querySelector('.btn-text').textContent = 'DISPATCH BROADCAST MESSAGE';
                }
            };

            // Results Submit
            const resultsForm = document.getElementById('results-broadcast-form');
            resultsForm.onsubmit = async function(e) {
                if (e) e.preventDefault();
                const tournamentId = document.getElementById('results-tourney-id').value;
                const winnerName = document.getElementById('results-winner').value.trim();
                const resultsSummary = document.getElementById('results-summary').value.trim();
                const generateCertificate = document.getElementById('results-certificate').checked;

                try {
                    const btn = resultsForm.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    btn.querySelector('.btn-text').textContent = 'BROADCASTING RESULTS...';

                    const res = await adminFetch('/api/v1/admin/email/broadcast-results', {
                        method: 'POST',
                        body: JSON.stringify({ tournamentId, winnerName, resultsSummary, generateCertificate })
                    });

                    alert(res.message || "Championship results and certificates sent successfully!");
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    resultsForm.reset();
                } catch (err) {
                    alert("Broadcast failed: " + err.message);
                } finally {
                    const btn = resultsForm.querySelector('button[type="submit"]');
                    btn.disabled = false;
                    btn.querySelector('.btn-text').textContent = 'BROADCAST STANDINGS & CERTIFICATES';
                }
            };
        }

        // Subtab 4: Logs & Queue
        function renderLogsQueue(target, logs, queue) {
            target.innerHTML = `
                <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03); margin-bottom: 25px;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin-bottom: 15px;">
                        <i class="fa-solid fa-hourglass-half"></i> PENDING & FAILED EMAIL QUEUE (${queue.length})
                    </h4>
                    <div style="max-height: 250px; overflow-y: auto; border:1px solid var(--glass-border); border-radius:4px;">
                        <table class="admin-table" style="margin:0;">
                            <thead>
                                <tr>
                                    <th>Recipient</th>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Scheduled Time</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${queue.length === 0 ? '<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No pending or failed transmissions in queue.</td></tr>' : 
                                  queue.map(item => `
                                    <tr>
                                        <td>${item.to}</td>
                                        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.subject}</td>
                                        <td><span class="badge-role client" style="font-size:9px;">${item.type}</span></td>
                                        <td><span class="badge-status ${item.status === 'Failed' ? 'rejected' : 'pending'}">${item.status}</span></td>
                                        <td style="font-size:11px;">${new Date(item.scheduled_at).toLocaleString()}</td>
                                        <td>
                                            <button class="cta-button btn-neon-orange resend-queue-btn" data-qid="${item.id}" style="padding:4px 8px; font-size:9px;">
                                                <i class="fa-solid fa-arrow-rotate-right"></i> Send Now
                                            </button>
                                        </td>
                                    </tr>
                                  `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03);">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin-bottom: 15px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> TRANSMISSION LOG HISTORY (Last 100 Logs)
                    </h4>
                    <div style="max-height: 350px; overflow-y: auto; border:1px solid var(--glass-border); border-radius:4px;">
                        <table class="admin-table" style="margin:0;">
                            <thead>
                                <tr>
                                    <th>Recipient</th>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Date Transmitted</th>
                                    <th>Diagnostic Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No gateway transaction logs recorded.</td></tr>' : 
                                  logs.map(log => `
                                    <tr>
                                        <td>${log.recipient}</td>
                                        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${log.subject}</td>
                                        <td><span class="badge-role admin" style="font-size:9px; background:rgba(0,240,255,0.1); border-color:rgba(0,240,255,0.2); color:var(--neon-cyan);">${log.type}</span></td>
                                        <td><span class="badge-status ${log.status === 'Success' ? 'approved' : 'rejected'}">${log.status}</span></td>
                                        <td style="font-size:11px;">${new Date(log.sent_at).toLocaleString()}</td>
                                        <td style="font-size:10px; color:${log.status === 'Success' ? '#10b981' : '#f43f5e'};">
                                            ${log.status === 'Success' ? `OK [ID: ${log.messageId || 'N/A'}]` : `ERR: ${log.error_message || 'Relay Error'}`}
                                        </td>
                                    </tr>
                                  `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Bind Resend Queue Clicks
            const resendBtns = target.querySelectorAll('.resend-queue-btn');
            resendBtns.forEach(btn => {
                btn.onclick = async function() {
                    const queueId = this.dataset.qid;
                    try {
                        this.disabled = true;
                        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                        
                        await adminFetch('/api/v1/admin/email/queue/resend', {
                            method: 'POST',
                            body: JSON.stringify({ queueId })
                        });

                        alert("Email dispatched immediately and removed from queue!");
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        
                        // Reload Subtab
                        loadSubTab('logs-queue');
                    } catch (err) {
                        alert("Dispatch failed: " + err.message);
                        this.disabled = false;
                        this.innerHTML = '<i class="fa-solid fa-arrow-rotate-right"></i> Send Now';
                    }
                };
            });
        }
    }

    // ──────────────────────────────────────────────────────
    // PLAYERS / USER MANAGEMENT TAB
    // ──────────────────────────────────────────────────────
    async function renderPlayersTab(mount, page = 1, search = '') {
        mount.innerHTML = `<div style="padding:30px;text-align:center;color:var(--neon-cyan);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;"></i><br><br>Loading player accounts...</div>`;

        const token = localStorage.getItem('strikz_jwt_token') || sessionStorage.getItem('strikz_jwt_token');
        let data;
        try {
            const params = new URLSearchParams({ page, limit: 30 });
            if (search) params.set('search', search);
            const res = await fetch(`/api/v1/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load users');
        } catch (err) {
            mount.innerHTML = `<div style="padding:30px;color:var(--neon-orange);text-align:center;"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</div>`;
            return;
        }

        const { users = [], total = 0, pages = 1 } = data;

        const statusBadge = (u) => {
            if (u.role === 'admin') return `<span style="background:rgba(255,94,0,0.15);color:#ff5e00;border:1px solid #ff5e00;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;">ADMIN</span>`;
            if (u.status === 'suspended') return `<span style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid #ef4444;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;">SUSPENDED</span>`;
            if (u.isVerified) return `<span style="background:rgba(0,240,255,0.1);color:var(--neon-cyan);border:1px solid var(--neon-cyan);border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;">VERIFIED</span>`;
            return `<span style="background:rgba(255,230,0,0.1);color:#ffe600;border:1px solid #ffe600;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;">UNVERIFIED</span>`;
        };

        const actionBtns = (u) => {
            if (u.role === 'admin') return `<span style="color:var(--text-dim);font-size:11px;">Protected</span>`;
            const verifyBtn = !u.isVerified
                ? `<button class="admin-user-action" data-action="verify" data-id="${u.id}" data-name="${u.username}" style="background:rgba(0,240,255,0.12);color:var(--neon-cyan);border:1px solid var(--neon-cyan-border);padding:4px 10px;border-radius:4px;font-size:10px;cursor:pointer;font-weight:700;" title="Verify Account"><i class="fa-solid fa-circle-check"></i> Verify</button>`
                : '';
            const promoteBtn = `<button class="admin-user-action" data-action="promote" data-id="${u.id}" data-name="${u.username}" style="background:rgba(168,85,247,0.15);color:#c084fc;border:1px solid #a855f7;padding:4px 10px;border-radius:4px;font-size:10px;cursor:pointer;font-weight:700;" title="Promote to Admin"><i class="fa-solid fa-user-shield"></i> Promote</button>`;
            const suspendLabel = u.status === 'suspended' ? 'Reactivate' : 'Suspend';
            const suspendIcon  = u.status === 'suspended' ? 'fa-play' : 'fa-ban';
            const suspendColor = u.status === 'suspended' ? '#22c55e' : '#f59e0b';
            const suspendBtn = `<button class="admin-user-action" data-action="suspend" data-id="${u.id}" data-name="${u.username}" style="background:rgba(245,158,11,0.1);color:${suspendColor};border:1px solid ${suspendColor};padding:4px 10px;border-radius:4px;font-size:10px;cursor:pointer;font-weight:700;" title="${suspendLabel} Account"><i class="fa-solid ${suspendIcon}"></i> ${suspendLabel}</button>`;
            const deleteBtn = `<button class="admin-user-action" data-action="delete" data-id="${u.id}" data-name="${u.username}" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid #ef4444;padding:4px 10px;border-radius:4px;font-size:10px;cursor:pointer;font-weight:700;" title="Delete Account"><i class="fa-solid fa-trash"></i> Delete</button>`;
            return `<div style="display:flex;gap:5px;flex-wrap:wrap;">${verifyBtn}${promoteBtn}${suspendBtn}${deleteBtn}</div>`;
        };

        const rows = users.length ? users.map(u => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition: background 0.15s;" onmouseover="this.style.background='rgba(0,240,255,0.03)'" onmouseout="this.style.background=''">
                <td style="padding:10px 12px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <img src="${u.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + u.username}" style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,240,255,0.2);" onerror="this.src='https://api.dicebear.com/7.x/pixel-art/svg?seed=player'">
                        <div>
                            <div style="font-weight:700;color:#fff;font-size:13px;">${u.username || '—'}</div>
                            <div style="font-size:10px;color:var(--text-dim);">${u.uid || '—'}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:10px 12px;font-size:12px;color:#9ca3af;">${u.email || '—'}</td>
                <td style="padding:10px 12px;">${statusBadge(u)}</td>
                <td style="padding:10px 12px;font-size:11px;color:var(--text-dim);">${u.created_at ? window.strikzFormatDate(u.created_at) : '—'}</td>
                <td style="padding:10px 12px;">${actionBtns(u)}</td>
            </tr>`).join('') : `<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-dim);">No player accounts found</td></tr>`;

        const paginationBtns = Array.from({ length: pages }, (_, i) => i + 1).map(p =>
            `<button class="admin-page-btn" data-page="${p}" style="min-width:32px;padding:4px 10px;border-radius:4px;font-size:12px;cursor:pointer;border:1px solid ${p === page ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'};background:${p === page ? 'rgba(0,240,255,0.1)' : 'transparent'};color:${p === page ? 'var(--neon-cyan)' : '#9ca3af'};">${p}</button>`
        ).join('');

        mount.innerHTML = `
            <div style="padding:25px;">
                <!-- Quick Promote Section -->
                <div class="glass-panel" style="padding: 15px 20px; border-color: rgba(168, 85, 247, 0.2); margin-bottom: 25px; background: rgba(168, 85, 247, 0.02); display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;">
                    <div style="text-align: left;">
                        <h4 class="font-orbitron" style="margin: 0; font-size: 13px; color: #c084fc; letter-spacing: 0.05em;"><i class="fa-solid fa-user-shield"></i> QUICK PROMOTE PLAYER TO ADMIN</h4>
                        <p style="margin: 3px 0 0 0; font-size: 11px; color: var(--text-dim);">Enter exact username or Gamer UID to promote instantly.</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input id="promote-username-input" type="text" placeholder="Gamer UID or Username..." style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 7px 12px; border-radius: 4px; font-size: 12px; width: 200px;">
                        <button id="btn-quick-promote" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid #a855f7; padding: 7px 14px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-plus"></i> PROMOTE</button>
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
                    <div>
                        <h3 class="font-orbitron" style="margin:0;font-size:16px;color:var(--neon-cyan);">PLAYER ACCOUNTS</h3>
                        <p style="margin:4px 0 0;font-size:12px;color:var(--text-dim);">${total} total account${total !== 1 ? 's' : ''} in the database</p>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <input id="player-search-input" type="text" placeholder="Search by name, email or UID..." value="${search}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 12px;border-radius:4px;font-size:12px;width:230px;">
                        <button id="player-search-btn" style="background:rgba(0,240,255,0.1);color:var(--neon-cyan);border:1px solid var(--neon-cyan-border);padding:7px 14px;border-radius:4px;font-size:12px;cursor:pointer;font-weight:700;"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid rgba(0,240,255,0.12);">
                                <th style="padding:10px 12px;text-align:left;font-size:10px;color:var(--neon-cyan);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Player</th>
                                <th style="padding:10px 12px;text-align:left;font-size:10px;color:var(--neon-cyan);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Email</th>
                                <th style="padding:10px 12px;text-align:left;font-size:10px;color:var(--neon-cyan);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Status</th>
                                <th style="padding:10px 12px;text-align:left;font-size:10px;color:var(--neon-cyan);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Joined</th>
                                <th style="padding:10px 12px;text-align:left;font-size:10px;color:var(--neon-cyan);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>

                ${pages > 1 ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:18px;justify-content:center;">${paginationBtns}</div>` : ''}
            </div>`;

        // Quick Promote Player
        document.getElementById('btn-quick-promote').onclick = async () => {
            const queryVal = document.getElementById('promote-username-input').value.trim();
            if (!queryVal) {
                alert("Please enter a username or Gamer UID.");
                return;
            }

            const btn = document.getElementById('btn-quick-promote');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Promoting...';

            try {
                const params = new URLSearchParams({ search: queryVal, limit: 10 });
                const res = await fetch(`/api/v1/admin/users?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const searchData = await res.json();
                if (!res.ok) throw new Error(searchData.message || 'Failed to search user');

                const foundUsers = searchData.users || [];
                const exactMatch = foundUsers.find(u => 
                    (u.username && u.username.toLowerCase() === queryVal.toLowerCase()) || 
                    (u.uid && u.uid.toLowerCase() === queryVal.toLowerCase())
                );

                if (!exactMatch) {
                    throw new Error(`User matching "${queryVal}" not found. Please ensure spelling/UID is exact.`);
                }

                if (exactMatch.role === 'admin') {
                    throw new Error(`"${exactMatch.username}" is already an Admin.`);
                }

                if (!confirm(`👑 Promote account "${exactMatch.username}" (UID: ${exactMatch.uid}) to Admin?\n\nThis will grant full admin privileges to this user.`)) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-plus"></i> PROMOTE';
                    return;
                }

                const promoteRes = await fetch(`/api/v1/admin/users/${exactMatch.id}/promote`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const promoteData = await promoteRes.json();
                if (!promoteRes.ok) throw new Error(promoteData.message || 'Promotion request failed');

                alert('✅ ' + promoteData.message);
                document.getElementById('promote-username-input').value = '';
                await renderPlayersTab(mount, page, search);
            } catch (err) {
                alert('❌ ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-plus"></i> PROMOTE';
            }
        };

        // Search button
        document.getElementById('player-search-btn').onclick = async () => {
            const q = document.getElementById('player-search-input').value.trim();
            await renderPlayersTab(mount, 1, q);
        };
        document.getElementById('player-search-input').addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const q = e.target.value.trim();
                await renderPlayersTab(mount, 1, q);
            }
        });

        // Pagination buttons
        mount.querySelectorAll('.admin-page-btn').forEach(btn => {
            btn.onclick = async () => {
                await renderPlayersTab(mount, parseInt(btn.dataset.page), search);
            };
        });

        // Action buttons (verify / suspend / delete)
        mount.querySelectorAll('.admin-user-action').forEach(btn => {
            btn.onclick = async function() {
                const action  = this.dataset.action;
                const id      = this.dataset.id;
                const name    = this.dataset.name;

                if (action === 'delete') {
                    if (!confirm(`⚠️ Permanently delete account "${name}"?\n\nThis cannot be undone.`)) return;
                }
                if (action === 'suspend') {
                    const label = this.textContent.includes('Suspend') ? 'suspend' : 'reactivate';
                    if (!confirm(`${label === 'suspend' ? '🚫 Suspend' : '▶ Reactivate'} account "${name}"?`)) return;
                }
                if (action === 'promote') {
                    if (!confirm(`👑 Promote account "${name}" to Admin?\n\nThis will grant full admin privileges to this user.`)) return;
                }

                this.disabled = true;
                this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                try {
                    let res;
                    if (action === 'verify') {
                        res = await fetch(`/api/v1/admin/users/${id}/verify`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } else if (action === 'suspend') {
                        res = await fetch(`/api/v1/admin/users/${id}/suspend`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } else if (action === 'promote') {
                        res = await fetch(`/api/v1/admin/users/${id}/promote`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } else if (action === 'delete') {
                        res = await fetch(`/api/v1/admin/users/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    }
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.message || 'Action failed');
                    alert('✅ ' + json.message);
                    await renderPlayersTab(mount, page, search);
                } catch (err) {
                    alert('❌ ' + err.message);
                    this.disabled = false;
                }
            };
        });
    }

    // 14. DATABASE EXPLORER PANEL
    async function renderDbExplorerTab(mount) {
        const token = localStorage.getItem('strikz_jwt_token');
        
        const dbFetch = async (url, options = {}) => {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            };
            const res = await fetch(url, { ...options, headers });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        mount.innerHTML = `
            <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-database"></i> SECURE DATABASE EXPLORER</h3>

            <div class="form-row" style="margin-bottom: 25px;">
                <div class="form-group" style="max-width: 350px; text-align: left;">
                    <label for="db-collection-select">Select Database Collection</label>
                    <select id="db-collection-select" style="background: rgba(0,0,0,0.5); color: #fff; border: 1px solid var(--glass-border); padding: 10px; border-radius: 4px; width: 100%; cursor: pointer;">
                        <option value="">-- Loading Collections... --</option>
                    </select>
                </div>
            </div>

            <div class="admin-crud-grid" id="db-explorer-workspace" style="display: none;">
                <!-- Left: Documents Table -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03); overflow-x: auto; min-width: 0;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-table"></i> DOCUMENTS</h4>
                    <div id="db-documents-container" style="overflow-x: auto;">
                        <!-- Table populated dynamically -->
                    </div>
                    <div id="db-pagination-container" style="display: flex; gap: 8px; margin-top: 15px; align-items: center; justify-content: flex-start; flex-wrap: wrap;">
                        <!-- Pagination buttons -->
                    </div>
                </div>
                
                <!-- Right: JSON Editor -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03); display: flex; flex-direction: column; min-width: 0;">
                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin-bottom: 15px;"><i class="fa-solid fa-code"></i> RAW JSON EDITOR</h4>
                    <div id="db-editor-placeholder" style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-dim); text-align: center; padding: 40px; border: 1px dashed rgba(255,255,255,0.05); border-radius: 4px;">
                        Select a document from the left panel to inspect or edit.
                    </div>
                    <div id="db-editor-container" style="display: none; flex-direction: column; gap: 15px; height: 100%;">
                        <div style="font-size: 11px; color: var(--text-dim); font-family: monospace; text-align: left;">
                            Collection: <span id="db-editing-col" style="color: var(--neon-orange); font-weight: bold;"></span><br>
                            Document Key (ID): <span id="db-editing-id" style="color: var(--neon-cyan); font-weight: bold;"></span>
                        </div>
                        <textarea id="db-json-textarea" style="width: 100%; height: 380px; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.6); color: #00ff66; border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; resize: vertical; line-height: 1.5;" spellcheck="false"></textarea>
                        <div style="display: flex; gap: 10px;">
                            <button id="btn-db-save" class="cta-button btn-neon-cyan" style="flex: 1; padding: 10px;">SAVE CHANGES</button>
                            <button id="btn-db-cancel" class="cta-button btn-neon-yellow" style="padding: 10px 20px;">CANCEL</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const selectCol = document.getElementById('db-collection-select');
        const workspace = document.getElementById('db-explorer-workspace');
        const docsContainer = document.getElementById('db-documents-container');
        const paginationContainer = document.getElementById('db-pagination-container');
        
        const editorPlaceholder = document.getElementById('db-editor-placeholder');
        const editorContainer = document.getElementById('db-editor-container');
        const editingColLabel = document.getElementById('db-editing-col');
        const editingIdLabel = document.getElementById('db-editing-id');
        const jsonTextarea = document.getElementById('db-json-textarea');
        const btnSave = document.getElementById('btn-db-save');
        const btnCancel = document.getElementById('btn-db-cancel');

        let selectedCollection = '';
        let currentCollectionDocs = [];
        let currentPage = 1;
        let activeEditingDoc = null;

        // Fetch collections list
        try {
            const res = await dbFetch('/api/v1/admin/db/collections');
            selectCol.innerHTML = '<option value="">-- Choose a collection --</option>' + 
                res.collections.map(col => `<option value="${col}">${col} (${res.counts[col] || 0} docs)</option>`).join('');
        } catch (err) {
            selectCol.innerHTML = `<option value="">Error loading: ${err.message}</option>`;
            return;
        }

        // Change collection handler
        selectCol.onchange = function() {
            selectedCollection = this.value;
            currentPage = 1;
            closeEditor();
            if (!selectedCollection) {
                workspace.style.display = 'none';
                return;
            }
            workspace.style.display = 'grid';
            loadDocuments();
        };

        async function loadDocuments() {
            docsContainer.innerHTML = '<div style="padding: 30px; text-align: center;"><div class="loader-spinner"></div><p style="color:var(--text-dim);margin-top:10px;">QUERIFYING RECORDS...</p></div>';
            paginationContainer.innerHTML = '';

            try {
                const res = await dbFetch(`/api/v1/admin/db/collection/${selectedCollection}?page=${currentPage}&limit=20`);
                currentCollectionDocs = res.docs;
                renderDocumentsTable(res.total, res.page, res.pages);
            } catch (err) {
                docsContainer.innerHTML = `<div style="color: var(--neon-orange); padding: 20px; text-align: center;">Query failed: ${err.message}</div>`;
            }
        }

        function renderDocumentsTable(total, page, pages) {
            if (currentCollectionDocs.length === 0) {
                docsContainer.innerHTML = '<div style="color: var(--text-dim); padding: 30px; text-align: center;">No documents found in this collection.</div>';
                return;
            }

            const doc0 = currentCollectionDocs[0];
            const displayKeys = ['id', '_id'];
            
            const potentialKeys = ['tag', 'username', 'email', 'name', 'title', 'fullName', 'type', 'event', 'status'];
            potentialKeys.forEach(k => {
                if (doc0[k] !== undefined && !displayKeys.includes(k)) displayKeys.push(k);
            });

            const colsToShow = displayKeys.slice(0, 4);

            let tableHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            ${colsToShow.map(c => `<th>${c.toUpperCase()}</th>`).join('')}
                            <th style="width: 100px; text-align: center;">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            tableHTML += currentCollectionDocs.map(doc => {
                const docId = doc.id !== undefined ? doc.id : doc._id;
                return `
                    <tr>
                        ${colsToShow.map(c => {
                            const val = doc[c];
                            const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                            return `<td><div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${displayVal.replace(/"/g, '&quot;')}">${displayVal}</div></td>`;
                        }).join('')}
                        <td style="text-align: center; white-space: nowrap;">
                            <button class="action-icon-btn approve btn-db-edit-row" data-id="${docId}" title="Edit JSON"><i class="fa-solid fa-code"></i></button>
                            <button class="action-icon-btn delete btn-db-delete-row" data-id="${docId}" title="Delete Document"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableHTML += `
                    </tbody>
                </table>
            `;

            docsContainer.innerHTML = tableHTML;

            if (pages > 1) {
                let paginationHTML = '';
                for (let i = 1; i <= pages; i++) {
                    paginationHTML += `
                        <button class="cta-button btn-db-page ${i === page ? 'btn-neon-cyan active' : 'btn-neon-yellow'}" data-page="${i}" style="padding: 4px 10px; font-size: 11px;">${i}</button>
                    `;
                }
                paginationContainer.innerHTML = paginationHTML;

                paginationContainer.querySelectorAll('.btn-db-page').forEach(btn => {
                    btn.onclick = function() {
                        currentPage = parseInt(this.dataset.page);
                        loadDocuments();
                    };
                });
            }

            docsContainer.querySelectorAll('.btn-db-edit-row').forEach(btn => {
                btn.onclick = function() {
                    const docId = this.dataset.id;
                    const doc = currentCollectionDocs.find(d => String(d.id !== undefined ? d.id : d._id) === String(docId));
                    if (doc) {
                        openEditor(docId, doc);
                    }
                };
            });

            docsContainer.querySelectorAll('.btn-db-delete-row').forEach(btn => {
                btn.onclick = async function() {
                    const docId = this.dataset.id;
                    if (confirm(`⚠️ WARNING: Permanently delete this document from collection "${selectedCollection}"?`)) {
                        try {
                            await dbFetch(`/api/v1/admin/db/collection/${selectedCollection}/${docId}`, {
                                method: 'DELETE'
                            });
                            alert('✅ Document deleted successfully!');
                            closeEditor();
                            loadDocuments();
                        } catch (err) {
                            alert('❌ Delete failed: ' + err.message);
                        }
                    }
                };
            });
        }

        function openEditor(id, doc) {
            activeEditingDoc = doc;
            editingColLabel.textContent = selectedCollection;
            editingIdLabel.textContent = id;
            jsonTextarea.value = JSON.stringify(doc, null, 4);
            
            editorPlaceholder.style.display = 'none';
            editorContainer.style.display = 'flex';
        }

        function closeEditor() {
            activeEditingDoc = null;
            editorPlaceholder.style.display = 'flex';
            editorContainer.style.display = 'none';
        }

        btnCancel.onclick = function() {
            closeEditor();
        };

        btnSave.onclick = async function() {
            if (!activeEditingDoc) return;
            const docId = editingIdLabel.textContent;

            let parsedJSON;
            try {
                parsedJSON = JSON.parse(jsonTextarea.value);
            } catch (err) {
                alert('❌ Invalid JSON syntax. Please check formatting before saving.');
                return;
            }

            btnSave.disabled = true;
            btnSave.textContent = 'SAVING...';

            try {
                await dbFetch(`/api/v1/admin/db/collection/${selectedCollection}/${docId}`, {
                    method: 'PUT',
                    body: JSON.stringify(parsedJSON)
                });
                alert('✅ Document updated successfully!');
                closeEditor();
                loadDocuments();
            } catch (err) {
                alert('❌ Save failed: ' + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = 'SAVE CHANGES';
            }
        };
    }

    // Attach to global window
    window.renderAdmin = renderAdmin;
})();
