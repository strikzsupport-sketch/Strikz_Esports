/* ==========================================================================
   STRIKZ ESPORTS - DYNAMIC TOURNAMENT REGISTRATION SYSTEM
   ========================================================================== */

(function() {
    function renderRegistration(container) {
        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            container.innerHTML = `
                <section class="container bg-section-black" style="padding-top: 80px; margin-bottom: 80px; max-width: 600px;">
                    <div class="glass-panel text-center" style="padding: 50px 30px; border-color: var(--neon-yellow-border);">
                        <i class="fa-solid fa-lock" style="font-size: 58px; color: var(--neon-orange); filter: drop-shadow(0 0 12px var(--neon-orange-glow)); margin-bottom: 20px;"></i>
                        <h2 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 10px; letter-spacing: 0.05em;">ARENA ENTRY SECURED</h2>
                        <p style="color: var(--text-silver); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            You must be an authorized user to register squads or enter solo players in active Garena championships. Please log in to your gamer profile to unlock the application terminal.
                        </p>
                        <button class="cta-button btn-neon-orange w-full" id="btn-lock-login-trigger" style="padding: 15px;">
                            <i class="fa-solid fa-right-to-bracket"></i> UNLOCK REGISTRATION PORTAL
                        </button>
                    </div>
                </section>
            `;
            
            const btn = document.getElementById('btn-lock-login-trigger');
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

        const db = window.strikzDb.get();
        const openTourneys = db.tournaments.filter(t => t.status === 'Open');

        container.innerHTML = `
            <section class="container bg-section-black" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">JOIN THE SHOWDOWN</span>
                    <h2 class="section-title">TOURNAMENT <span>REGISTRATION</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Registration Card Wrapper -->
                <div class="glass-panel form-card" style="border-color: var(--neon-yellow-border);">
                    <div style="margin-bottom: 20px;">
                        <div class="form-group">
                            <label for="reg-tournament-select" style="font-size: 12px; font-weight:800; color:var(--neon-yellow);">1. SELECT FREE FIRE MAX TOURNAMENT</label>
                            <select id="reg-tournament-select" required style="margin-top: 8px;">
                                ${openTourneys.length === 0 
                                    ? `<option value="">No Active Tournaments Open</option>`
                                    : openTourneys.map(t => `<option value="${t.id}">${t.name} (${t.category} Mode)</option>`).join('')
                                }
                            </select>
                        </div>
                    </div>

                    <!-- Tournament Rule Book Block -->
                    <div class="rule-book-box" style="margin-bottom: 25px; padding: 15px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 4px;">
                        <h5 class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); margin-bottom: 6px; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-book-open"></i> TOURNAMENT RULE BOOK & INSTRUCTIONS
                        </h5>
                        <div id="rule-book-content" style="font-size: 12px; color: var(--text-silver); line-height: 1.5; max-height: 150px; overflow-y: auto; white-space: pre-line; padding-right:5px;">
                            Select a tournament to view its official rule book.
                        </div>
                    </div>

                    <!-- Dynamic Form Mount -->
                    <div id="dynamic-form-mount">
                        <!-- Forms loaded dynamically depending on mode -->
                    </div>
                </div>

                <!-- Ticket Status Tracker Widget -->
                <div class="status-tracker-box" style="border-color: rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); padding: 30px; border-radius: 8px; border: 1px solid var(--glass-border); margin-top: 40px;">
                    <h3 class="font-orbitron" style="font-size: 16px; color: var(--neon-yellow);"><i class="fa-solid fa-ticket-simple"></i> REGISTRATION TICKET TRACKER</h3>
                    <p style="font-size: 13px; color: var(--text-dim); margin-top: 6px;">Enter your REG-XXXXX ticket ID to track verification status and confirmations.</p>
                    
                    <div class="status-tracker-input-row" style="display:flex; gap:10px; margin-top:15px; max-width:500px;">
                        <input type="text" id="tracker-ticket-id" placeholder="E.g. REG-98124" autocomplete="off" style="color: #fff; background: rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding: 10px; border-radius:4px; flex-grow:1;">
                        <button class="cta-button btn-neon-orange" id="tracker-track-btn" style="padding: 10px 24px; font-weight:800; font-family:var(--font-header);">TRACK</button>
                    </div>

                    <div id="tracker-result-mount" style="margin-top:20px;"></div>
                </div>
            </section>
        `;

        const selectTourney = document.getElementById('reg-tournament-select');
        const ruleContent = document.getElementById('rule-book-content');
        const formMount = document.getElementById('dynamic-form-mount');

        if (openTourneys.length === 0) return;

        // Dynamic change handler
        selectTourney.addEventListener('change', handleTournamentChange);
        // Load user's team in background to auto-fill
        let userTeam = null;
        if (window.strikzAuth && window.strikzAuth.isLoggedIn()) {
            window.strikzDb.getMyTeam().then(t => {
                userTeam = t;
                handleTournamentChange(); // trigger initial rendering with autofill option loaded
            }).catch(err => {
                console.error("Failed to load user team:", err);
                handleTournamentChange();
            });
        } else {
            handleTournamentChange();
        }

        function handleTournamentChange() {
            const tourneyId = selectTourney.value;
            const tourney = openTourneys.find(t => t.id === tourneyId);
            if (!tourney) return;

            // Load Rule Book
            ruleContent.textContent = tourney.ruleBook || tourney.rules || "No rule book specified.";

            // Render Dynamic Form
            renderDynamicForm(tourney);
        }

        function renderDynamicForm(tourney) {
            const user = window.strikzAuth.getUser();
            const defaultName = user ? user.username : '';
            const defaultEmail = user ? user.email : '';

            if (tourney.category !== 'Solo' && !userTeam) {
                formMount.innerHTML = `
                    <div class="glass-panel text-center" style="padding: 40px; border-color: var(--neon-orange-border); background:rgba(255, 94, 0, 0.02); display:flex; flex-direction:column; align-items:center; gap:15px;">
                        <i class="fa-solid fa-users-slash" style="font-size: 58px; color: var(--neon-orange); filter: drop-shadow(0 0 12px var(--neon-orange-glow));"></i>
                        <h4 class="font-orbitron" style="font-size: 16px; color:#fff;">NO COMPETITIVE SQUAD DETECTED</h4>
                        <p style="font-size: 13.5px; color: var(--text-silver); max-width: 500px; line-height: 1.6; margin: 0 auto;">
                            It is mandatory to create your Esports Team roster in the <strong>My Team</strong> panel first before you can register for team or duo championships.
                        </p>
                        <a href="#/myteam" class="cta-button btn-neon-orange" style="margin-top: 15px; padding: 10px 24px;">
                            <i class="fa-solid fa-users-gear"></i> INITIALIZE SQUAD NOW
                        </a>
                    </div>
                `;
                return;
            }

            if (tourney.category === 'Solo') {
                if (tourney.soloRegistrationEnabled === false) {
                    formMount.innerHTML = `
                        <div class="glass-panel text-center" style="padding: 40px; border-color: var(--neon-orange-border); background:rgba(255, 230, 0, 0.02);">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size: 44px; color: var(--neon-orange); margin-bottom: 15px;"></i>
                            <h4 class="font-orbitron" style="font-size: 16px; color:#fff;">SOLO REGISTRATION LOCKED</h4>
                            <p style="font-size: 13px; color: var(--text-silver); max-width: 420px; margin: 6px auto 0 auto; line-height: 1.5;">
                                Solo registrations for this tournament are currently disabled by the Admin panel. Captains must register complete Squad line-ups instead.
                            </p>
                        </div>
                    `;
                    return;
                }

                formMount.innerHTML = `
                    <form id="reg-solo-form" onsubmit="return false;">
                        <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin-bottom: 20px; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">SOLO COMPETITOR DETAIL</h4>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Gamer Tag (Website Nickname)</label>
                                <input type="text" id="reg-solo-tag" placeholder="Nickname" value="${defaultName}" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label>Real Name</label>
                                <input type="text" id="reg-solo-real" placeholder="Full Name" value="${defaultName}" required style="color:#fff;">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Free Fire Max UID (Digital ID)</label>
                                <input type="text" id="reg-solo-uid" placeholder="UID-9912093" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label>Combat Roster Role</label>
                                <select id="reg-solo-role">
                                    <option value="Rusher">Rusher</option>
                                    <option value="Sniper">Sniper</option>
                                    <option value="IGL">In-Game Leader (IGL)</option>
                                    <option value="Support">Support</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" id="reg-solo-email" placeholder="E.g. slayer@gmail.com" value="${defaultEmail}" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label>Phone Number (WhatsApp)</label>
                                <input type="text" id="reg-solo-phone" placeholder="E.g. +91 91234 56789" required style="color:#fff;">
                            </div>
                        </div>

                        <button type="submit" class="cta-button btn-neon-orange w-full" style="margin-top: 15px; padding:12px;">
                            SUBMIT SOLO ENTRY
                        </button>
                    </form>
                `;

                const form = document.getElementById('reg-solo-form');
                form.onsubmit = async function(e) {
                    if (e) e.preventDefault();
                    const tag = document.getElementById('reg-solo-tag').value.trim();
                    const real = document.getElementById('reg-solo-real').value.trim();
                    const uid = document.getElementById('reg-solo-uid').value.trim();
                    const role = document.getElementById('reg-solo-role').value;
                    const email = document.getElementById('reg-solo-email').value.trim();
                    const phone = document.getElementById('reg-solo-phone').value.trim();

                    try {
                        const reg = await window.strikzDb.addRegistration({
                            type: 'Solo',
                            tournamentId: tourney.id,
                            playerName: tag,
                            gameUid: uid,
                            playerEmail: email,
                            playerPhone: phone,
                            role,
                            realName: real
                        });

                        showSuccessTicket(reg);
                    } catch (err) {
                        alert("Solo registration filing failed: " + err.message);
                    }
                };
            } 
            else if (tourney.category === 'Duo') {
                formMount.innerHTML = `
                    <form id="reg-duo-form" onsubmit="return false;">
                        
                        ${userTeam ? `
                            <div style="background: rgba(255, 230, 0, 0.05); border: 1px solid var(--neon-yellow-border); border-radius: 4px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap:wrap; gap:10px;">
                                <span style="font-size: 13px; color:#fff;"><i class="fa-solid fa-users-gear"></i> Quick registration: Autofill roster with your saved squad <strong>${userTeam.name}</strong>?</span>
                                <button type="button" class="cta-button btn-neon-yellow" id="btn-autofill-duo" style="padding: 6px 14px; font-size:11px; font-weight:800; color:#000 !important;">AUTO-FILL ROSTER</button>
                            </div>
                        ` : ''}

                        <div class="form-group">
                            <label>DUO TEAM / SQUAD NAME</label>
                            <input type="text" id="reg-duo-team" placeholder="E.g. Double Trouble" required style="color:#fff;">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Captain Email</label>
                                <input type="email" id="reg-duo-email" value="${defaultEmail}" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label>Captain Phone (WhatsApp)</label>
                                <input type="text" id="reg-duo-phone" required style="color:#fff;">
                            </div>
                        </div>

                        <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin: 25px 0 15px 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">ROSTER LINE-UP (2-MAN)</h4>
                        
                        ${[1, 2].map(num => `
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                                <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">DUO PLAYER #${num} ${num === 1 ? '(Captain)' : ''}</span>
                                <div class="form-row" style="margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Gamer Tag</label>
                                        <input type="text" class="duo-member-tag" placeholder="Tag" value="${num === 1 ? defaultName : ''}" required style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Real Name</label>
                                        <input type="text" class="duo-member-real" placeholder="Full Name" value="${num === 1 ? defaultName : ''}" required style="color:#fff;">
                                    </div>
                                </div>
                                <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Free Fire Max UID</label>
                                        <input type="text" class="duo-member-uid" placeholder="UID-XXXXXXX" required style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Role</label>
                                        <select class="duo-member-role">
                                            <option value="IGL">Cap / IGL</option>
                                            <option value="Rusher">Rusher</option>
                                            <option value="Sniper">Sniper</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        <button type="submit" class="cta-button btn-neon-orange w-full" style="margin-top: 15px; padding:12px;">
                            SUBMIT DUO ENTRY
                        </button>
                    </form>
                `;

                // Autofill logic
                const autofillDuoBtn = document.getElementById('btn-autofill-duo');
                if (autofillDuoBtn) {
                    autofillDuoBtn.onclick = function() {
                        document.getElementById('reg-duo-team').value = userTeam.name;
                        
                        const duoTags = document.querySelectorAll('.duo-member-tag');
                        const duoReals = document.querySelectorAll('.duo-member-real');
                        const duoUids = document.querySelectorAll('.duo-member-uid');
                        const duoRoles = document.querySelectorAll('.duo-member-role');

                        userTeam.members.forEach((m, idx) => {
                            if (idx < 2) {
                                duoTags[idx].value = m.name;
                                duoReals[idx].value = m.real_name || m.name;
                                duoUids[idx].value = m.game_uid;
                                duoRoles[idx].value = m.role;
                            }
                        });
                        if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    };
                }

                const form = document.getElementById('reg-duo-form');
                form.onsubmit = async function(e) {
                    if (e) e.preventDefault();
                    const teamName = document.getElementById('reg-duo-team').value.trim();
                    const email = document.getElementById('reg-duo-email').value.trim();
                    const phone = document.getElementById('reg-duo-phone').value.trim();

                    const duoTags = document.querySelectorAll('.duo-member-tag');
                    const duoReals = document.querySelectorAll('.duo-member-real');
                    const duoUids = document.querySelectorAll('.duo-member-uid');
                    const duoRoles = document.querySelectorAll('.duo-member-role');

                    const players = [];
                    for(let i = 0; i < 2; i++) {
                        players.push({
                            name: duoTags[i].value.trim(),
                            realName: duoReals[i].value.trim(),
                            gameUid: duoUids[i].value.trim(),
                            role: duoRoles[i].value,
                            confirmed: duoTags[i].value.toLowerCase() === user.username.toLowerCase()
                        });
                    }

                    try {
                        const reg = await window.strikzDb.addRegistration({
                            type: 'Duo',
                            tournamentId: tourney.id,
                            teamName,
                            captainName: players[0].name,
                            captainEmail: email,
                            captainPhone: phone,
                            players
                        });

                        showSuccessTicket(reg);
                    } catch (err) {
                        alert("Duo registration filing failed: " + err.message);
                    }
                };
            } 
            else {
                // SQUAD FORM (4 core + 5th optional sub)
                formMount.innerHTML = `
                    <form id="reg-squad-form" onsubmit="return false;">
                        
                        ${userTeam ? `
                            <div style="background: rgba(255, 230, 0, 0.05); border: 1px solid var(--neon-yellow-border); border-radius: 4px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap:wrap; gap:10px;">
                                <span style="font-size: 13px; color:#fff;"><i class="fa-solid fa-users-gear"></i> Quick registration: Autofill roster with your saved squad <strong>${userTeam.name}</strong>?</span>
                                <button type="button" class="cta-button btn-neon-yellow" id="btn-autofill-team" style="padding: 6px 14px; font-size:11px; font-weight:800; color:#000 !important;">AUTO-FILL ROSTER</button>
                            </div>
                        ` : ''}

                        <div class="form-group">
                            <label>SQUAD TEAM NAME</label>
                            <input type="text" id="reg-squad-team" placeholder="E.g. Viper Esports" required style="color:#fff;">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Captain Email</label>
                                <input type="email" id="reg-squad-email" value="${defaultEmail}" required style="color:#fff;">
                            </div>
                            <div class="form-group">
                                <label>Captain Phone (WhatsApp)</label>
                                <input type="text" id="reg-squad-phone" required style="color:#fff;">
                            </div>
                        </div>

                        <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin: 25px 0 15px 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">ROSTER LINE-UP (4 CORE MEMBERS)</h4>
                        
                        ${[1, 2, 3, 4].map(num => `
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                                <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">MEMBER #${num} ${num === 1 ? '(Captain)' : ''}</span>
                                <div class="form-row" style="margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Gamer Tag</label>
                                        <input type="text" class="squad-member-tag" placeholder="Tag" value="${num === 1 ? defaultName : ''}" required style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Real Name</label>
                                        <input type="text" class="squad-member-real" placeholder="Full Name" value="${num === 1 ? defaultName : ''}" required style="color:#fff;">
                                    </div>
                                </div>
                                <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Free Fire Max UID</label>
                                        <input type="text" class="squad-member-uid" placeholder="UID-XXXXXXX" required style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Role</label>
                                        <select class="squad-member-role">
                                            <option value="IGL" ${num === 1 ? 'selected' : ''}>IGL</option>
                                            <option value="Rusher" ${num === 2 ? 'selected' : ''}>Rusher</option>
                                            <option value="Sniper" ${num === 3 ? 'selected' : ''}>Sniper</option>
                                            <option value="Support" ${num === 4 ? 'selected' : ''}>Support</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        <!-- Optional 5th sub -->
                        <div style="background: rgba(255,255,255,0.01); border: 1px dashed var(--neon-orange-border); padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                            <span class="font-orbitron" style="font-size: 11px; color: var(--neon-orange); display: block; margin-bottom: 10px;">OPTIONAL SUB MEMBER #5</span>
                            <div class="form-row" style="margin-bottom:0;">
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Gamer Tag</label>
                                    <input type="text" class="squad-member-tag-opt" placeholder="Optional sub tag" style="color:#fff;">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Real Name</label>
                                    <input type="text" class="squad-member-real-opt" placeholder="Optional real name" style="color:#fff;">
                                </div>
                            </div>
                            <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Free Fire Max UID</label>
                                    <input type="text" class="squad-member-uid-opt" placeholder="UID-XXXXXXX" style="color:#fff;">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Role</label>
                                    <select class="squad-member-role-opt">
                                        <option value="Substitute">Substitute Rusher</option>
                                        <option value="Substitute Sniper">Substitute Sniper</option>
                                        <option value="Coach">Team Coach</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="cta-button btn-neon-orange w-full" style="margin-top: 15px; padding:12px;">
                            SUBMIT SQUAD REGISTRATION
                        </button>
                    </form>
                `;

                // Autofill logic
                const autofillBtn = document.getElementById('btn-autofill-team');
                if (autofillBtn) {
                    autofillBtn.onclick = function() {
                        document.getElementById('reg-squad-team').value = userTeam.name;
                        
                        const squadTags = document.querySelectorAll('.squad-member-tag');
                        const squadReals = document.querySelectorAll('.squad-member-real');
                        const squadUids = document.querySelectorAll('.squad-member-uid');
                        const squadRoles = document.querySelectorAll('.squad-member-role');

                        userTeam.members.forEach((m, idx) => {
                            if (idx < 4) {
                                squadTags[idx].value = m.name;
                                squadReals[idx].value = m.real_name || m.name;
                                squadUids[idx].value = m.game_uid;
                                squadRoles[idx].value = m.role;
                            } else if (idx === 4) {
                                document.querySelector('.squad-member-tag-opt').value = m.name;
                                document.querySelector('.squad-member-real-opt').value = m.real_name || m.name;
                                document.querySelector('.squad-member-uid-opt').value = m.game_uid;
                                document.querySelector('.squad-member-role-opt').value = m.role;
                            }
                        });
                        if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    };
                }

                // Submit logic
                const form = document.getElementById('reg-squad-form');
                form.onsubmit = async function(e) {
                    if (e) e.preventDefault();
                    const teamName = document.getElementById('reg-squad-team').value.trim();
                    const email = document.getElementById('reg-squad-email').value.trim();
                    const phone = document.getElementById('reg-squad-phone').value.trim();

                    const squadTags = document.querySelectorAll('.squad-member-tag');
                    const squadReals = document.querySelectorAll('.squad-member-real');
                    const squadUids = document.querySelectorAll('.squad-member-uid');
                    const squadRoles = document.querySelectorAll('.squad-member-role');

                    const players = [];
                    for(let i = 0; i < 4; i++) {
                        players.push({
                            name: squadTags[i].value.trim(),
                            realName: squadReals[i].value.trim(),
                            gameUid: squadUids[i].value.trim(),
                            role: squadRoles[i].value,
                            confirmed: squadTags[i].value.toLowerCase() === user.username.toLowerCase()
                        });
                    }

                    // Optional 5th sub
                    const subTag = document.querySelector('.squad-member-tag-opt').value.trim();
                    const subReal = document.querySelector('.squad-member-real-opt').value.trim();
                    const subUid = document.querySelector('.squad-member-uid-opt').value.trim();
                    const subRole = document.querySelector('.squad-member-role-opt').value;

                    if (subTag && subUid) {
                        players.push({
                            name: subTag,
                            realName: subReal,
                            gameUid: subUid,
                            role: subRole,
                            confirmed: subTag.toLowerCase() === user.username.toLowerCase()
                        });
                    }

                    try {
                        const reg = await window.strikzDb.addRegistration({
                            type: 'Team',
                            tournamentId: tourney.id,
                            teamName,
                            captainName: players[0].name,
                            captainEmail: email,
                            captainPhone: phone,
                            players
                        });

                        showSuccessTicket(reg);
                    } catch (err) {
                        alert("Squad registration filing failed: " + err.message);
                    }
                };
            }
        }

        // Ticket Success Renderer
        function showSuccessTicket(reg) {
            if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();

            const isSolo = reg.type === 'Solo';
            const competitorName = isSolo ? reg.playerName : reg.teamName;

            formMount.parentElement.innerHTML = `
                <div class="text-center" style="margin-bottom: 25px;">
                    <i class="fa-solid fa-circle-check" style="font-size: 58px; color: var(--neon-yellow); filter: drop-shadow(0 0 12px rgba(255, 230, 0, 0.35)); margin-bottom: 15px;"></i>
                    <h3 class="font-orbitron" style="font-size: 22px; color: #fff;">REGISTRATION FILED!</h3>
                    <p style="color: var(--text-silver); font-size: 13px; max-width: 420px; margin: 6px auto 0 auto;">
                        ${isSolo 
                            ? 'Your solo competitor ticket has been registered.' 
                            : 'Your team roster ticket has been registered. Core members must log in and confirm their join invitations!'
                        }
                    </p>
                </div>

                <div class="ticket-wrapper" style="border-color: var(--neon-yellow); background: rgba(0,0,0,0.4);">
                    <div class="ticket-header" style="border-bottom: 1px dashed var(--glass-border); padding-bottom:15px; margin-bottom:15px;">
                        <span class="ticket-title font-orbitron" style="color:var(--text-silver); font-size:10px;">STRIKZ ENTRY TICKET</span>
                        <div class="ticket-id-large font-orbitron" style="font-size:24px; color:var(--neon-yellow); font-weight:900; margin: 5px 0;">${reg.id}</div>
                        <span class="badge-status status-pending">${reg.status}</span>
                    </div>

                    <div class="ticket-details" style="display:grid; gap:12px; font-size:12px;">
                        <div>
                            <div class="ticket-detail-lbl font-orbitron" style="font-size:9px; color:var(--text-dim);">COMPETITOR</div>
                            <div class="ticket-detail-val" style="color:#fff; font-weight:700;">${competitorName}</div>
                        </div>
                        <div>
                            <div class="ticket-detail-lbl font-orbitron" style="font-size:9px; color:var(--text-dim);">REG TYPE</div>
                            <div class="ticket-detail-val" style="color:#fff;">${reg.type} Registration</div>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <div class="ticket-detail-lbl font-orbitron" style="font-size:9px; color:var(--text-dim);">TOURNAMENT</div>
                            <div class="ticket-detail-val" style="color:#fff;">${reg.tournamentName}</div>
                        </div>
                        <div>
                            <div class="ticket-detail-lbl font-orbitron" style="font-size:9px; color:var(--text-dim);">CAPTAIN / CONTACT</div>
                            <div class="ticket-detail-val" style="color:#fff;">${isSolo ? reg.playerName : reg.captainName}</div>
                        </div>
                        <div>
                            <div class="ticket-detail-lbl font-orbitron" style="font-size:9px; color:var(--text-dim);">FILED DATE</div>
                            <div class="ticket-detail-val" style="color:#fff;">${reg.submissionDate}</div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top:20px; font-size: 11px; color:var(--neon-yellow); font-weight:700; letter-spacing:0.05em; font-family:var(--font-header);">
                        STAGE ${reg.stage} STATUS: PENDING
                    </div>
                </div>

                <div class="text-center" style="margin-top: 30px;">
                    <button class="cta-button btn-neon-cyan" onclick="window.location.reload();">NEW REGISTRATION</button>
                </div>
            `;
        }

        // TICKET TRACKER LOGIC
        const trackerInput = document.getElementById('tracker-ticket-id');
        const trackerBtn = document.getElementById('tracker-track-btn');
        const resultMount = document.getElementById('tracker-result-mount');

        trackerBtn.onclick = async function() {
            const ticketId = trackerInput.value.trim().toUpperCase();
            if (!ticketId) {
                alert("Please enter a valid ticket code.");
                return;
            }

            try {
                // Perform secure network query
                const reg = await window.strikzDb.trackRegistration(ticketId);

                const statusClass = reg.status === 'Approved' ? 'status-approved' : (reg.status === 'Pending' ? 'status-pending' : 'status-rejected');
                const isSolo = reg.type === 'Solo';
                const competitorName = isSolo ? reg.playerName : reg.teamName;

                const stage = reg.stage || (reg.status === 'Approved' ? 3 : 2);
                
                resultMount.innerHTML = `
                    <div class="tracker-result-panel" style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 20px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 15px;">
                            <span class="font-orbitron" style="font-size: 13px; font-weight: 800; color: var(--neon-yellow);">${reg.id}</span>
                            <span class="badge-status ${statusClass}">${reg.status}</span>
                        </div>
                        
                        <p style="font-size: 13px; color: #fff; margin-bottom:6px;">Competitor: <strong>${competitorName}</strong> (${reg.type} Registration)</p>
                        <p style="font-size: 12px; color: var(--text-silver); margin-bottom:20px;">Tournament: ${reg.tournamentName}</p>

                        <!-- Dynamic 3-Step Verification Visual -->
                        <div class="verification-stepper" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; padding:0 10px;">
                            <!-- Line backdrop -->
                            <div style="position:absolute; top:12px; left:10px; right:10px; height:2px; background: rgba(255,255,255,0.1); z-index:1;"></div>
                            <!-- Line fill -->
                            <div style="position:absolute; top:12px; left:10px; width:${stage === 1 ? '0%' : (stage === 2 ? '50%' : '100%')}; height:2px; background: var(--neon-yellow); z-index:2; transition:width 0.4s;"></div>

                            <!-- Step 1 -->
                            <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                                <div style="width:26px; height:26px; border-radius:50%; background:${stage >= 1 ? 'var(--neon-yellow)' : '#181818'}; color:${stage >= 1 ? '#000' : 'var(--text-dim)'}; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid ${stage >= 1 ? 'var(--neon-yellow)' : '#333'};">1</div>
                                <span style="font-size:9px; color:${stage >= 1 ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-weight:700; margin-top:5px; font-family:var(--font-header);">REGISTERED</span>
                            </div>

                            <!-- Step 2 -->
                            <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                                <div style="width:26px; height:26px; border-radius:50%; background:${stage >= 2 ? 'var(--neon-yellow)' : '#181818'}; color:${stage >= 2 ? '#000' : 'var(--text-dim)'}; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid ${stage >= 2 ? 'var(--neon-yellow)' : '#333'};">2</div>
                                <span style="font-size:9px; color:${stage >= 2 ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-weight:700; margin-top:5px; font-family:var(--font-header);">ROSTER CONFIRMED</span>
                            </div>

                            <!-- Step 3 -->
                            <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                                <div style="width:26px; height:26px; border-radius:50%; background:${stage >= 3 ? 'var(--neon-yellow)' : '#181818'}; color:${stage >= 3 ? '#000' : 'var(--text-dim)'}; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid ${stage >= 3 ? 'var(--neon-yellow)' : '#333'};">3</div>
                                <span style="font-size:9px; color:${stage >= 3 ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-weight:700; margin-top:5px; font-family:var(--font-header);">APPROVED</span>
                            </div>
                        </div>

                        <!-- Confirmation detailed logs -->
                        ${(!isSolo && reg.players) ? `
                            <div style="background: rgba(0,0,0,0.2); border:1px solid var(--glass-border); padding:10px; border-radius:4px;">
                                <h6 class="font-orbitron" style="font-size:10px; color:var(--text-silver); margin-bottom:8px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;"><i class="fa-solid fa-users"></i> Member Confirmation Checklist</h6>
                                <div class="profile-form-row-2" style="gap:6px; font-size:11px;">
                                    ${reg.players.map(p => `
                                        <div style="display:flex; align-items:center; gap:5px;">
                                            <i class="${p.confirmed ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-dot'}" style="color:${p.confirmed ? 'var(--neon-green)' : 'var(--neon-orange)'}"></i>
                                            <span style="color:${p.confirmed ? '#fff' : 'var(--text-dim)'}">${p.name} (${p.role})</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            } catch (err) {
                resultMount.innerHTML = `
                    <div class="tracker-result-panel" style="border-color: var(--neon-orange); padding:20px; background:rgba(255, 230, 0, 0.02); border:1px solid var(--neon-orange-border); border-radius:4px;">
                        <p style="color: var(--neon-orange); font-weight: 700; font-size: 14px; font-family:var(--font-header);"><i class="fa-solid fa-triangle-exclamation"></i> TICKET NOT FOUND</p>
                        <p style="font-size: 12px; color: var(--text-silver); margin-top: 4px;">Double check the ID (Format: REG-XXXXX) and try again.</p>
                    </div>
                `;
            }
        };
    }

    // Attach to global window
    window.renderRegistration = renderRegistration;
})();
