/* ==========================================================================
   STRIKZ ESPORTS - MY TEAM PANEL & CONFIRMATION SYSTEM
   ========================================================================== */

(function() {
    let activeTab = 'squad'; // Track active tab globally within page scope
    let commsPollInterval = null; // Polling timer for chat channels

    async function renderMyTeam(container) {
        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            alert("Login first to register squad");
            if (window.strikzOpenLoginModal) {
                window.strikzOpenLoginModal();
            }
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
                    if (window.strikzOpenLoginModal) {
                        window.strikzOpenLoginModal();
                    } else {
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) loginModal.classList.add('active');
                    }
                };
            }
            return;
        }

        const user = window.strikzAuth.getUser();
        
        container.innerHTML = `
            <div class="loading-screen" style="padding: 100px 0;">
                <div class="loader-spinner"></div>
                <div class="loader-text font-orbitron">GETTING SQUAD STATUS & COMMS...</div>
            </div>
        `;

        try {
            const teamRes = await window.strikzDb.getMyTeam();
            const team = teamRes.team;

            if (activeTab !== 'squad' && activeTab !== 'chat') {
                activeTab = 'squad';
            }

            // Render Page Frame with Tab Bar
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 900px;">
                    <div class="section-header" style="margin-bottom: 30px;">
                        <span class="section-subtitle">GAMER PORTAL</span>
                        <h2 class="section-title">SQUAD <span>HQ</span></h2>
                        <div class="section-divider"></div>
                    </div>

                    <!-- Comms Navigation Tabs -->
                    <div class="comms-tabs-nav font-orbitron" style="display:flex; gap:10px; margin-bottom: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom:12px; flex-wrap:wrap;">
                        <button class="tab-trigger ${activeTab === 'squad' ? 'active' : ''}" id="tab-btn-squad" style="background:none; border:none; color:${activeTab === 'squad' ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-size:14px; font-weight:800; padding: 8px 16px; cursor:pointer; font-family:var(--font-header); letter-spacing:0.05em; border-bottom: 2px solid ${activeTab === 'squad' ? 'var(--neon-yellow)' : 'transparent'}; transition: all 0.3s;">
                            <i class="fa-solid fa-users-gear"></i> SQUAD PORTAL
                        </button>
                        <button class="tab-trigger ${activeTab === 'chat' ? 'active' : ''}" id="tab-btn-chat" style="background:none; border:none; color:${activeTab === 'chat' ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-size:14px; font-weight:800; padding: 8px 16px; cursor:pointer; font-family:var(--font-header); letter-spacing:0.05em; border-bottom: 2px solid ${activeTab === 'chat' ? 'var(--neon-yellow)' : 'transparent'}; transition: all 0.3s;">
                            <i class="fa-solid fa-comments"></i> TEAM CHAT
                        </button>
                    </div>

                    <div id="comms-tab-content"></div>
                </section>
            `;

            const tabSquadBtn = document.getElementById('tab-btn-squad');
            const tabChatBtn = document.getElementById('tab-btn-chat');
            const tabContentMount = document.getElementById('comms-tab-content');

            // Switch tab function
            const switchTab = (tabId) => {
                if (commsPollInterval) { clearInterval(commsPollInterval); commsPollInterval = null; }
                activeTab = tabId;
                
                const tabs = [
                    { id: 'squad', btn: tabSquadBtn },
                    { id: 'chat', btn: tabChatBtn }
                ];
                
                tabs.forEach(t => {
                    if (t.btn) {
                        if (t.id === activeTab) {
                            t.btn.style.color = 'var(--neon-yellow)';
                            t.btn.style.borderBottom = '2px solid var(--neon-yellow)';
                        } else {
                            t.btn.style.color = 'var(--text-dim)';
                            t.btn.style.borderBottom = '2px solid transparent';
                        }
                    }
                });

                if (activeTab === 'squad') {
                    renderSquadTab(tabContentMount, user, team, container);
                } else if (activeTab === 'chat') {
                    renderTeamChatTab(tabContentMount, team, container);
                }
                
                if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
                if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
            };

            if (tabSquadBtn) tabSquadBtn.onclick = () => { if (window.strikzPlayClickSound) window.strikzPlayClickSound(); switchTab('squad'); };
            if (tabChatBtn) tabChatBtn.onclick = () => { if (window.strikzPlayClickSound) window.strikzPlayClickSound(); switchTab('chat'); };

            // Initial Tab Render
            switchTab(activeTab);

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

    // SQUAD TAB VIEW RENDERING
    function renderSquadTab(mount, user, team, container) {
        if (!team) {
            // Render Create Team Form
            mount.innerHTML = `
                <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 30px;">
                    <h3 class="font-orbitron" style="font-size:18px; color:#fff; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">ESTABLISH YOUR ESPORTS SQUAD</h3>
                    <p style="font-size:13px; color:var(--text-silver); margin-bottom:25px; line-height:1.5;">
                        Create a permanent squad roster, invite your teammates using their copyable Strikz Gamer UIDs, and prepare for championship listings.
                    </p>
                    ${getCreateTeamFormHTML(user)}
                </div>
            `;
            bindCreateTeamForm(user, container);
        } else {
            // Render Squad Profile / Dashboard Details
            mount.innerHTML = `
                <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 30px;">
                    <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div style="position: relative; display: inline-block;">
                            <img id="team-dashboard-logo-img" src="${team.logo}" alt="${team.name} Logo" style="width: 80px; height: 80px; border-radius: 4px; border: 1.5px solid var(--glass-border); padding: 5px; background: rgba(0,0,0,0.5); display:block; object-fit: cover;">
                            ${team.captain_uid === user.uid ? `
                                <button id="btn-change-team-logo" style="position: absolute; bottom:-5px; right:-5px; background:var(--neon-yellow); color:#000; border:none; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:11px; box-shadow:0 0 10px rgba(0,0,0,0.5);" title="Upload Team Logo">
                                    <i class="fa-solid fa-camera"></i>
                                </button>
                                <input type="file" id="team-logo-upload-file" accept="image/*" style="display:none;">
                            ` : ''}
                        </div>
                        <div style="flex-grow: 1;">
                            <h3 class="font-orbitron" style="font-size: 22px; color: #fff; margin:0; text-shadow: 0 0 10px rgba(255,255,255,0.1); text-transform: uppercase;">${team.name}</h3>
                            <div style="font-size: 11px; color: var(--neon-yellow); letter-spacing: 0.1em; font-weight: 800; font-family: var(--font-header); margin-top:6px; text-transform: uppercase;">CAPTAIN: ${team.captain}</div>
                        </div>
                        <div>
                            ${team.captain_uid === user.uid ? `
                                <span class="badge-status status-approved font-orbitron" style="font-size:10px; font-weight:800; letter-spacing:0.05em; padding: 6px 14px;">CAPTAIN ACCESS</span>
                            ` : `
                                <span class="badge-status status-pending font-orbitron" style="font-size:10px; font-weight:800; letter-spacing:0.05em; padding: 6px 14px;">MEMBER ACCESS</span>
                            `}
                        </div>
                    </div>

                    <h4 class="font-orbitron" style="font-size: 12px; color: var(--text-white); margin-bottom: 6px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">SQUAD BIO</h4>
                    <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin-bottom: 25px;">${team.description}</p>

                    <h4 class="font-orbitron" style="font-size: 12px; color: var(--neon-yellow); margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">ACTIVE SQUAD ROSTER</h4>
                    <div style="display: grid; gap: 10px;">
                        ${(team.members || []).map((m, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 10px 15px; border-radius: 4px; gap: 15px;">
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <span class="font-orbitron" style="color: var(--text-dim); font-size: 11px; font-family:var(--font-header);">#0${idx + 1}</span>
                                    <img src="${m.avatar || 'assets/default-avatar.png'}" alt="Player Photo" style="width:36px; height:36px; border-radius:50%; border: 1px solid var(--glass-border); object-fit:cover; background:rgba(0,0,0,0.5);">
                                    <div>
                                        <div style="font-weight: 700; color: #fff; font-size: 13px; display:flex; align-items:center; gap:8px;">
                                            ${m.name}
                                            <span class="badge-status ${m.confirmed ? 'status-approved' : 'status-pending'}" style="font-size:8px; padding: 2px 6px; line-height: 1;">
                                                ${m.confirmed ? 'CONFIRMED' : 'PENDING'}
                                            </span>
                                        </div>
                                        <div style="font-size: 10px; color: var(--text-silver);">${m.real_name || m.realName || 'N/A'} ${m.ign ? `| IGN: <span style="color:var(--neon-yellow);">${m.ign}</span>` : ''}</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 15px; text-align: right;">
                                    <div>
                                        <div style="font-size: 11px; color: var(--neon-cyan); font-weight: 800; font-family: var(--font-header);">${m.role}</div>
                                        <div style="font-size: 9px; color: var(--text-dim);">${m.game_uid || m.gameUid || m.user_uid}</div>
                                    </div>
                                    ${(team.captain_uid === user.uid && m.user_uid !== user.uid) ? `
                                        <button class="btn-kick-member font-orbitron" data-member-uid="${m.user_uid}" data-member-name="${m.name}" style="background: none; border: 1px solid rgba(255,94,0,0.3); border-radius: 3px; color: var(--neon-orange); cursor: pointer; font-size: 10px; font-weight: 800; padding: 4px 8px; transition: all 0.2s;" title="Kick player from roster">
                                            KICK
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Squad Actions -->
                    <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; gap: 15px; flex-wrap: wrap;">
                        ${team.captain_uid === user.uid ? `
                            <button class="cta-button btn-neon-yellow" id="btn-edit-team" style="padding: 10px 22px; font-size: 12px; font-weight:800; display:flex; align-items:center; gap:8px; color:#000 !important;">
                                <i class="fa-solid fa-pen-to-square"></i> EDIT SQUAD
                            </button>
                            <button class="cta-button btn-neon-orange" id="btn-disband-team" style="padding: 10px 22px; font-size: 12px; font-weight:800; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-burst"></i> DISBAND TEAM
                            </button>
                        ` : `
                            <button class="cta-button btn-neon-orange" id="btn-leave-team" style="padding: 10px 22px; font-size: 12px; font-weight:800; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-right-from-bracket"></i> LEAVE TEAM
                            </button>
                        `}
                    </div>
                </div>
            `;

            // Bind team logo change if captain
            const changeLogoBtn = document.getElementById('btn-change-team-logo');
            const logoUploadFile = document.getElementById('team-logo-upload-file');
            if (changeLogoBtn && logoUploadFile) {
                changeLogoBtn.onclick = () => logoUploadFile.click();
                logoUploadFile.onchange = async function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            const res = await window.strikzDb.uploadFile(file);
                            await window.strikzDb.updateTeamLogo(res.imageUrl);
                            renderMyTeam(container);
                            alert("Team logo updated successfully!");
                        } catch (err) {
                            alert("Logo update failed: " + err.message);
                        }
                    }
                };
            }

            // Bind kick buttons
            document.querySelectorAll('.btn-kick-member').forEach(btn => {
                btn.onmouseenter = () => {
                    btn.style.borderColor = 'var(--neon-orange)';
                    btn.style.background = 'rgba(255,94,0,0.05)';
                };
                btn.onmouseleave = () => {
                    btn.style.borderColor = 'rgba(255,94,0,0.3)';
                    btn.style.background = 'transparent';
                };
                btn.onclick = async function() {
                    const memberUid = this.dataset.memberUid;
                    const memberName = this.dataset.memberName;
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (!confirm(`Are you absolutely sure you want to remove ${memberName} (${memberUid}) from your squad roster?`)) return;

                    try {
                        await window.strikzDb.kickMember(memberUid);
                        alert(`${memberName} has been removed from the team.`);
                        renderMyTeam(container); // Reload page
                    } catch (err) {
                        alert("Kick action failed: " + err.message);
                    }
                };
            });

            // Bind Leave Team button
            const leaveBtn = document.getElementById('btn-leave-team');
            if (leaveBtn) {
                leaveBtn.onclick = async function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (!confirm("Are you sure you want to leave this team roster? You will no longer belong to this squad and must be re-invited to join.")) return;

                    try {
                        await window.strikzDb.leaveTeam();
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        alert("You have left the team roster.");
                        renderMyTeam(container);
                    } catch (err) {
                        alert("Leave team failed: " + err.message);
                    }
                };
            }

            // Bind Edit Team button
            const editBtn = document.getElementById('btn-edit-team');
            if (editBtn) {
                editBtn.onclick = function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    renderEditTeamForm(user, team, container);
                };
            }

            // Bind Disband Team button
            const disbandBtn = document.getElementById('btn-disband-team');
            if (disbandBtn) {
                disbandBtn.onclick = async function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (!confirm("CRITICAL ACTION: Are you sure you want to disband your squad? This will delete the team profile and notify all roster members. This action cannot be undone!")) return;

                    try {
                        await window.strikzDb.disbandTeam();
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        alert("Your esports squad has been disbanded.");
                        renderMyTeam(container);
                    } catch (err) {
                        alert("Disband team failed: " + err.message);
                    }
                };
            }
        }
    }

    async function refreshCurrentInbox(container) {
        const hash = window.location.hash || '#/';
        if (hash.startsWith('#/myteam')) {
            renderMyTeam(container);
        } else if (hash.startsWith('#/inbox')) {
            renderInboxPage(container);
        } else {
            // Home page or other pages
            const mount = document.getElementById('home-inbox-mount');
            const section = document.getElementById('home-inbox-section');
            if (mount && section) {
                try {
                    const res = await window.strikzDb.getMyTeamInbox();
                    const inbox = res.inbox || [];
                    if (inbox.length > 0) {
                        section.classList.remove('hidden');
                        renderInboxTab(mount, inbox, container);
                    } else {
                        section.classList.add('hidden');
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
        if (window.updateInboxBadges) window.updateInboxBadges();
    }
    window.refreshCurrentInbox = refreshCurrentInbox;

    // INBOX TAB VIEW RENDERING
    function renderInboxTab(mount, inbox, container) {
        if (inbox.length === 0) {
            mount.innerHTML = `
                <div class="glass-panel text-center" style="border-color: var(--glass-border); padding: 60px 20px;">
                    <i class="fa-solid fa-envelope-open" style="font-size: 50px; color: rgba(255,255,255,0.03); margin-bottom: 20px; filter:drop-shadow(0 0 10px rgba(255,255,255,0.01));"></i>
                    <h4 class="font-orbitron" style="font-size: 14px; color:#fff; letter-spacing:0.05em; margin-bottom:6px;">YOUR ARENA INBOX IS EMPTY</h4>
                    <p style="font-size: 12px; color: var(--text-dim); max-width:350px; margin:0 auto; line-height:1.4;">
                        Roster invites, tournament signs, and squad broadcasts will appear in this terminal channel.
                    </p>
                </div>
            `;
            return;
        }

        mount.innerHTML = `
            <div style="display: grid; gap: 15px;">
                ${inbox.map(item => {
                    if (item.type === 'team_invite') {
                        return `
                            <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; background: rgba(255,230,0,0.01);">
                                <div style="display: flex; gap: 15px; align-items: center; min-width: 250px; flex: 1;">
                                    <img src="${item.metadata.logo}" alt="Logo" style="width: 50px; height: 50px; border-radius: 4px; border: 1px solid var(--glass-border); background:rgba(0,0,0,0.5); padding:3px;">
                                    <div>
                                        <h4 class="font-orbitron" style="font-size: 15px; color: #fff; margin:0;">${item.title}</h4>
                                        <div style="font-size: 11px; color: var(--neon-yellow); margin-top:4px; font-weight:700;">CAPTAIN: ${item.metadata.captainName} | ROLE: ${item.metadata.role}</div>
                                        <p style="font-size:12px; color:var(--text-dim); margin: 6px 0 0 0; line-height:1.4;">${item.metadata.description}</p>
                                        <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:6px;"><i class="fa-solid fa-clock"></i> ${window.strikzFormatDate(item.date)}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="cta-button btn-neon-yellow btn-inbox-accept-invite" data-team-id="${item.metadata.teamId}" style="padding: 8px 16px; font-size: 11px; font-weight:800; color:#000 !important;">
                                        ACCEPT
                                    </button>
                                    <button class="cta-button btn-neon-orange btn-inbox-decline-invite" data-team-id="${item.metadata.teamId}" style="padding: 8px 16px; font-size: 11px; font-weight:800;">
                                        DECLINE
                                    </button>
                                </div>
                            </div>
                        `;
                    } else if (item.type === 'tournament_confirm') {
                        return `
                            <div class="glass-panel" style="border-color: var(--neon-orange-border); padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; background: rgba(255,94,0,0.01);">
                                <div style="min-width: 250px; flex: 1;">
                                    <h4 class="font-orbitron" style="font-size: 15px; color: #fff; margin:0; display:flex; align-items:center; gap:8px;">
                                        <i class="fa-solid fa-file-signature" style="color:var(--neon-orange)"></i> ${item.title}
                                    </h4>
                                    <p style="font-size:13px; color:var(--text-silver); margin: 8px 0 0 0; line-height:1.4;">${item.message}</p>
                                    <div style="font-size:11px; color:var(--text-dim); margin-top:5px;">Ticket Code: <strong>${item.metadata.regId}</strong></div>
                                    <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:6px;"><i class="fa-solid fa-clock"></i> ${window.strikzFormatDate(item.date)}</span>
                                </div>
                                <div>
                                    <button class="cta-button btn-neon-yellow btn-inbox-confirm-join" data-reg-id="${item.metadata.regId}" style="padding: 8px 16px; font-size: 11px; font-weight:800; color:#000 !important; white-space:nowrap;">
                                        CONFIRM JOIN
                                    </button>
                                </div>
                            </div>
                        `;
                    } else {
                        // General alerts / notifications from database
                        return `
                            <div class="glass-panel" style="border-color: var(--glass-border); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                                <div style="flex:1;">
                                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin:0; display:flex; align-items:center; gap:6px;">
                                        <i class="fa-solid fa-circle-info"></i> ${item.title}
                                    </h4>
                                    <p style="font-size:12px; color:var(--text-silver); margin: 6px 0 0 0; line-height:1.4;">${item.message}</p>
                                    <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:4px;"><i class="fa-solid fa-clock"></i> ${window.strikzFormatDate(item.date)}</span>
                                </div>
                                <div>
                                    <button class="btn-inbox-dismiss" data-notif-id="${item.id}" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:14px; padding:6px; transition:color 0.2s;" title="Dismiss message">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;

        // Bind Accept Team Invitation
        document.querySelectorAll('.btn-inbox-accept-invite').forEach(btn => {
            btn.onclick = async function() {
                const teamId = this.dataset.teamId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.acceptTeamInvite(teamId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Welcome to the squad! Team invitation accepted.");
                    refreshCurrentInbox(container);
                } catch(err) {
                    alert("Accept failed: " + err.message);
                }
            };
        });

        // Bind Decline Team Invitation
        document.querySelectorAll('.btn-inbox-decline-invite').forEach(btn => {
            btn.onclick = async function() {
                const teamId = this.dataset.teamId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                if (!confirm("Are you sure you want to decline this team invitation?")) return;
                try {
                    await window.strikzDb.declineTeamInvite(teamId);
                    alert("Invitation declined.");
                    refreshCurrentInbox(container);
                } catch(err) {
                    alert("Decline failed: " + err.message);
                }
            };
        });

        // Bind Tournament Roster Confirmation Join
        document.querySelectorAll('.btn-inbox-confirm-join').forEach(btn => {
            btn.onclick = async function() {
                const regId = this.dataset.regId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.confirmJoin(regId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Roster join invitation confirmed successfully!");
                    refreshCurrentInbox(container);
                } catch (err) {
                    alert("Roster confirmation failed: " + err.message);
                }
            };
        });

        // Bind Alert Dismissal
        document.querySelectorAll('.btn-inbox-dismiss').forEach(btn => {
            btn.onmouseenter = () => btn.style.color = 'var(--neon-orange)';
            btn.onmouseleave = () => btn.style.color = 'var(--text-dim)';
            btn.onclick = async function() {
                const notifId = this.dataset.notifId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.dismissNotification(notifId);
                    refreshCurrentInbox(container);
                } catch (err) {
                    alert("Failed to dismiss notification: " + err.message);
                }
            };
        });
    }

    // FRIENDS & DM TAB RENDERING
    async function renderFriendsTab(mount, container) {
        if (commsPollInterval) { clearInterval(commsPollInterval); commsPollInterval = null; }

        mount.innerHTML = `
            <div class="loading-screen" style="padding: 40px 0;">
                <div class="loader-spinner"></div>
                <div class="loader-text font-orbitron">SYNCING FREQUENCY...</div>
            </div>
        `;

        try {
            const [friends, requests] = await Promise.all([
                window.strikzDb.getFriends(),
                window.strikzDb.getFriendRequests()
            ]);

            mount.innerHTML = `
                <div class="friends-layout-grid">
                    <!-- Left Column: Friends List & Requests -->
                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <!-- Send Request Form -->
                        <div class="glass-panel" style="padding:15px; border-color:var(--glass-border); overflow:visible !important; position:relative; z-index:10;">
                            <h4 class="font-orbitron" style="font-size: 11px; color: var(--neon-cyan); margin-bottom:12px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">ADD FREQUENCY (FRIEND)</h4>
                            <div style="position:relative; display:flex; gap:6px;">
                                <input type="text" id="friend-search-input" placeholder="Enter gamer uid" style="flex-grow:1; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); padding:8px 12px; color:#fff; border-radius:4px; font-size:12px; text-transform: lowercase;">
                                <button class="cta-button btn-neon-cyan" id="btn-send-friend-request" style="padding:8px 12px; font-size:11px; font-weight:800; white-space:nowrap;">
                                    ADD
                                </button>
                                <div id="friend-autocomplete-dropdown" class="autocomplete-dropdown glass-panel" style="display:none; position:absolute; z-index:100; left:0; right:0; top:38px; max-height:150px; overflow-y:auto; background:#0e0e12; border:1px solid var(--glass-border);"></div>
                            </div>
                        </div>

                        <!-- Pending Requests -->
                        <div class="glass-panel" style="padding:15px; border-color:var(--glass-border);">
                            <h4 class="font-orbitron" style="font-size: 11px; color: var(--neon-orange); margin-bottom:10px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">PENDING REQUESTS</h4>
                            <div id="friends-requests-list" style="display:flex; flex-direction:column; gap:8px;">
                                ${requests.length === 0 ? `
                                    <div style="font-size:11px; color:var(--text-dim); text-align:center; padding:10px 0;">No pending signals</div>
                                ` : requests.map(r => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid var(--glass-border); padding:8px; border-radius:4px; gap:8px;">
                                        <div style="display:flex; gap:6px; align-items:center; min-width:0;">
                                            <img src="${r.sender.avatar || 'assets/default-avatar.png'}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                                            <div style="min-width:0;">
                                                <div style="font-size:11px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.sender.username}</div>
                                                <div style="font-size:9px; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.sender.uid}</div>
                                            </div>
                                        </div>
                                        <div style="display:flex; gap:4px; flex-shrink:0;">
                                            <button class="btn-accept-friend font-orbitron" data-id="${r.id}" style="background:var(--neon-yellow); color:#000; border:none; padding:4px 8px; border-radius:2px; font-size:9px; font-weight:800; cursor:pointer;" title="Accept">ACCEPT</button>
                                            <button class="btn-reject-friend font-orbitron" data-id="${r.id}" style="background:rgba(255,94,0,0.2); color:var(--neon-orange); border:1px solid rgba(255,94,0,0.3); padding:3px 6px; border-radius:2px; font-size:9px; font-weight:800; cursor:pointer;" title="Decline">DECLINE</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Friends List -->
                        <div class="glass-panel" style="padding:15px; border-color:var(--glass-border); flex-grow:1; min-height:200px;">
                            <h4 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-bottom:10px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">COMMS LINKS (FRIENDS)</h4>
                            <div id="friends-list-items" style="display:flex; flex-direction:column; gap:8px;">
                                ${friends.length === 0 ? `
                                    <div style="font-size:11px; color:var(--text-dim); text-align:center; padding:20px 0;">No active comms. Add friends to start chatting!</div>
                                ` : friends.map(f => `
                                    <div class="friend-list-item" data-uid="${f.uid}" data-username="${f.username}" style="display:flex; gap:10px; align-items:center; padding:8px 10px; border:1px solid var(--glass-border); border-radius:4px; cursor:pointer; background:rgba(255,255,255,0.01); transition:all 0.2s;">
                                        <img src="${f.avatar || 'assets/default-avatar.png'}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--glass-border);">
                                        <div style="flex-grow:1; min-width:0;">
                                            <div style="font-size:12px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.username}</div>
                                            <div style="font-size:9px; color:var(--neon-cyan); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.uid}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: DM Chat Box -->
                    <div class="glass-panel" style="display:flex; flex-direction:column; height:480px; border-color:var(--glass-border); padding:0; overflow:hidden; position:relative;">
                        <div id="dm-chat-placeholder" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:30px; text-align:center; background:rgba(0,0,0,0.15);">
                            <i class="fa-solid fa-comments" style="font-size:48px; color:rgba(255,255,255,0.03); margin-bottom:15px; filter:drop-shadow(0 0 8px rgba(0,240,255,0.02));"></i>
                            <h4 class="font-orbitron" style="font-size:13px; color:#fff; letter-spacing:0.05em; margin-bottom:6px;">SELECT FREQUENCY LINK</h4>
                            <p style="font-size:11px; color:var(--text-dim); max-width:280px; line-height:1.4; margin:0;">
                                Click on a friend from your links to open a secure direct-message channel.
                            </p>
                        </div>
                        <div id="dm-chat-active-window" style="display:none; flex-direction:column; height:100%;">
                            <!-- Header -->
                            <div style="display:flex; gap:10px; align-items:center; padding:12px 15px; border-bottom:1px solid var(--glass-border); background:rgba(0,0,0,0.2);">
                                <img id="dm-active-avatar" src="" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--glass-border);">
                                <div>
                                    <div id="dm-active-username" style="font-size:12px; font-weight:700; color:#fff; line-height:1.2;"></div>
                                    <div id="dm-active-uid" style="font-size:9px; color:var(--neon-cyan); line-height:1.2;"></div>
                                </div>
                            </div>
                            <!-- Messages -->
                            <div class="chat-messages-container" id="dm-chat-messages-mount">
                                <!-- Loaded dynamically -->
                            </div>
                            <!-- Input -->
                            <form id="dm-chat-input-form" class="chat-input-row" onsubmit="return false;">
                                <input type="text" id="dm-chat-message-text" placeholder="Type transmission..." required autocomplete="off">
                                <button type="submit" class="chat-send-btn">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            // Bind Friend Search Autocomplete
            const searchInput = document.getElementById('friend-search-input');
            const searchDropdown = document.getElementById('friend-autocomplete-dropdown');
            if (searchInput && searchDropdown) {
                searchInput.oninput = async function() {
                    const query = searchInput.value.trim().toLowerCase();
                    if (!query || query.length < 2) {
                        searchDropdown.style.display = 'none';
                        searchDropdown.innerHTML = '';
                        return;
                    }
                    try {
                        const response = await fetch(`/api/v1/auth/users/search?query=${encodeURIComponent(query)}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('strikz_jwt_token') || sessionStorage.getItem('strikz_jwt_token')}`
                            }
                        });
                        const resData = await response.json();
                        const users = resData.users || [];
                        if (users.length === 0) {
                            searchDropdown.innerHTML = `<div style="padding:8px 12px; color:var(--text-dim); font-size:11px;">No gamers found</div>`;
                        } else {
                            searchDropdown.innerHTML = users.map(u => `
                                <div class="autocomplete-item" data-uid="${u.uid}" style="display:flex; gap:8px; align-items:center; padding:6px 10px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.02); transition:background 0.2s;">
                                    <img src="${u.avatar || 'assets/default-avatar.png'}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                                    <div>
                                        <div style="font-size:11px; color:#fff; font-weight:700;">${u.username}</div>
                                        <div style="font-size:9px; color:var(--neon-cyan);">${u.uid}</div>
                                    </div>
                                </div>
                            `).join('');
                            
                            searchDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                                item.onclick = function() {
                                    searchInput.value = this.dataset.uid;
                                    searchDropdown.style.display = 'none';
                                };
                            });
                        }
                        searchDropdown.style.display = 'block';
                    } catch (err) {
                        console.error(err);
                    }
                };

                document.addEventListener('click', function(e) {
                    if (e.target !== searchInput && e.target !== searchDropdown && !searchDropdown.contains(e.target)) {
                        searchDropdown.style.display = 'none';
                    }
                });
            }

            // Bind Friend Request submission
            const requestBtn = document.getElementById('btn-send-friend-request');
            if (requestBtn && searchInput) {
                requestBtn.onclick = async function() {
                    const friendUid = searchInput.value.trim().toLowerCase();
                    if (!friendUid) return;
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    try {
                        await window.strikzDb.sendFriendRequest(friendUid);
                        searchInput.value = '';
                        alert(`Signal sent successfully! Pending approval from ${friendUid}.`);
                        renderFriendsTab(mount, container);
                    } catch (err) {
                        alert("Friend request failed: " + err.message);
                    }
                };
            }

            // Bind Pending Request Accept/Reject
            mount.querySelectorAll('.btn-accept-friend').forEach(btn => {
                btn.onclick = async function() {
                    const reqId = this.dataset.id;
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    try {
                        await window.strikzDb.acceptFriendRequest(reqId);
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        alert("Friend request accepted!");
                        renderFriendsTab(mount, container);
                    } catch (err) {
                        alert("Accept request failed: " + err.message);
                    }
                };
            });

            mount.querySelectorAll('.btn-reject-friend').forEach(btn => {
                btn.onclick = async function() {
                    const reqId = this.dataset.id;
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    try {
                        await window.strikzDb.rejectFriendRequest(reqId);
                        alert("Friend request declined.");
                        renderFriendsTab(mount, container);
                    } catch (err) {
                        alert("Decline request failed: " + err.message);
                    }
                };
            });

            // Bind Friend Clicks for DMs
            const placeholder = document.getElementById('dm-chat-placeholder');
            const activeWindow = document.getElementById('dm-chat-active-window');
            const dmAvatar = document.getElementById('dm-active-avatar');
            const dmUsername = document.getElementById('dm-active-username');
            const dmUid = document.getElementById('dm-active-uid');
            const messagesMount = document.getElementById('dm-chat-messages-mount');
            const chatForm = document.getElementById('dm-chat-input-form');
            const chatMsgText = document.getElementById('dm-chat-message-text');

            let activeFriendUid = null;

            const pollMessages = async () => {
                if (!activeFriendUid || !document.getElementById('dm-chat-active-window')) return;
                try {
                    const history = await window.strikzDb.getChatMessageHistory(activeFriendUid);
                    const wasScrolledToBottom = messagesMount.scrollHeight - messagesMount.clientHeight <= messagesMount.scrollTop + 30;

                    messagesMount.innerHTML = history.map(msg => {
                        const isMe = msg.sender_uid !== activeFriendUid;
                        return `
                            <div class="chat-msg-bubble ${isMe ? 'sent' : 'received'}">
                                <div style="font-weight:700; font-size:10px; color:${isMe ? 'var(--neon-cyan)' : 'var(--neon-yellow)'}; margin-bottom:3px;">
                                    ${isMe ? 'YOU' : dmUsername.textContent}
                                </div>
                                <div>${msg.content}</div>
                                <span style="font-size:8px; color:rgba(255,255,255,0.3); display:block; text-align:right; margin-top:4px;">
                                    ${window.strikzFormatDate(msg.created_at)}
                                </span>
                            </div>
                        `;
                    }).join('');

                    if (wasScrolledToBottom) {
                        messagesMount.scrollTop = messagesMount.scrollHeight;
                    }
                } catch (err) {
                    console.error("DM polling failed:", err.message);
                }
            };

            mount.querySelectorAll('.friend-list-item').forEach(item => {
                item.onclick = async function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    
                    mount.querySelectorAll('.friend-list-item').forEach(x => {
                        x.style.background = 'rgba(255,255,255,0.01)';
                        x.style.borderColor = 'var(--glass-border)';
                    });
                    item.style.background = 'rgba(0, 240, 255, 0.05)';
                    item.style.borderColor = 'rgba(0, 240, 255, 0.3)';

                    const uidVal = this.dataset.uid;
                    const usernameVal = this.dataset.username;
                    const imgVal = this.querySelector('img').src;

                    activeFriendUid = uidVal;
                    dmAvatar.src = imgVal;
                    dmUsername.textContent = usernameVal;
                    dmUid.textContent = uidVal;

                    placeholder.style.display = 'none';
                    activeWindow.style.display = 'flex';

                    if (activeWindow && window.innerWidth <= 768) {
                        activeWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }

                    messagesMount.innerHTML = `<div style="text-align:center; padding:20px; font-size:11px; color:var(--text-dim);">SYNCING TRANS-RECEIVERS...</div>`;
                    
                    await pollMessages();
                    messagesMount.scrollTop = messagesMount.scrollHeight;

                    if (commsPollInterval) clearInterval(commsPollInterval);
                    commsPollInterval = setInterval(pollMessages, 3000);
                };
            });

            if (chatForm) {
                chatForm.onsubmit = async function(e) {
                    if (e) e.preventDefault();
                    const text = chatMsgText.value.trim();
                    if (!text || !activeFriendUid) return;

                    try {
                        await window.strikzDb.sendChatMessage(activeFriendUid, text);
                        chatMsgText.value = '';
                        await pollMessages();
                        messagesMount.scrollTop = messagesMount.scrollHeight;
                    } catch (err) {
                        alert("Transmission failure: " + err.message);
                    }
                };
            }

        } catch (err) {
            mount.innerHTML = `
                <div class="glass-panel text-center" style="padding:40px;">
                    <h4 class="font-orbitron" style="color:var(--neon-orange);">FREQUENCY ERROR</h4>
                    <p style="font-size:12px; color:var(--text-silver); margin-top:8px;">${err.message}</p>
                </div>
            `;
        }
    }

    // TEAM GROUP CHAT RENDERING
    async function renderTeamChatTab(mount, team, container) {
        if (commsPollInterval) { clearInterval(commsPollInterval); commsPollInterval = null; }

        if (!team) {
            mount.innerHTML = `
                <div class="glass-panel text-center" style="border-color: var(--neon-orange-border); padding: 60px 20px; background: rgba(255,94,0,0.015);">
                    <i class="fa-solid fa-lock" style="font-size: 50px; color: var(--neon-orange); margin-bottom: 20px; filter:drop-shadow(0 0 10px rgba(255,94,0,0.2));"></i>
                    <h4 class="font-orbitron" style="font-size: 14px; color:#fff; letter-spacing:0.05em; margin-bottom:8px; text-transform:uppercase;">TEAM FREQUENCY ENCRYPTED</h4>
                    <p style="font-size: 12px; color: var(--text-silver); max-width:385px; margin:0 auto; line-height:1.5;">
                        You must create or join an active Esports Squad to unlock the secure squad-wide communication frequency.
                    </p>
                </div>
            `;
            return;
        }

        mount.innerHTML = `
            <div class="glass-panel" style="display:flex; flex-direction:column; height:500px; border-color:var(--neon-yellow-border); padding:0; overflow:hidden;">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid var(--glass-border); background:rgba(0,0,0,0.25);">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <img src="${team.logo}" style="width:36px; height:36px; border-radius:4px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); padding:2px; object-fit: cover;">
                        <div>
                            <h4 class="font-orbitron" style="font-size:14px; color:#fff; margin:0; text-transform:uppercase;">${team.name} SQUAD FREQUENCY</h4>
                            <div style="font-size:9px; color:var(--neon-yellow); letter-spacing:0.05em; font-weight:800; text-transform:uppercase;">SECURE TEAM COMM-LINK</div>
                        </div>
                    </div>
                </div>
                <!-- Messages -->
                <div class="chat-messages-container" id="team-chat-messages-mount">
                    <div style="text-align:center; padding:20px; font-size:11px; color:var(--text-dim);">SYNCING TEAM TRANS-RECEIVERS...</div>
                </div>
                <!-- Input -->
                <form id="team-chat-input-form" class="chat-input-row" onsubmit="return false;">
                    <input type="text" id="team-chat-message-text" placeholder="Broadcast to squad..." required autocomplete="off">
                    <button type="submit" class="chat-send-btn">
                        <i class="fa-solid fa-paper-plane" style="color:var(--neon-yellow);"></i>
                    </button>
                </form>
            </div>
        `;

        const messagesMount = document.getElementById('team-chat-messages-mount');
        const chatForm = document.getElementById('team-chat-input-form');
        const chatMsgText = document.getElementById('team-chat-message-text');

        const pollTeamMessages = async () => {
            if (activeTab !== 'chat') return;
            try {
                const history = await window.strikzDb.getTeamMessageHistory();
                const wasScrolledToBottom = messagesMount.scrollHeight - messagesMount.clientHeight <= messagesMount.scrollTop + 30;

                messagesMount.innerHTML = history.map(msg => {
                    const isMe = msg.sender_uid === window.strikzAuth.getUser().uid;
                    return `
                        <div class="chat-msg-bubble ${isMe ? 'sent' : 'received'}" style="${isMe ? 'background:rgba(255,230,0,0.08); border-color:rgba(255,230,0,0.25);' : ''}">
                            <div style="font-weight:700; font-size:10px; color:${isMe ? 'var(--neon-yellow)' : 'var(--neon-cyan)'}; margin-bottom:3px;">
                                ${isMe ? 'YOU' : msg.sender_name}
                            </div>
                            <div>${msg.content}</div>
                            <span style="font-size:8px; color:rgba(255,255,255,0.3); display:block; text-align:right; margin-top:4px;">
                                ${window.strikzFormatDate(msg.created_at)}
                            </span>
                        </div>
                    `;
                }).join('');

                if (wasScrolledToBottom) {
                    messagesMount.scrollTop = messagesMount.scrollHeight;
                }
            } catch (err) {
                console.error("Team polling failed:", err.message);
            }
        };

        await pollTeamMessages();
        messagesMount.scrollTop = messagesMount.scrollHeight;

        commsPollInterval = setInterval(pollTeamMessages, 3000);

        if (chatForm) {
            chatForm.onsubmit = async function(e) {
                if (e) e.preventDefault();
                const text = chatMsgText.value.trim();
                if (!text) return;

                try {
                    await window.strikzDb.sendTeamMessage(text);
                    chatMsgText.value = '';
                    await pollTeamMessages();
                    messagesMount.scrollTop = messagesMount.scrollHeight;
                } catch (err) {
                    alert("Transmission failure: " + err.message);
                }
            };
        }
    }

    // GET CREATE TEAM FORM TEMPLATE
    function getCreateTeamFormHTML(user) {
        return `
            <form id="create-team-form" onsubmit="return false;">
                <div class="form-group">
                    <label>TEAM SQUAD NAME</label>
                    <input type="text" id="new-team-name" placeholder="E.g. ODISHA OVERLORDS" required style="color:#fff; text-transform: uppercase;">
                </div>
                <div class="form-group">
                    <label>TEAM LOGO (SQUAD ICON)</label>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <div id="create-team-logo-preview" style="width:60px; height:60px; border-radius:4px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                            <i class="fa-solid fa-users" style="font-size:24px; color:var(--text-dim);"></i>
                        </div>
                        <div>
                            <input type="file" id="new-team-logo-file" accept="image/*" style="display:none;">
                            <button type="button" class="cta-button btn-neon-yellow" id="btn-upload-create-team-logo" style="padding:6px 12px; font-size:11px; font-weight:800; color:#000 !important;">
                                UPLOAD IMAGE
                            </button>
                            <input type="hidden" id="new-team-logo-url" value="">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>TEAM DESCRIPTION / BIO</label>
                    <textarea id="new-team-desc" rows="3" placeholder="Describe your team history, achievements, etc..." required style="width: 100%; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 10px; border-radius: 4px; color:#fff; font-size:13px; font-family:inherit; line-height:1.4; resize:vertical;"></textarea>
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
                            <label>In-Game Name (IGN)</label>
                            <input type="text" class="team-member-ign" placeholder="E.g. IGL_Viper" required style="color:#fff;">
                        </div>
                    </div>
                    <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Free Fire Max UID</label>
                            <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" required style="color:#fff;">
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Combat Roster Role</label>
                            <select class="team-member-role" style="color:#fff;">
                                <option value="IGL">IGL</option>
                                <option value="Rusher">Rusher</option>
                                <option value="Sniper">Sniper</option>
                                <option value="Support">Support</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- core players 2, 3, 4 -->
                ${[2, 3, 4].map(num => `
                    <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                        <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">CORE MEMBER #${num} (Invitation via UID)</span>
                        <div class="form-row" style="margin-bottom:0; position: relative;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Strikz Gamer UID</label>
                                <input type="text" class="team-member-strikz-uid search-gamer-input" placeholder="e.g. gamer_123" style="color:#fff; text-transform: lowercase;">
                                <div class="autocomplete-dropdown glass-panel" style="display:none; position:absolute; z-index:100; left:0; right:0; top:64px; max-height:150px; overflow-y:auto; background:#0e0e12; border:1px solid var(--glass-border);"></div>
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
                                <label>In-Game Name (IGN)</label>
                                <input type="text" class="team-member-ign" placeholder="Player's IGN" style="color:#fff;">
                            </div>
                        </div>
                        <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Free Fire Max UID</label>
                                <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" style="color:#fff;">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                            </div>
                        </div>
                    </div>
                `).join('')}

                <button type="submit" class="cta-button btn-neon-orange w-full" style="padding: 15px; margin-top: 10px;">
                    CREATE SQUAD TERMINAL
                </button>
            </form>
        `;
    }

    // BIND CREATE TEAM FORM SUBMISSION
    function bindCreateTeamForm(user, container) {
        const form = document.getElementById('create-team-form');
        if (!form) return;

        // Bind Logo Upload trigger inside form
        const logoFileInput = document.getElementById('new-team-logo-file');
        const uploadLogoBtn = document.getElementById('btn-upload-create-team-logo');
        const logoPreview = document.getElementById('create-team-logo-preview');
        const logoUrlInput = document.getElementById('new-team-logo-url');

        if (uploadLogoBtn && logoFileInput) {
            uploadLogoBtn.onclick = () => logoFileInput.click();
            logoFileInput.onchange = async function(e) {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const res = await window.strikzDb.uploadFile(file);
                        logoUrlInput.value = res.imageUrl;
                        logoPreview.innerHTML = `<img src="${res.imageUrl}" style="width:100%; height:100%; object-fit:cover;">`;
                        alert("Team logo uploaded successfully!");
                    } catch (err) {
                        alert("Logo upload failed: " + err.message);
                    }
                }
            };
        }

        // Bind Autocomplete Dropdown Search
        bindAutocompleteSearchInputs(form);

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const teamName = document.getElementById('new-team-name').value.trim().toUpperCase();
            const teamDesc = document.getElementById('new-team-desc').value.trim();
            const teamLogo = logoUrlInput ? logoUrlInput.value.trim() : '';

            const stUids = document.querySelectorAll('.team-member-strikz-uid');
            const memberReals = document.querySelectorAll('.team-member-real');
            const memberUids = document.querySelectorAll('.team-member-uid');
            const memberRoles = document.querySelectorAll('.team-member-role');
            const memberIgns = document.querySelectorAll('.team-member-ign');

            const members = [];
            
            // Captain details
            members.push({
                user_uid: user.uid,
                name: user.username,
                realName: memberReals[0].value.trim(),
                gameUid: memberUids[0].value.trim(),
                ign: memberIgns[0].value.trim(),
                role: memberRoles[0].value
            });

            // Invited members
            for (let i = 1; i <= 3; i++) {
                const uidVal = stUids[i].value.trim().toLowerCase();
                if (uidVal) {
                    const realVal = memberReals[i].value.trim();
                    const ffUidVal = memberUids[i].value.trim();
                    const roleVal = memberRoles[i].value;
                    const ignVal = memberIgns[i].value.trim();

                    if (!realVal || !ffUidVal || !ignVal) {
                        alert(`Please fill in all details (Real Name, IGN and Free Fire UID) for Member #${i+1}.`);
                        return;
                    }

                    members.push({
                        user_uid: uidVal,
                        realName: realVal,
                        gameUid: ffUidVal,
                        ign: ignVal,
                        role: roleVal
                    });
                }
            }

            try {
                await window.strikzDb.createMyTeam({
                    name: teamName,
                    description: teamDesc,
                    logo: teamLogo || undefined,
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

    async function renderFriendsPage(container) {
        if (commsPollInterval) { clearInterval(commsPollInterval); commsPollInterval = null; }

        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 80px; margin-bottom: 80px; max-width: 600px; text-align: center;">
                    <div style="padding: 20px 10px;">
                        <i class="fa-solid fa-user-group" style="font-size: 58px; color: var(--neon-cyan); filter: drop-shadow(0 0 12px var(--neon-cyan-glow)); margin-bottom: 20px;"></i>
                        <h2 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 10px; letter-spacing: 0.05em;">SECURE FRIENDS ACCESS</h2>
                        <p style="color: var(--text-silver); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            You must log in to your gamer profile to add friends, accept requests, and send direct messages.
                        </p>
                        <button class="cta-button btn-neon-cyan w-full" id="btn-friends-login-trigger" style="padding: 15px;">
                            <i class="fa-solid fa-right-to-bracket"></i> LOGIN TO ARENA
                        </button>
                    </div>
                </section>
            `;
            if (btn) {
                btn.onclick = function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (window.strikzOpenLoginModal) {
                        window.strikzOpenLoginModal();
                    } else {
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) loginModal.classList.add('active');
                    }
                };
            }
            return;
        }

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 900px;">
                <div class="section-header" style="margin-bottom: 30px;">
                    <span class="section-subtitle">COMMS NETWORK</span>
                    <h2 class="section-title">FRIENDS & <span>DIRECT MESSAGES</span></h2>
                    <div class="section-divider"></div>
                </div>
                <div id="friends-page-mount"></div>
            </section>
        `;
        const mount = document.getElementById('friends-page-mount');
        await renderFriendsTab(mount, container);

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    async function renderInboxPage(container) {
        if (commsPollInterval) { clearInterval(commsPollInterval); commsPollInterval = null; }

        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 80px; margin-bottom: 80px; max-width: 600px; text-align: center;">
                    <div style="padding: 20px 10px;">
                        <i class="fa-solid fa-envelope" style="font-size: 58px; color: var(--neon-orange); filter: drop-shadow(0 0 12px var(--neon-orange-glow)); margin-bottom: 20px;"></i>
                        <h2 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 10px; letter-spacing: 0.05em;">SECURE INBOX ACCESS</h2>
                        <p style="color: var(--text-silver); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            You must log in to your gamer profile to view team invites and tournament join requests.
                        </p>
                        <button class="cta-button btn-neon-orange w-full" id="btn-inbox-login-trigger" style="padding: 15px;">
                            <i class="fa-solid fa-right-to-bracket"></i> LOGIN TO ARENA
                        </button>
                    </div>
                </section>
            `;
            if (btn) {
                btn.onclick = function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (window.strikzOpenLoginModal) {
                        window.strikzOpenLoginModal();
                    } else {
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) loginModal.classList.add('active');
                    }
                };
            }
            return;
        }

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 900px;">
                <div class="section-header" style="margin-bottom: 30px;">
                    <span class="section-subtitle">COMMUNICATION CENTER</span>
                    <h2 class="section-title">ARENA <span>INBOX</span></h2>
                    <div class="section-divider"></div>
                </div>
                <div id="inbox-page-mount"></div>
            </section>
        `;
        const mount = document.getElementById('inbox-page-mount');
        try {
            const res = await window.strikzDb.getMyTeamInbox();
            renderInboxTab(mount, res.inbox || [], container);
        } catch (err) {
            mount.innerHTML = `
                <div class="text-center" style="padding:40px;">
                    <p style="color:var(--neon-orange);">${err.message}</p>
                </div>
            `;
        }

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    function bindAutocompleteSearchInputs(formElement) {
        const searchInputs = formElement.querySelectorAll('.search-gamer-input');
        searchInputs.forEach(input => {
            const dropdown = input.parentNode.querySelector('.autocomplete-dropdown');
            if (dropdown) {
                input.oninput = async function() {
                    const query = input.value.trim().toLowerCase();
                    if (!query || query.length < 2) {
                        dropdown.style.display = 'none';
                        dropdown.innerHTML = '';
                        return;
                    }
                    try {
                        const response = await fetch(`/api/v1/auth/users/search?query=${encodeURIComponent(query)}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('strikz_jwt_token') || sessionStorage.getItem('strikz_jwt_token')}`
                            }
                        });
                        const resData = await response.json();
                        const users = resData.users || [];
                        if (users.length === 0) {
                            dropdown.innerHTML = `<div style="padding:8px 12px; color:var(--text-dim); font-size:11px;">No gamers found</div>`;
                        } else {
                            dropdown.innerHTML = users.map(u => `
                                <div class="autocomplete-item" data-uid="${u.uid}" data-username="${u.username}" style="display:flex; gap:8px; align-items:center; padding:6px 10px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.02); transition:background 0.2s;">
                                    <img src="${u.avatar || 'assets/default-avatar.png'}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                                    <div>
                                        <div style="font-size:11px; color:#fff; font-weight:700;">${u.username}</div>
                                        <div style="font-size:9px; color:var(--neon-cyan);">${u.uid}</div>
                                    </div>
                                </div>
                            `).join('');
                            
                            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                                item.onclick = function() {
                                    input.value = this.dataset.uid;
                                    dropdown.style.display = 'none';
                                    
                                    const card = input.closest('div[style*="background"]');
                                    if (card) {
                                        const realInput = card.querySelector('.team-member-real');
                                        if (realInput) realInput.value = this.dataset.username;
                                    }
                                };
                            });
                        }
                        dropdown.style.display = 'block';
                    } catch (err) {
                        console.error(err);
                    }
                };

                document.addEventListener('click', function(e) {
                    if (e.target !== input && e.target !== dropdown && !dropdown.contains(e.target)) {
                        dropdown.style.display = 'none';
                    }
                });
            }
        });
    }

    function renderEditTeamForm(user, team, container) {
        const capMember = (team.members || []).find(m => m.user_uid === user.uid) || (team.members || [])[0];
        
        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 800px;">
                <div class="section-header" style="margin-bottom: 30px;">
                    <span class="section-subtitle">UPDATE SQUAD DETAILS</span>
                    <h2 class="section-title">EDIT <span>SQUAD</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="glass-panel" style="padding: 40px; border-color: var(--neon-orange-border);">
                    <form id="edit-team-form" onsubmit="return false;">
                        
                        <div class="form-group">
                            <label>TEAM LOGO</label>
                            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 15px;">
                                <div id="edit-team-logo-preview" style="width: 80px; height: 80px; border: 1.5px solid var(--glass-border); border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: rgba(0,0,0,0.5);">
                                    <img src="${team.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(team.name)}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                                <div>
                                    <button type="button" class="cta-button btn-neon-yellow" id="btn-upload-edit-team-logo" style="padding: 8px 16px; font-size:11px; font-weight:800; color:#000 !important;">
                                        UPLOAD NEW LOGO
                                    </button>
                                    <input type="file" id="edit-team-logo-file" accept="image/*" style="display: none;">
                                    <input type="hidden" id="edit-team-logo-url" value="${team.logo || ''}">
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Esports Squad Name</label>
                                <input type="text" id="edit-team-name" value="${team.name}" required style="color:#fff;">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Squad Bio / Description</label>
                            <textarea id="edit-team-desc" rows="3" required style="color:#fff; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--glass-border); border-radius: 4px; padding: 10px; width: 100%; resize: vertical;">${team.description}</textarea>
                        </div>

                        <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin: 30px 0 15px 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">ROSTER LINE-UP (4 CORE MEMBERS)</h4>
                        
                        <!-- Captain (Member 1) -->
                        <div style="background: rgba(255,255,255,0.01); border: 1.5px solid var(--neon-orange); padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                            <span class="font-orbitron" style="font-size: 11px; color: var(--neon-orange); display: block; margin-bottom: 10px;">CORE MEMBER #1 (Captain / You)</span>
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
                                    <input type="text" class="team-member-real" placeholder="Your Full Name" value="${capMember ? (capMember.real_name || capMember.realName || '') : ''}" required style="color:#fff;">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>In-Game Name (IGN)</label>
                                    <input type="text" class="team-member-ign" placeholder="E.g. IGL_Viper" value="${capMember ? (capMember.ign || '') : ''}" required style="color:#fff;">
                                </div>
                            </div>
                            <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Free Fire Max UID</label>
                                    <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" value="${capMember ? (capMember.game_uid || capMember.gameUid || '') : ''}" required style="color:#fff;">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Combat Roster Role</label>
                                    <select class="team-member-role" style="color:#fff;">
                                        <option value="IGL" ${capMember && capMember.role === 'IGL' ? 'selected' : ''}>IGL</option>
                                        <option value="Rusher" ${capMember && capMember.role === 'Rusher' ? 'selected' : ''}>Rusher</option>
                                        <option value="Sniper" ${capMember && capMember.role === 'Sniper' ? 'selected' : ''}>Sniper</option>
                                        <option value="Support" ${capMember && capMember.role === 'Support' ? 'selected' : ''}>Support</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Core players 2, 3, 4 -->
                        ${[2, 3, 4].map(num => {
                            const mIdx = num - 1;
                            const m = (team.members || [])[mIdx];
                            return `
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                                <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">CORE MEMBER #${num} (Invitation via UID)</span>
                                <div class="form-row" style="margin-bottom:0; position: relative;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Strikz Gamer UID</label>
                                        <input type="text" class="team-member-strikz-uid search-gamer-input" placeholder="e.g. gamer_123" value="${m ? m.user_uid : ''}" style="color:#fff; text-transform: lowercase;">
                                        <div class="autocomplete-dropdown glass-panel" style="display:none; position:absolute; z-index:100; left:0; right:0; top:64px; max-height:150px; overflow-y:auto; background:#0e0e12; border:1px solid var(--glass-border);"></div>
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Combat Roster Role</label>
                                        <select class="team-member-role" style="color:#fff;">
                                            <option value="Rusher" ${m && m.role === 'Rusher' ? 'selected' : ''}>Rusher</option>
                                            <option value="Sniper" ${m && m.role === 'Sniper' ? 'selected' : ''}>Sniper</option>
                                            <option value="Support" ${m && m.role === 'Support' ? 'selected' : ''}>Support</option>
                                            <option value="IGL" ${m && m.role === 'IGL' ? 'selected' : ''}>IGL</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Real Name</label>
                                        <input type="text" class="team-member-real" placeholder="Player's Real Name" value="${m ? (m.real_name || m.realName || '') : ''}" style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>In-Game Name (IGN)</label>
                                        <input type="text" class="team-member-ign" placeholder="Player's IGN" value="${m ? (m.ign || '') : ''}" style="color:#fff;">
                                    </div>
                                </div>
                                <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Free Fire Max UID</label>
                                        <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" value="${m ? (m.game_uid || m.gameUid || '') : ''}" style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}

                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="cta-button btn-neon-orange" style="flex: 1; padding: 15px;">
                                UPDATE SQUAD DETAILS
                            </button>
                            <button type="button" id="btn-cancel-edit-team" class="cta-button" style="padding: 15px 30px; border: 1px solid var(--glass-border); color: #fff;">
                                CANCEL
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        `;

        // Bind cancel button
        const cancelBtn = document.getElementById('btn-cancel-edit-team');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                renderMyTeam(container);
            };
        }

        // Bind Logo Upload trigger inside edit form
        const logoFileInput = document.getElementById('edit-team-logo-file');
        const uploadLogoBtn = document.getElementById('btn-upload-edit-team-logo');
        const logoPreview = document.getElementById('edit-team-logo-preview');
        const logoUrlInput = document.getElementById('edit-team-logo-url');

        if (uploadLogoBtn && logoFileInput) {
            uploadLogoBtn.onclick = () => logoFileInput.click();
            logoFileInput.onchange = async function(e) {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const res = await window.strikzDb.uploadFile(file);
                        logoUrlInput.value = res.imageUrl;
                        logoPreview.innerHTML = `<img src="${res.imageUrl}" style="width:100%; height:100%; object-fit:cover;">`;
                        alert("Team logo uploaded successfully!");
                    } catch (err) {
                        alert("Failed to upload team logo: " + err.message);
                    }
                }
            };
        }

        bindAutocompleteSearchInputs(form);

        // Bind form submit
        const form = document.getElementById('edit-team-form');
        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const teamName = document.getElementById('edit-team-name').value.trim().toUpperCase();
            const teamDesc = document.getElementById('edit-team-desc').value.trim();
            const teamLogo = logoUrlInput ? logoUrlInput.value.trim() : '';

            const stUids = form.querySelectorAll('.team-member-strikz-uid');
            const memberReals = form.querySelectorAll('.team-member-real');
            const memberUids = form.querySelectorAll('.team-member-uid');
            const memberRoles = form.querySelectorAll('.team-member-role');
            const memberIgns = form.querySelectorAll('.team-member-ign');

            const members = [];
            
            // Captain details
            members.push({
                user_uid: user.uid,
                name: user.username,
                realName: memberReals[0].value.trim(),
                gameUid: memberUids[0].value.trim(),
                ign: memberIgns[0].value.trim(),
                role: memberRoles[0].value
            });

            // Invited members
            for (let i = 1; i <= 3; i++) {
                const uidVal = stUids[i].value.trim().toLowerCase();
                if (uidVal) {
                    const realVal = memberReals[i].value.trim();
                    const ffUidVal = memberUids[i].value.trim();
                    const roleVal = memberRoles[i].value;
                    const ignVal = memberIgns[i].value.trim();

                    if (!realVal || !ffUidVal || !ignVal) {
                        alert(`Please fill in all details (Real Name, IGN and Free Fire UID) for Member #${i+1}.`);
                        return;
                    }

                    members.push({
                        user_uid: uidVal,
                        realName: realVal,
                        gameUid: ffUidVal,
                        role: roleVal,
                        ign: ignVal
                    });
                }
            }

            try {
                await window.strikzDb.updateMyTeam({
                    name: teamName,
                    description: teamDesc,
                    logo: teamLogo,
                    members
                });
                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                alert("Squad details updated successfully!");
                renderMyTeam(container);
            } catch (err) {
                alert("Failed to update squad: " + err.message);
            }
        };

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
    }

    if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
    if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
}

// Attach to global window
window.renderMyTeam = renderMyTeam;
    window.renderFriendsPage = renderFriendsPage;
    window.renderInboxPage = renderInboxPage;
    window.renderInboxTab = renderInboxTab;
})();
