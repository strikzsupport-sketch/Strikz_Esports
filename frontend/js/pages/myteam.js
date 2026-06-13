/* ==========================================================================
   STRIKZ ESPORTS - MY TEAM PANEL & CONFIRMATION SYSTEM
   ========================================================================== */

(function() {
    async function renderMyTeam(container) {
        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 80px; margin-bottom: 80px; max-width: 600px; text-align: center;">
                    <div style="padding: 20px 10px;">
                        <i class="fa-solid fa-users-gear" style="font-size: 58px; color: var(--neon-orange); filter: drop-shadow(0 0 12px var(--neon-orange-glow)); margin-bottom: 20px;"></i>
                        <h2 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 10px; letter-spacing: 0.05em;">SECURE TEAM ACCESS</h2>
                        <p style="color: var(--text-silver); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            You must log in to your gamer profile to manage your esports squad, invite team members, quick-fill registrations, and confirm tournament ticket joins.
                        </p>
                        <button class="cta-button btn-neon-orange w-full" id="btn-team-login-trigger" style="padding: 15px;">
                            <i class="fa-solid fa-right-to-bracket"></i> LOGIN TO ARENA
                        </button>
                    </div>
                </section>
            `;
            
            const btn = document.getElementById('btn-team-login-trigger');
            if (btn) {
                btn.onclick = function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    const loginModal = document.getElementById('login-modal');
                    if (loginModal) {
                        loginModal.classList.add('active');
                    }
                };
            }
            return;
        }

        const user = window.strikzAuth.getUser();
        
        container.innerHTML = `
            <div class="loading-screen" style="padding: 100px 0;">
                <div class="loader-spinner"></div>
                <div class="loader-text font-orbitron">GETTING SQUAD STATUS...</div>
            </div>
        `;

        try {
            // Find user's team details and pending invites from network
            const response = await window.strikzDb.getMyTeam();

            if (!response.team) {
                if (response.invitations && response.invitations.length > 0) {
                    renderInvitationsAndForm(container, user, response.invitations);
                } else {
                    renderCreateTeamForm(container, user);
                }
            } else {
                await renderTeamDashboard(container, user, response.team);
            }
        } catch (err) {
            container.innerHTML = `
                <div class="container text-center" style="padding: 80px 0;">
                    <h3 class="font-orbitron" style="color:var(--neon-orange);">ARENA COMMS FAULT</h3>
                    <p style="color:var(--text-silver); margin-top:10px;">${err.message}</p>
                    <button class="cta-button btn-neon-orange" onclick="window.location.reload();" style="margin-top:20px;">RETRY CONNECTION</button>
                </div>
            `;
        }

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    // PENDING TEAM INVITATIONS SCREEN
    function renderInvitationsAndForm(container, user, invitations) {
        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 800px;">
                <div class="section-header">
                    <span class="section-subtitle">SQUAD INVITATIONS</span>
                    <h2 class="section-title">PENDING <span>TEAM INVITES</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="glass-panel" style="border-color: var(--neon-orange-border); margin-bottom: 40px; background: rgba(255,94,0,0.02); padding: 30px;">
                    <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin-bottom: 20px;">
                        You have been invited to join the following esports squad(s). You can accept to join the roster, or decline the invitation.
                    </p>
                    <div style="display: grid; gap: 15px;">
                        ${invitations.map(inv => `
                            <div style="border: 1px solid var(--glass-border); padding: 20px; border-radius: 4px; background: rgba(0,0,0,0.3); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                                <div style="display: flex; gap: 15px; align-items: center;">
                                    <img src="${inv.logo}" alt="Logo" style="width: 50px; height: 50px; border-radius: 4px; border: 1px solid var(--glass-border); background:rgba(0,0,0,0.5); padding:3px;">
                                    <div>
                                        <h4 class="font-orbitron" style="font-size: 16px; color: #fff; margin:0;">${inv.teamName}</h4>
                                        <div style="font-size: 11px; color: var(--neon-yellow); margin-top:4px; font-weight:700;">CAPTAIN: ${inv.captainName} | ROLE: ${inv.role}</div>
                                        <p style="font-size:12px; color:var(--text-dim); margin: 6px 0 0 0; line-height:1.4;">${inv.description}</p>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="cta-button btn-neon-yellow btn-accept-team-invite" data-team-id="${inv.teamId}" style="padding: 8px 16px; font-size: 11px; font-weight:800; color:#000 !important;">
                                        ACCEPT
                                    </button>
                                    <button class="cta-button btn-neon-orange btn-decline-team-invite" data-team-id="${inv.teamId}" style="padding: 8px 16px; font-size: 11px; font-weight:800;">
                                        DECLINE
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 30px;">
                    <span style="color: var(--text-dim); font-size: 13px;">Or, would you rather establish your own squad?</span>
                    <button class="cta-button btn-neon-yellow" id="btn-show-create-team" style="margin-left: 10px; padding: 6px 16px; font-size: 11px; color:#000 !important; font-weight:800;">CREATE SQUAD</button>
                </div>

                <div id="team-form-mount-container" class="hidden"></div>
            </section>
        `;

        // Bind invite actions
        document.querySelectorAll('.btn-accept-team-invite').forEach(btn => {
            btn.onclick = async function() {
                const teamId = this.dataset.teamId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.acceptTeamInvite(teamId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Welcome to the squad! Team invitation accepted.");
                    renderMyTeam(container);
                } catch(err) {
                    alert("Accept failed: " + err.message);
                }
            };
        });

        document.querySelectorAll('.btn-decline-team-invite').forEach(btn => {
            btn.onclick = async function() {
                const teamId = this.dataset.teamId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                if (!confirm("Are you sure you want to decline this team invitation?")) return;
                try {
                    await window.strikzDb.declineTeamInvite(teamId);
                    alert("Invitation declined.");
                    renderMyTeam(container);
                } catch(err) {
                    alert("Decline failed: " + err.message);
                }
            };
        });

        const btnShow = document.getElementById('btn-show-create-team');
        const mount = document.getElementById('team-form-mount-container');
        btnShow.onclick = function() {
            if (window.strikzPlayClickSound) window.strikzPlayClickSound();
            mount.classList.toggle('hidden');
            if (!mount.classList.contains('hidden')) {
                renderCreateTeamFormInner(mount, user, container);
                btnShow.textContent = 'HIDE FORM';
            } else {
                btnShow.textContent = 'CREATE SQUAD';
            }
        };

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    function renderCreateTeamForm(container, user) {
        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 800px;">
                <div class="section-header">
                    <span class="section-subtitle">INITIALIZE SQUAD</span>
                    <h2 class="section-title">CREATE <span>YOUR TEAM</span></h2>
                    <div class="section-divider"></div>
                </div>
                ${getCreateTeamFormHTML(user)}
            </section>
        `;
        bindCreateTeamForm(user, container);
        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    function renderCreateTeamFormInner(mountElement, user, container) {
        mountElement.innerHTML = getCreateTeamFormHTML(user);
        bindCreateTeamForm(user, container);
        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    function getCreateTeamFormHTML(user) {
        return `
            <div class="glass-panel" style="border-color: var(--neon-yellow-border);">
                <form id="create-team-form" onsubmit="return false;">
                    <div class="form-group">
                        <label>TEAM SQUAD NAME</label>
                        <input type="text" id="new-team-name" placeholder="E.g. Odisha Overlords" required style="color:#fff;">
                    </div>
                    <div class="form-group">
                        <label>TEAM DESCRIPTION / BIO</label>
                        <textarea id="new-team-desc" rows="3" placeholder="Describe your team history, achievements, etc..." required style="width: 100%; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 10px; border-radius: 4px; color:#fff; font-size:13px;"></textarea>
                    </div>

                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin: 30px 0 15px 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">ROSTER LINE-UP (4 CORE MEMBERS)</h4>
                    
                    <!-- Member 1 (Captain) -->
                    <div style="background: rgba(255,230,0,0.02); border: 1px solid var(--neon-yellow-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                        <span class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); display: block; margin-bottom: 10px;">CORE MEMBER #1 (Captain/IGL)</span>
                        <div class="form-row" style="margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Gamer Tag (Username)</label>
                                <input type="text" class="team-member-name" value="${user.username}" readonly disabled style="color:#888; background: rgba(0,0,0,0.2);">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Strikz Gamer UID</label>
                                <input type="text" class="team-member-strikz-uid" value="${user.uid || 'STRIKZ-XXXXXX'}" readonly disabled style="color:#888; background: rgba(0,0,0,0.2);">
                            </div>
                        </div>
                        <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Real Name</label>
                                <input type="text" class="team-member-real" placeholder="Your Full Name" value="${user.username}" required style="color:#fff;">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Free Fire Max UID</label>
                                <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" required style="color:#fff;">
                            </div>
                        </div>
                        <input type="hidden" class="team-member-role" value="IGL">
                    </div>

                    <!-- core players 2, 3, 4 -->
                    ${[2, 3, 4].map(num => `
                        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                            <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">CORE MEMBER #${num} (Invitation via UID)</span>
                            <div class="form-row" style="margin-bottom:0;">
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Strikz Gamer UID (STRIKZ-XXXXXX)</label>
                                    <input type="text" class="team-member-strikz-uid" placeholder="STRIKZ-XXXXXX" style="color:#fff; text-transform: uppercase;">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Combat Roster Role</label>
                                    <select class="team-member-role">
                                        <option value="Rusher">Rusher</option>
                                        <option value="Sniper">Sniper</option>
                                        <option value="Support">Support</option>
                                        <option value="IGL">IGL</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Real Name</label>
                                    <input type="text" class="team-member-real" placeholder="Player's Real Name" style="color:#fff;">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Free Fire Max UID</label>
                                    <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" style="color:#fff;">
                                </div>
                            </div>
                        </div>
                    `).join('')}

                    <button type="submit" class="cta-button btn-neon-orange w-full" style="padding: 15px;">
                        CREATE SQUAD TERMINAL
                    </button>
                </form>
            </div>
        `;
    }

    function bindCreateTeamForm(user, container) {
        const form = document.getElementById('create-team-form');
        if (!form) return;

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const teamName = document.getElementById('new-team-name').value.trim();
            const teamDesc = document.getElementById('new-team-desc').value.trim();

            const stUids = document.querySelectorAll('.team-member-strikz-uid');
            const memberReals = document.querySelectorAll('.team-member-real');
            const memberUids = document.querySelectorAll('.team-member-uid');
            const memberRoles = document.querySelectorAll('.team-member-role');

            const members = [];
            
            // Captain details
            members.push({
                user_uid: user.uid,
                name: user.username,
                realName: memberReals[0].value.trim(),
                gameUid: memberUids[0].value.trim(),
                role: 'IGL'
            });

            // Invited members
            for (let i = 1; i <= 3; i++) {
                const uidVal = stUids[i].value.trim().toUpperCase();
                if (uidVal) {
                    const realVal = memberReals[i].value.trim();
                    const ffUidVal = memberUids[i].value.trim();
                    const roleVal = memberRoles[i].value;

                    if (!realVal || !ffUidVal) {
                        alert(`Please fill in all details (Real Name and Free Fire UID) for Member #${i+1}.`);
                        return;
                    }

                    members.push({
                        user_uid: uidVal,
                        realName: realVal,
                        gameUid: ffUidVal,
                        role: roleVal
                    });
                }
            }

            try {
                await window.strikzDb.createMyTeam({
                    name: teamName,
                    description: teamDesc,
                    members
                });

                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                alert("Esports Squad created successfully! Invitations have been sent to the members.");
                
                renderMyTeam(container);
            } catch (err) {
                alert("Failed to initialize squad: " + err.message);
            }
        };
    }

    // TEAM PROFILE DASHBOARD & REGISTRATION CONFIRMATION SCREEN
    async function renderTeamDashboard(container, user, team) {
        let pendingConfirmations = [];
        try {
            pendingConfirmations = await window.strikzDb.getPendingConfirmations();
        } catch(err) {
            console.error("Failed to load invitations:", err);
        }

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">SQUAD PORTAL</span>
                    <h2 class="section-title">TEAM <span>DASHBOARD</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="grid-2 reveal-stagger">
                    <!-- Squad Profile Details -->
                    <div class="glass-panel" style="border-color: var(--neon-yellow-border);">
                        <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 20px; margin-bottom: 20px;">
                            <img src="${team.logo}" alt="${team.name} Logo" style="width: 80px; height: 80px; border-radius: 4px; border: 1.5px solid var(--glass-border); padding: 5px; background: rgba(0,0,0,0.5);">
                            <div>
                                <h3 class="font-orbitron" style="font-size: 22px; color: #fff; margin:0; text-shadow: 0 0 10px rgba(255,255,255,0.1);">${team.name}</h3>
                                <div style="font-size: 11px; color: var(--neon-yellow); letter-spacing: 0.1em; font-weight: 800; font-family: var(--font-header); margin-top:6px;">CAPTAIN: ${team.captain}</div>
                            </div>
                        </div>

                        <h4 class="font-orbitron" style="font-size: 12px; color: var(--text-white); margin-bottom: 6px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">SQUAD BIO</h4>
                        <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin-bottom: 25px;">${team.description}</p>

                        <h4 class="font-orbitron" style="font-size: 12px; color: var(--neon-yellow); margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">ACTIVE SQUAD ROSTER</h4>
                        <div style="display: grid; gap: 10px;">
                            ${(team.members || []).map((m, idx) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 10px 15px; border-radius: 4px;">
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <span class="font-orbitron" style="color: var(--text-dim); font-size: 11px; font-family:var(--font-header);">#0${idx + 1}</span>
                                        <div>
                                            <div style="font-weight: 700; color: #fff; font-size: 13px; display:flex; align-items:center; gap:8px;">
                                                ${m.name}
                                                <span class="badge-status ${m.confirmed ? 'status-approved' : 'status-pending'}" style="font-size:8px; padding: 2px 6px; line-height: 1;">
                                                    ${m.confirmed ? 'CONFIRMED' : 'PENDING'}
                                                </span>
                                            </div>
                                            <div style="font-size: 10px; color: var(--text-dim);">${m.real_name || m.realName || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 11px; color: var(--neon-cyan); font-weight: 800; font-family: var(--font-header);">${m.role}</div>
                                        <div style="font-size: 9px; color: var(--text-dim);">${m.game_uid || m.gameUid || m.user_uid}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Invitation / Confirms and Tourneys -->
                    <div style="display: flex; flex-direction: column; gap: 30px;">
                        <!-- Pending Tournament Invites / Confirmations Box -->
                        <div class="glass-panel" style="border-color: var(--neon-orange-border); background: rgba(255,94,0,0.02);">
                            <h3 class="font-orbitron" style="font-size: 16px; color: var(--neon-orange); margin-bottom: 15px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-bell"></i> PENDING TICKET SIGN-JOINS</h3>
                            
                            ${pendingConfirmations.length === 0 ? `
                                <div style="text-align: center; padding: 30px 10px; color: var(--text-dim);">
                                    <i class="fa-solid fa-clipboard-check" style="font-size: 38px; color: rgba(255,255,255,0.03); margin-bottom: 10px;"></i>
                                    <p style="font-size: 12px;">No pending tournament joins found for your Gamer UID.</p>
                                </div>
                            ` : `
                                <div style="display: grid; gap: 12px;">
                                    ${pendingConfirmations.map(inv => `
                                        <div style="border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; background: rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 10px;">
                                            <div>
                                                <div style="font-size: 13px; font-weight: 700; color: #fff;">${inv.tournamentName}</div>
                                                <div style="font-size: 10px; color: var(--text-dim); margin-top: 3px;">Ticket Code: ${inv.regId}</div>
                                                <div style="font-size: 11px; color: var(--text-silver); margin-top: 2px;">Team: ${inv.teamName}</div>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                                                <span style="font-size: 10px; color: var(--neon-yellow); font-weight: 700; font-family: var(--font-header);">STAGE 1: ROSTER CONFIRMATION</span>
                                                <button class="cta-button btn-neon-yellow btn-confirm-invite" data-reg-id="${inv.regId}" style="padding: 6px 14px; font-size: 10px; color: #000 !important; font-weight: 800;">
                                                    <i class="fa-solid fa-circle-check"></i> CONFIRM JOIN
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Bind Confirm join button
        document.querySelectorAll('.btn-confirm-invite').forEach(btn => {
            btn.onclick = async function() {
                const regId = this.dataset.regId;
                if (!regId) return;

                if (window.strikzPlayClickSound) window.strikzPlayClickSound();

                try {
                    const res = await window.strikzDb.confirmJoin(regId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Roster join invitation confirmed successfully!");
                    renderMyTeam(container); // Refresh dashboard
                } catch (err) {
                    alert("Roster confirmation failed: " + err.message);
                }
            };
        });

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    // Attach to global window
    window.renderMyTeam = renderMyTeam;
})();
