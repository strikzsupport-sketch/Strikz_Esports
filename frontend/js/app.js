/* ==========================================================================
   STRIKZ ESPORTS - GLOBAL APP CONTROL & SPA ROUTER
   ========================================================================== */

(function() {
    // Google Sign-In Redirect Parameter Normalizer
    if (window.location.search.includes('#/')) {
        const search = window.location.search;
        const hashIndex = search.indexOf('#/');
        const query = search.substring(0, hashIndex);
        const hash = search.substring(hashIndex);
        const cleanQuery = query === '?' ? '' : query;
        window.history.replaceState(null, '', window.location.pathname + cleanQuery + hash);
    } else if (window.location.search.startsWith('?#')) {
        const hash = window.location.search.slice(1);
        window.history.replaceState(null, '', window.location.pathname + hash);
    }

    // Global Date Formatter
    window.strikzFormatDate = function(dateStr) {
        if (!dateStr) return '';
        if (/^\d{2}-\d{2}-\d{2}/.test(dateStr)) {
            return dateStr;
        }
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
            return dateStr;
        }
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);
        const hasTime = dateStr.toString().includes(':') || dateStr.toString().includes('T');
        if (hasTime) {
            let hours = dateObj.getHours();
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
            return `${day}-${month}-${year} ${strTime}`;
        }
        return `${day}-${month}-${year}`;
    };
    // Sound & Music settings state
    let soundEnabled = localStorage.getItem('strikz_sound_enabled') !== 'false';
    let musicEnabled = localStorage.getItem('strikz_music_enabled') !== 'false';

    // Elements
    const appContent = document.getElementById('app-content');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileClose = document.getElementById('mobile-drawer-close');
    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const bgMusic = document.getElementById('bg-music');

    // Audio Hooks
    const clickSfx = document.getElementById('sound-click');
    const hoverSfx = document.getElementById('sound-hover');
    const successSfx = document.getElementById('sound-success');

    // Setup Sound Volumes
    if (clickSfx) clickSfx.volume = 0.5;
    if (hoverSfx) hoverSfx.volume = 0.15;
    if (successSfx) successSfx.volume = 0.6;

    // Route Mapping
    const routes = {
        '/': window.renderHome,
        '/about': window.renderAbout,
        '/team': window.renderTeam,
        '/myteam': window.renderMyTeam,
        '/friends': window.renderFriendsPage,
        '/inbox': window.renderInboxPage,
        '/history': window.renderHistory,
        '/achievements': window.renderAchievements,
        '/gallery': window.renderGallery,
        '/news': window.renderNews,
        '/sponsors': window.renderSponsorsPage,
        '/contact': window.renderContact,
        '/registration': window.renderRegistration,
        '/admin': window.renderAdmin,
        '/partners': window.renderPartners,
        '/earning': window.renderEarning
    };

    // SPA Router
    function router() {
        // Clear drawer states on route change
        closeMobileDrawer();

        const rawHash = window.location.hash || '#/';
        let path = rawHash.slice(1); // strip leading #

        // Capture query parameters/id routes if any (e.g. #/news?id=...)
        let queryStr = '';
        if (path.includes('?')) {
            queryStr = path.split('?')[1];
            path = path.split('?')[0];
        }

        // Intercept Reset Password Link
        if (path.startsWith('/reset-password') || path.startsWith('reset-password')) {
            const urlParams = new URLSearchParams(queryStr);
            const token = urlParams.get('token');
            if (token) {
                window.resetPasswordToken = token;
                openLoginModal();
                showReset();
            }
            window.location.hash = '#/';
            return;
        }

        // Get matching renderer
        const renderer = routes[path] || routes['/'];

        // Get loader nodes
        const loader = document.getElementById('global-loader');
        const fill = document.getElementById('global-loader-fill');
        const percent = document.getElementById('global-loader-percent');

        if (loader && fill && percent) {
            loader.classList.remove('hidden');
            fill.style.width = '0%';
            percent.textContent = '0%';

            let progress = 0;
            // Initiate snapshot pull from Express backend
            const dbPromise = window.strikzDb.init();

            const tick = async () => {
                let increment = 0;
                if (progress < 60) {
                    increment = Math.floor(Math.random() * 8) + 6;
                } else if (progress < 85) {
                    increment = Math.floor(Math.random() * 5) + 3;
                } else {
                    increment = Math.floor(Math.random() * 3) + 1;
                }
                
                progress = Math.min(100, progress + increment);
                fill.style.width = progress + '%';
                percent.textContent = progress + '%';

                if (progress >= 100) {
                    // Await DB snap completion
                    await dbPromise;

                    try {
                        const result = renderer(appContent);
                        if (result instanceof Promise) {
                            await result;
                        }
                        bindSoundEffects();
                        updateActiveNav(path);
                        initScrollAnimations();
                        initSpotlightEffect();
                        updateDynamicLinks();
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        adjustMobileLayout();
                    } catch (err) {
                        console.error("Renderer Error:", err);
                        appContent.innerHTML = `
                            <div class="container text-center" style="padding: 100px 0;">
                                <h2 class="font-orbitron" style="color: var(--neon-orange); margin-bottom: 20px;">SYSTEM FAULT (404)</h2>
                                <p>The arena section you are trying to access has been offline or decommissioned.</p>
                                <a href="#/" class="cta-button btn-neon-orange" style="margin-top: 30px;">RETURN HOME</a>
                            </div>
                        `;
                    }
                    setTimeout(() => {
                        loader.classList.add('hidden');
                    }, 250);
                } else {
                    const delay = Math.floor(Math.random() * 25) + 20;
                    setTimeout(tick, delay);
                }
            };
 
            setTimeout(tick, 60);
        } else {
            // Fallback
            window.strikzDb.init().then(async () => {
                try {
                    const result = renderer(appContent);
                    if (result instanceof Promise) {
                        await result;
                    }
                    bindSoundEffects();
                    updateActiveNav(path);
                    initScrollAnimations();
                    initSpotlightEffect();
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    adjustMobileLayout();
                } catch (err) {
                    console.error("Renderer Error Fallback:", err);
                }
            });
        }
    }

    // Active Navigation Highlight
    function updateActiveNav(path) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href').slice(1);
            if (href === path || (path === '/' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        document.querySelectorAll('.mobile-link').forEach(link => {
            const href = link.getAttribute('href').slice(1);
            if (href === path || (path === '/' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Sound FX Triggers
    function playSound(audioEl) {
        if (!soundEnabled || !audioEl) return;
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log('Sfx block:', e));
    }

    function bindSoundEffects() {
        document.querySelectorAll('a, button, select, input, textarea, .gallery-item, .player-card, .tournament-card').forEach(el => {
            if (el.dataset.sfxBound) return;
            el.dataset.sfxBound = "true";

            el.addEventListener('mouseenter', () => playSound(hoverSfx));
            el.addEventListener('click', () => playSound(clickSfx));
        });
    }

    // Sound Toggle Button Handler
    function initSoundToggle() {
        if (!soundToggle) return;
        updateSoundUI();
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('strikz_sound_enabled', soundEnabled);
            updateSoundUI();
            if (soundEnabled) {
                playSound(clickSfx);
            }
        });
    }

    // Music Toggle Button Handler
    function initMusicToggle() {
        if (!musicToggle || !bgMusic) return;
        bgMusic.volume = 0.15;
        updateMusicUI();

        if (musicEnabled) {
            bgMusic.play().catch(e => {
                console.log("Autoplay blocked on load. Will play upon first click.", e);
            });
        }

        musicToggle.addEventListener('click', () => {
            musicEnabled = !musicEnabled;
            localStorage.setItem('strikz_music_enabled', musicEnabled);
            updateMusicUI();
            if (musicEnabled) {
                bgMusic.play().catch(e => console.log("Music play blocked:", e));
            } else {
                bgMusic.pause();
            }
        });

        const unlockAudio = () => {
            [clickSfx, hoverSfx, successSfx, bgMusic].forEach(audio => {
                if (audio) {
                    const p = audio.play();
                    if (p !== undefined) {
                        p.then(() => {
                            if (audio !== bgMusic || !musicEnabled) {
                                audio.pause();
                                audio.currentTime = 0;
                            }
                        }).catch(e => console.log("Unlock check:", audio.id, e));
                    }
                }
            });
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
    }

    function updateMusicUI() {
        const icon = musicToggle.querySelector('i');
        if (musicEnabled) {
            icon.className = 'fa-solid fa-music logo-spin-glow';
            musicToggle.title = 'Mute Theme Music';
            musicToggle.style.borderColor = 'var(--neon-orange)';
            musicToggle.style.color = 'var(--neon-orange)';
        } else {
            icon.className = 'fa-solid fa-music';
            musicToggle.title = 'Enable Theme Music';
            musicToggle.style.borderColor = 'var(--glass-border)';
            musicToggle.style.color = 'var(--text-dim)';
        }
    }

    function updateSoundUI() {
        const icon = soundToggle.querySelector('i');
        if (soundEnabled) {
            icon.className = 'fa-solid fa-volume-high';
            soundToggle.title = 'Mute Sound FX';
            soundToggle.style.borderColor = 'var(--neon-cyan)';
            soundToggle.style.color = 'var(--neon-cyan)';
        } else {
            icon.className = 'fa-solid fa-volume-xmark';
            soundToggle.title = 'Enable Sound FX';
            soundToggle.style.borderColor = 'var(--glass-border)';
            soundToggle.style.color = 'var(--text-dim)';
        }
    }

    // Drawer Controls
    function openMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.add('active');
        if (mobileToggle) mobileToggle.style.opacity = '0';
    }

    function closeMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        if (mobileToggle) mobileToggle.style.opacity = '1';
    }

    window.strikzPlaySuccessSound = () => playSound(successSfx);
    window.strikzPlayClickSound = () => playSound(clickSfx);

    // ==========================================
    // BACKEND AUTHENTICATION MANAGER
    // ==========================================
    const authManager = {
        getUser: () => {
            const data = localStorage.getItem('strikz_user_profile') || sessionStorage.getItem('strikz_user_profile');
            return data ? JSON.parse(data) : null;
        },
        isLoggedIn: () => {
            return localStorage.getItem('strikz_jwt_token') !== null || sessionStorage.getItem('strikz_jwt_token') !== null;
        },
        loginUser: async (usernameOrEmail, password) => {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail, password })
            });
            const json = await res.json();
            if (json.requiresVerification) {
                return { requiresVerification: true, email: json.email };
            }
            if (!res.ok) {
                throw new Error(json.message || 'Authentication failed');
            }

            localStorage.setItem('strikz_jwt_token', json.token);
            localStorage.setItem('strikz_user_profile', JSON.stringify(json.user));

            if (json.user.role === 'admin') {
                sessionStorage.setItem('strikz_admin_logged_in', 'true');
                sessionStorage.setItem('strikz_jwt_token', json.token);
            }

            updateAuthUI();
            router();
            window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: json.user }));
            return json.user;
        },
        registerUser: async (username, email, password) => {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const json = await res.json();
            if (json.requiresVerification) {
                return { requiresVerification: true, email: json.email };
            }
            if (!res.ok) {
                throw new Error(json.message || 'Registration failed');
            }

            localStorage.setItem('strikz_jwt_token', json.token);
            localStorage.setItem('strikz_user_profile', JSON.stringify(json.user));

            updateAuthUI();
            router();
            window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: json.user }));
            return json.user;
        },
        googleLogin: async (idToken) => {
            const res = await fetch('/api/v1/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Google Auth failed');
            }

            localStorage.setItem('strikz_jwt_token', json.token);
            localStorage.setItem('strikz_user_profile', JSON.stringify(json.user));

            updateAuthUI();
            router();
            window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: json.user }));
            return json;
        },
        updateGamerProfile: async (username, avatar) => {
            const token = localStorage.getItem('strikz_jwt_token');
            const res = await fetch('/api/v1/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, avatar })
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Profile updates failed');
            }

            localStorage.setItem('strikz_user_profile', JSON.stringify(json.user));
            updateAuthUI();
            window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: json.user }));
            return json.user;
        },
        logout: () => {
            localStorage.removeItem('strikz_jwt_token');
            localStorage.removeItem('strikz_user_profile');
            sessionStorage.removeItem('strikz_admin_logged_in');
            sessionStorage.removeItem('strikz_jwt_token');
            sessionStorage.removeItem('strikz_user_profile');
            updateAuthUI();
            router();
            window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: null }));
        }
    };
    window.strikzAuth = authManager;



    function updateAuthUI() {
        const desktopSlot = document.getElementById('user-profile-slot');
        const mobileSlot = document.getElementById('mobile-auth-slot') || document.getElementById('mobile-drawer-footer');
        const user = authManager.getUser();

        const desktopLoggedInHTML = (avatar, name, uid) => `
            <div class="user-profile-card">
                <img src="${avatar}" alt="${name}" class="user-avatar-small btn-desktop-settings-trigger" style="cursor: pointer;" title="Account Settings">
                <div class="user-info-text" style="cursor: pointer;">
                    <div class="user-gamertag btn-desktop-settings-trigger" title="Account Settings">${name}</div>
                    <div class="user-status-text click-to-copy-uid" style="color: var(--neon-yellow); font-size: 10px; font-weight: bold; font-family: var(--font-header); letter-spacing:0.05em; display:flex; align-items:center; gap:4px; margin-top:2px;" title="Click to copy Gamer UID" data-uid="${uid || ''}">
                        <i class="fa-regular fa-copy" style="font-size:9px;"></i> ${uid || 'STRIKZ-XXXXXX'}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px; border-top: 1px solid var(--glass-border); padding-top: 8px; width: 100%;">
                    <button class="btn-auth-settings btn-desktop-settings-trigger" title="Account Settings" style="color: var(--text-dim); background: none; border: none; cursor: pointer; font-size: 11px;">
                        <i class="fa-solid fa-user-gear"></i> Settings
                    </button>
                    <button class="btn-auth-logout btn-desktop-logout-trigger" title="Log Out / Exit Arena" style="color: var(--text-dim); background: none; border: none; cursor: pointer; font-size: 11px; margin-left: 10px;">
                        <i class="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </div>
            </div>
        `;
 
        const mobileLoggedInHTML = (avatar, name, uid) => `
            <div class="user-profile-card-mobile">
                <img src="${avatar}" alt="${name}" class="user-avatar-small-mobile btn-mobile-settings-trigger" style="cursor: pointer;" title="Account Settings">
                <div class="user-info-text-mobile" style="cursor: pointer;">
                    <div class="user-gamertag-mobile font-orbitron btn-mobile-settings-trigger" title="Account Settings">${name}</div>
                    <div class="user-status-text-mobile click-to-copy-uid" style="color: var(--neon-yellow); font-size: 9px; font-weight: bold; font-family: var(--font-header); letter-spacing:0.05em; display:flex; align-items:center; gap:4px; margin-top:2px;" title="Click to copy Gamer UID" data-uid="${uid || ''}">
                        <i class="fa-regular fa-copy" style="font-size:8px;"></i> ${uid || 'STRIKZ-XXXXXX'}
                    </div>
                </div>
                <div class="profile-menu-container-mobile">
                    <button class="btn-auth-logout-mobile" id="btn-mobile-menu-trigger" title="Account Options">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                    <div class="profile-dropdown-menu-mobile glass-panel hidden">
                        <button class="dropdown-item-mobile btn-mobile-settings-trigger">
                            <i class="fa-solid fa-user-gear"></i> Settings
                        </button>
                        <button class="dropdown-item-mobile btn-mobile-logout-trigger">
                            <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
 
        const loggedOutHTML = (btnId) => `
            <button class="login-trigger-btn btn-neon-orange w-full" id="${btnId}">
                <i class="fa-solid fa-right-to-bracket"></i>
                <span class="btn-text">LOGIN</span>
            </button>
        `;
 
        const quickPortal = document.getElementById('quick-portal-bar');

        if (user) {
            if (desktopSlot) desktopSlot.innerHTML = desktopLoggedInHTML(user.avatar, user.username, user.uid);
            if (mobileSlot) mobileSlot.innerHTML = mobileLoggedInHTML(user.avatar, user.username, user.uid);
            
            document.body.classList.add('logged-in');

            if (quickPortal) {
                quickPortal.innerHTML = `
                    <a href="#/myteam" class="portal-btn font-orbitron" title="Squad HQ">
                        <i class="fa-solid fa-users"></i> <span>Squad HQ</span>
                    </a>
                    <a href="#/friends" class="portal-btn font-orbitron" title="Friends & DMs">
                        <i class="fa-solid fa-comment-dots"></i> <span>DMs</span>
                    </a>
                    <a href="#/inbox" class="portal-btn font-orbitron" title="Arena Inbox" style="position: relative;">
                        <i class="fa-solid fa-envelope"></i> <span>Inbox</span>
                        <span id="portal-inbox-badge" class="badge-dot hidden" style="position: absolute; top: -1px; right: -4px; width: 6px; height: 6px; border-radius: 50%; background: var(--neon-orange);"></span>
                    </a>
                `;
                quickPortal.classList.remove('hidden');
            }

            // Show/hide admin links based on user role
            const sidebarAdminLink = document.getElementById('nav-admin');
            const mobileAdminLi = document.getElementById('mob-admin');
            if (user.role === 'admin') {
                if (sidebarAdminLink) sidebarAdminLink.removeAttribute('style');
                if (mobileAdminLi && mobileAdminLi.parentElement) mobileAdminLi.parentElement.style.removeProperty('display');
                if (mobileAdminLi) mobileAdminLi.style.removeProperty('display');
            } else {
                if (sidebarAdminLink) sidebarAdminLink.style.setProperty('display', 'none', 'important');
                if (mobileAdminLi && mobileAdminLi.parentElement) mobileAdminLi.parentElement.style.setProperty('display', 'none', 'important');
            }

            setTimeout(updateInboxBadges, 100);

            // Bind click-to-copy UID handler
            document.querySelectorAll('.click-to-copy-uid').forEach(el => {
                el.onclick = function(e) {
                    e.stopPropagation();
                    const uidVal = this.dataset.uid;
                    if (!uidVal) return;
                    navigator.clipboard.writeText(uidVal).then(() => {
                        const originalHTML = this.innerHTML;
                        this.innerHTML = `<i class="fa-solid fa-check" style="color:var(--neon-green);"></i> COPIED!`;
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        setTimeout(() => {
                            this.innerHTML = originalHTML;
                        }, 1200);
                    }).catch(err => {
                        console.error('Failed to copy UID:', err);
                    });
                };
            });

            // Bind desktop settings listeners
            document.querySelectorAll('.btn-desktop-settings-trigger').forEach(el => {
                el.addEventListener('click', () => {
                    playSound(clickSfx);
                    openSettingsModal();
                });
            });

            // Bind desktop logout listeners
            document.querySelectorAll('.btn-desktop-logout-trigger').forEach(btn => {
                btn.addEventListener('click', () => {
                    playSound(clickSfx);
                    authManager.logout();
                });
            });

            // Bind mobile menu toggle
            const mobMenuTrigger = document.getElementById('btn-mobile-menu-trigger');
            if (mobMenuTrigger) {
                mobMenuTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playSound(clickSfx);
                    const dropdown = mobMenuTrigger.nextElementSibling;
                    if (dropdown) dropdown.classList.toggle('hidden');
                });
            }

            // Bind mobile settings click
            document.querySelectorAll('.btn-mobile-settings-trigger').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playSound(clickSfx);
                    const dropdown = document.querySelector('.profile-dropdown-menu-mobile');
                    if (dropdown) dropdown.classList.add('hidden');
                    openSettingsModal();
                });
            });

            // Bind mobile logout click
            document.querySelectorAll('.btn-mobile-logout-trigger').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playSound(clickSfx);
                    authManager.logout();
                });
            });
        } else {
            document.body.classList.remove('logged-in');
            if (quickPortal) {
                quickPortal.classList.add('hidden');
                quickPortal.innerHTML = '';
            }

            // Hide admin links when logged out
            const sidebarAdminLink = document.getElementById('nav-admin');
            const mobileAdminLi = document.getElementById('mob-admin');
            if (sidebarAdminLink) sidebarAdminLink.style.setProperty('display', 'none', 'important');
            if (mobileAdminLi && mobileAdminLi.parentElement) mobileAdminLi.parentElement.style.setProperty('display', 'none', 'important');

            if (desktopSlot) desktopSlot.innerHTML = loggedOutHTML('btn-sidebar-login');
            if (mobileSlot) mobileSlot.innerHTML = loggedOutHTML('btn-drawer-login');

            // Bind login trigger listeners
            document.querySelectorAll('#btn-sidebar-login, #btn-drawer-login').forEach(btn => {
                btn.addEventListener('click', () => {
                    playSound(clickSfx);
                    openLoginModal();
                });
            });
        }
        adjustMobileLayout();
    }

    function updateDynamicLinks() {
        if (!window.strikzDb) return;
        const settings = window.strikzDb.getSettings();
        if (!settings) return;

        // Update Discord links
        document.querySelectorAll('a[href*="discord.gg"]').forEach(a => {
            if (settings.discordLink) a.href = settings.discordLink;
        });
        
        // Update Instagram links
        document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
            if (a.href.includes('strikz') && settings.instagramLink) {
                a.href = settings.instagramLink;
            }
        });

        // Update YouTube links
        document.querySelectorAll('a[href*="youtube.com"]').forEach(a => {
            if (a.href.includes('strikz') && settings.youtubeLink) {
                a.href = settings.youtubeLink;
            }
        });
    }

    // Modal controls
    const loginModal = document.getElementById('login-modal');
    const loginLoading = document.getElementById('login-loading-container');
    const progressFill = document.getElementById('google-progress-fill');
    
    // Modal form containers
    const loginContainer = document.getElementById('login-view-container');
    const registerContainer = document.getElementById('register-view-container');
    const forgotContainer = document.getElementById('forgot-view-container');
    const resetContainer = document.getElementById('reset-view-container');
    const googleAccountsContainer = document.getElementById('google-accounts-container');
    const googleAccountsList = document.getElementById('google-accounts-list');

    const settingsModal = document.getElementById('settings-modal');
    const settingsUserInput = document.getElementById('settings-input-user');

    function showLogin() {
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (registerContainer) registerContainer.classList.add('hidden');
        if (forgotContainer) forgotContainer.classList.add('hidden');
        if (resetContainer) resetContainer.classList.add('hidden');
        if (googleAccountsContainer) googleAccountsContainer.classList.add('hidden');
    }

    function showRegister() {
        if (loginContainer) loginContainer.classList.add('hidden');
        if (registerContainer) registerContainer.classList.remove('hidden');
        if (forgotContainer) forgotContainer.classList.add('hidden');
        if (resetContainer) resetContainer.classList.add('hidden');
        if (googleAccountsContainer) googleAccountsContainer.classList.add('hidden');
    }

    function showForgot() {
        if (loginContainer) loginContainer.classList.add('hidden');
        if (registerContainer) registerContainer.classList.add('hidden');
        if (forgotContainer) forgotContainer.classList.remove('hidden');
        if (resetContainer) resetContainer.classList.add('hidden');
        if (googleAccountsContainer) googleAccountsContainer.classList.add('hidden');
    }

    function showReset() {
        if (loginContainer) loginContainer.classList.add('hidden');
        if (registerContainer) registerContainer.classList.add('hidden');
        if (forgotContainer) forgotContainer.classList.add('hidden');
        if (resetContainer) resetContainer.classList.remove('hidden');
        if (googleAccountsContainer) googleAccountsContainer.classList.add('hidden');
    }

    let googleClientId = null;
    let googleInitialized = false;

    async function prefetchGoogleConfig() {
        try {
            if (!googleClientId) {
                const res = await fetch('/api/v1/auth/config?_t=' + Date.now());
                const json = await res.json();
                if (json.success) {
                    googleClientId = json.googleClientId;
                    initGoogleSignIn();
                }
            }
        } catch (err) {
            console.error("Prefetch Google Config failed:", err);
        }
    }

    function promptUsernameSelection() {
        const usernameModal = document.getElementById('username-selection-modal');
        if (usernameModal) {
            usernameModal.classList.add('active');
            const input = document.getElementById('username-selection-input');
            const user = authManager.getUser();
            if (input && user) {
                input.value = user.username;
            }
        }
    }

    async function handleGoogleRedirectLogin(credential) {
        if (loginContainer && loginLoading && progressFill) {
            loginContainer.classList.add('hidden');
            loginLoading.classList.remove('hidden');
            const loaderText = document.querySelector('#login-loading-container .loader-text');
            if (loaderText) loaderText.textContent = "VERIFYING GOOGLE ACCOUNT...";
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('active');
        }

        try {
            const loginResult = await authManager.googleLogin(credential);
            closeLoginModal();
            playSound(successSfx);
            if (loginResult && loginResult.isNewUser) {
                promptUsernameSelection();
            }
        } catch (err) {
            alert("Google Sign-In failed: " + err.message);
            showLogin();
            if (loginLoading) loginLoading.classList.add('hidden');
        } finally {
            const loaderText = document.querySelector('#login-loading-container .loader-text');
            if (loaderText) loaderText.textContent = "CONNECTING TO GOOGLE SECURE PORTAL...";
        }
    }

    async function initGoogleSignIn() {
        if (googleInitialized) return;
        try {
            if (!googleClientId) {
                const res = await fetch('/api/v1/auth/config?_t=' + Date.now());
                const json = await res.json();
                if (json.success) {
                    googleClientId = json.googleClientId;
                }
            }
            if (!googleClientId) {
                console.warn("Google Client ID is not configured on the backend.");
                return;
            }
            if (typeof google === 'undefined' || !google.accounts) {
                console.warn("Google Accounts client script not loaded yet.");
                return;
            }
            google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredentialResponse
            });
            googleInitialized = true;
        } catch (err) {
            console.error("Failed to initialize Google Sign-in:", err);
        }
    }

    async function renderGoogleButton() {
        await initGoogleSignIn();
        const btnContainer = document.getElementById("google-signin-btn-container");
        if (!btnContainer) return;

        try {
            if (googleInitialized) {
                btnContainer.innerHTML = '';
                const widthVal = btnContainer.offsetWidth || 250;
                const safeWidth = Math.max(200, Math.min(400, widthVal));
                google.accounts.id.renderButton(
                    btnContainer,
                    { 
                        theme: "filled_blue", 
                        size: "large",
                        text: "signin_with",
                        shape: "rectangular",
                        width: safeWidth
                    }
                );
            } else {
                if (!googleClientId) {
                    btnContainer.innerHTML = `
                        <div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 8px;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Loading Google Config...
                        </div>
                    `;
                    setTimeout(renderGoogleButton, 250);
                } else if (typeof google === 'undefined' || !google.accounts) {
                    btnContainer.innerHTML = `
                        <div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 8px;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Connecting to Google Auth...
                        </div>
                    `;
                    setTimeout(renderGoogleButton, 250);
                } else {
                    btnContainer.innerHTML = `
                        <div style="color: #ff5e00; font-size: 11px; text-align: center; border: 1px dashed #ff5e00; padding: 8px; border-radius: 4px; background: rgba(255, 94, 0, 0.05); width: 100%;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Google Sign-in initialization failed. Check browser console.
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error("Google button render error:", err);
            btnContainer.innerHTML = `
                <div style="color: #ff5e00; font-size: 11px; text-align: center; border: 1px dashed #ff5e00; padding: 8px; border-radius: 4px; background: rgba(255, 94, 0, 0.05); width: 100%;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Google Render Error: ${err.message}
                </div>
            `;
        }
    }

    async function handleGoogleCredentialResponse(response) {
        if (!response.credential) return;
        
        // Show loading state
        if (loginContainer && loginLoading && progressFill) {
            loginContainer.classList.add('hidden');
            loginLoading.classList.remove('hidden');
            const loaderText = document.querySelector('#login-loading-container .loader-text');
            if (loaderText) loaderText.textContent = "VERIFYING GOOGLE ACCOUNT...";
        }

        try {
            const loginResult = await authManager.googleLogin(response.credential);
            closeLoginModal();
            playSound(successSfx);
            if (loginResult && loginResult.isNewUser) {
                promptUsernameSelection();
            }
        } catch (err) {
            alert("Google Sign-In failed: " + err.message);
            showLogin();
            if (loginLoading) loginLoading.classList.add('hidden');
        } finally {
            const loaderText = document.querySelector('#login-loading-container .loader-text');
            if (loaderText) loaderText.textContent = "CONNECTING TO GOOGLE SECURE PORTAL...";
        }
    }

    async function updateInboxBadges() {
        if (!authManager.isLoggedIn()) return;
        try {
            const res = await window.strikzDb.getMyTeamInbox();
            const count = (res && res.inbox) ? res.inbox.length : 0;
            const desktopBadge = document.getElementById('desktop-inbox-badge');
            const mobileBadge = document.getElementById('mobile-inbox-badge');
            if (desktopBadge) {
                if (count > 0) desktopBadge.classList.remove('hidden');
                else desktopBadge.classList.add('hidden');
            }
            if (mobileBadge) {
                if (count > 0) mobileBadge.classList.remove('hidden');
                else mobileBadge.classList.add('hidden');
            }
            const portalBadge = document.getElementById('portal-inbox-badge');
            if (portalBadge) {
                if (count > 0) portalBadge.classList.remove('hidden');
                else portalBadge.classList.add('hidden');
            }
        } catch (e) {
            console.error('Failed to update inbox badges', e);
        }
    }
    window.updateInboxBadges = updateInboxBadges;

    function adjustMobileLayout() {
        const mobileHeader = document.querySelector('.mobile-header');
        const quickPortal = document.getElementById('quick-portal-bar');
        const mainContent = document.getElementById('app-content');
        if (mobileHeader && window.innerWidth <= 768) {
            const headerHeight = mobileHeader.offsetHeight;
            if (quickPortal && !quickPortal.classList.contains('hidden')) {
                quickPortal.style.setProperty('top', `${headerHeight}px`, 'important');
                if (mainContent) {
                    mainContent.style.setProperty('margin-top', `${headerHeight + 40}px`, 'important');
                }
            } else {
                if (quickPortal) quickPortal.style.removeProperty('top');
                if (mainContent) {
                    mainContent.style.setProperty('margin-top', `${headerHeight}px`, 'important');
                }
            }
        } else {
            if (quickPortal) quickPortal.style.removeProperty('top');
            if (mainContent) {
                mainContent.style.removeProperty('margin-top');
            }
        }
    }
    window.adjustMobileLayout = adjustMobileLayout;

    function openLoginModal() {
        if (!loginModal) return;
        loginModal.classList.add('active');
        showLogin();
        if (loginLoading) loginLoading.classList.add('hidden');
        if (progressFill) progressFill.style.width = '0%';
        
        // Reset fields
        document.getElementById('login-input-user').value = '';
        document.getElementById('login-input-pass').value = '';

        // Render Google Sign-in button
        renderGoogleButton();
    }

    function closeLoginModal() {
        if (!loginModal) return;
        loginModal.classList.remove('active');
    }

    function openSettingsModal() {
        if (!settingsModal) return;
        const user = authManager.getUser();
        if (user && settingsUserInput) {
            settingsUserInput.value = user.username;
            const settingsInputAvatar = document.getElementById('settings-input-avatar');
            if (settingsInputAvatar) settingsInputAvatar.value = user.avatar;
            const settingsAvatarPreview = document.getElementById('settings-avatar-preview');
            if (settingsAvatarPreview) settingsAvatarPreview.src = user.avatar;
        }
        settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
        if (!settingsModal) return;
        settingsModal.classList.remove('active');
    }

    let currentOtpEmail = '';

    function openOtpModal(email) {
        const otpModal = document.getElementById('otp-verification-modal');
        const emailDisplay = document.getElementById('otp-email-display');
        const codeInput = document.getElementById('otp-input-code');
        
        if (!otpModal) return;
        
        currentOtpEmail = email;
        if (emailDisplay) emailDisplay.textContent = email;
        if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
        }
        
        otpModal.classList.add('active');
        
        // Hide resend countdown and show link initially
        const resendLink = document.getElementById('link-otp-resend');
        const countdownDisp = document.getElementById('otp-countdown-display');
        if (resendLink) resendLink.classList.remove('hidden');
        if (countdownDisp) countdownDisp.classList.add('hidden');
    }

    function closeOtpModal() {
        const otpModal = document.getElementById('otp-verification-modal');
        if (otpModal) otpModal.classList.remove('active');
    }



    // Premium Animation Initializers
    function initScrollAnimations() {
        const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

        reveals.forEach(el => observer.observe(el));
    }

    function initSpotlightEffect() {
        document.querySelectorAll('.glass-panel').forEach(panel => {
            panel.addEventListener('mousemove', (e) => {
                const rect = panel.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                panel.style.setProperty('--mouse-x', `${x}px`);
                panel.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
    window.strikzInitScrollAnimations = initScrollAnimations;
    window.strikzInitSpotlightEffect = initSpotlightEffect;

    // Initial Bindings
    window.addEventListener('hashchange', router);
    window.addEventListener('resize', adjustMobileLayout);
    window.addEventListener('orientationchange', adjustMobileLayout);
    window.addEventListener('DOMContentLoaded', () => {
        prefetchGoogleConfig();

        router();
        initSoundToggle();
        initMusicToggle();
        updateAuthUI();

        // Check for redirect Google Sign-in credential
        const urlParams = new URLSearchParams(window.location.search);
        const googleCred = urlParams.get('google_credential');
        if (googleCred) {
            urlParams.delete('google_credential');
            const newSearch = urlParams.toString();
            const searchPart = newSearch ? '?' + newSearch : '';
            window.history.replaceState(null, '', window.location.pathname + searchPart + (window.location.hash || '#/'));
            handleGoogleRedirectLogin(googleCred);
        }

        // Hamburger buttons
        if (mobileToggle) mobileToggle.addEventListener('click', openMobileDrawer);
        if (mobileClose) mobileClose.addEventListener('click', closeMobileDrawer);

        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', closeMobileDrawer);
        });

        // Close Login Modal button
        const btnLoginClose = document.getElementById('btn-login-close');
        if (btnLoginClose) {
            btnLoginClose.addEventListener('click', () => {
                playSound(clickSfx);
                closeLoginModal();
            });
        }

        // OTP Close Button
        const btnOtpClose = document.getElementById('btn-otp-close');
        if (btnOtpClose) {
            btnOtpClose.onclick = () => {
                playSound(clickSfx);
                closeOtpModal();
            };
        }

        // OTP Submit Button
        const btnOtpSubmit = document.getElementById('btn-otp-submit');
        if (btnOtpSubmit) {
            btnOtpSubmit.onclick = async () => {
                playSound(clickSfx);
                const code = document.getElementById('otp-input-code').value.trim();
                
                if (!code || code.length !== 6 || isNaN(code)) {
                    alert("Please enter a valid 6-digit OTP code.");
                    return;
                }

                try {
                    btnOtpSubmit.disabled = true;
                    btnOtpSubmit.textContent = 'ACTIVATING...';
                    
                    const res = await fetch('/api/v1/auth/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: currentOtpEmail, code })
                    });
                    const json = await res.json();
                    
                    if (!res.ok) {
                        throw new Error(json.message || 'OTP verification failed');
                    }

                    // Success: Save token & user
                    localStorage.setItem('strikz_jwt_token', json.token);
                    localStorage.setItem('strikz_user_profile', JSON.stringify(json.user));

                    updateAuthUI();
                    closeOtpModal();
                    playSound(successSfx);
                    alert("Your profile has been activated and authenticated! Welcome to Strikz Esports Arena.");
                    
                    // Dispatch change event
                    window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: json.user }));
                    router();
                } catch (err) {
                    alert("Verification failed: " + err.message);
                } finally {
                    btnOtpSubmit.disabled = false;
                    btnOtpSubmit.textContent = 'ACTIVATE PROFILE';
                }
            };
        }

        // OTP Resend Link
        const linkOtpResend = document.getElementById('link-otp-resend');
        if (linkOtpResend) {
            linkOtpResend.onclick = async () => {
                playSound(clickSfx);
                if (!currentOtpEmail) return;

                try {
                    const res = await fetch('/api/v1/auth/resend-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: currentOtpEmail })
                    });
                    const json = await res.json();

                    if (!res.ok) {
                        throw new Error(json.message || 'Resend request failed');
                    }

                    alert("A new verification key has been sent to your email.");
                    
                    // Start countdown
                    linkOtpResend.classList.add('hidden');
                    const countdownDisp = document.getElementById('otp-countdown-display');
                    const secondsSpan = document.getElementById('otp-seconds');
                    if (countdownDisp) countdownDisp.classList.remove('hidden');
                    
                    let seconds = 60;
                    if (secondsSpan) secondsSpan.textContent = seconds;
                    
                    const timer = setInterval(() => {
                        seconds--;
                        if (secondsSpan) secondsSpan.textContent = seconds;
                        if (seconds <= 0) {
                            clearInterval(timer);
                            if (countdownDisp) countdownDisp.classList.add('hidden');
                            linkOtpResend.classList.remove('hidden');
                        }
                    }, 1000);
                } catch (err) {
                    alert("Resend failed: " + err.message);
                }
            };
        }

        // Setup Form toggles
        document.getElementById('link-show-register').onclick = showRegister;
        document.getElementById('link-show-forgot').onclick = showForgot;
        document.querySelectorAll('.link-show-login').forEach(el => el.onclick = showLogin);



        // Login Plain user click
        const btnPlainLogin = document.getElementById('btn-plain-login');
        if (btnPlainLogin) {
            btnPlainLogin.addEventListener('click', async () => {
                playSound(clickSfx);
                const userVal = document.getElementById('login-input-user').value.trim();
                const passVal = document.getElementById('login-input-pass').value.trim();

                if (!userVal || !passVal) {
                    alert("Please enter gamer identifier and access password.");
                    return;
                }

                try {
                    const result = await authManager.loginUser(userVal, passVal);
                    if (result && result.requiresVerification) {
                        closeLoginModal();
                        openOtpModal(result.email);
                    } else {
                        closeLoginModal();
                        playSound(successSfx);
                    }
                } catch (err) {
                    alert(err.message);
                }
            });
        }

        // Register form submit
        const btnSubmitRegister = document.getElementById('btn-submit-register');
        if (btnSubmitRegister) {
            btnSubmitRegister.onclick = async () => {
                playSound(clickSfx);
                const user = document.getElementById('register-input-user').value.trim();
                const email = document.getElementById('register-input-email').value.trim();
                const pass = document.getElementById('register-input-pass').value.trim();

                if (!user || !email || !pass) {
                    alert("Please fill in all registration fields.");
                    return;
                }

                try {
                    const result = await authManager.registerUser(user, email, pass);
                    if (result && result.requiresVerification) {
                        closeLoginModal();
                        openOtpModal(result.email);
                    } else {
                        closeLoginModal();
                        playSound(successSfx);
                        alert("Gamer registration complete. Welcome to the arena!");
                    }
                } catch (err) {
                    alert("Registration failed: " + err.message);
                }
            };
        }

        // Forgot Password form submit
        const btnSubmitForgot = document.getElementById('btn-submit-forgot');
        if (btnSubmitForgot) {
            btnSubmitForgot.onclick = async () => {
                playSound(clickSfx);
                const email = document.getElementById('forgot-input-email').value.trim();
                if (!email) {
                    alert("Please enter your registered email address.");
                    return;
                }

                try {
                    const res = await fetch('/api/v1/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.message);

                    alert("Override dispatch link has been sent to your email!");
                    showLogin();
                } catch (err) {
                    alert("Failed to send reset link: " + err.message);
                }
            };
        }

        // Reset Password form submit
        const btnSubmitReset = document.getElementById('btn-submit-reset');
        if (btnSubmitReset) {
            btnSubmitReset.onclick = async () => {
                playSound(clickSfx);
                const pass = document.getElementById('reset-input-pass').value.trim();
                const token = window.resetPasswordToken;

                if (!pass || !token) {
                    alert("Password cannot be empty or token invalid.");
                    return;
                }

                try {
                    const res = await fetch('/api/v1/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, password: pass })
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.message);

                    alert("Password override complete! Please login with your new password.");
                    window.resetPasswordToken = null;
                    showLogin();
                } catch (err) {
                    alert("Override failed: " + err.message);
                }
            };
        }

        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    closeLoginModal();
                }
            });
        }

        // Settings Modal listeners
        const btnSettingsClose = document.getElementById('btn-settings-close');
        const btnSettingsSave = document.getElementById('btn-settings-save');
        const settingsAvatarFile = document.getElementById('settings-input-avatar-file');
        const settingsInputAvatar = document.getElementById('settings-input-avatar');
        const settingsAvatarPreview = document.getElementById('settings-avatar-preview');

        if (settingsAvatarFile) {
            settingsAvatarFile.onchange = async function() {
                const file = settingsAvatarFile.files[0];
                if (!file) return;
                try {
                    const res = await window.strikzDb.uploadFile(file);
                    if (settingsInputAvatar) settingsInputAvatar.value = res.imageUrl;
                    if (settingsAvatarPreview) settingsAvatarPreview.src = res.imageUrl;
                    alert("Gamer photo uploaded successfully!");
                } catch (err) {
                    alert("Photo upload failed: " + err.message);
                }
            };
        }

        if (btnSettingsClose) {
            btnSettingsClose.addEventListener('click', () => {
                playSound(clickSfx);
                closeSettingsModal();
            });
        }
        if (btnSettingsSave) {
            btnSettingsSave.addEventListener('click', async () => {
                playSound(clickSfx);
                const newNick = settingsUserInput.value.trim();
                if (!newNick) {
                    alert("Gamer tag cannot be left blank.");
                    return;
                }
                const newAvatar = settingsInputAvatar ? settingsInputAvatar.value : authManager.getUser().avatar;

                try {
                    await authManager.updateGamerProfile(newNick, newAvatar);
                    closeSettingsModal();
                    playSound(successSfx);
                    alert("Gamer profile settings saved!");
                } catch (err) {
                    alert("Settings error: " + err.message);
                }
            });
        }
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    closeSettingsModal();
                }
            });
        }

        const btnUsernameSave = document.getElementById('btn-username-selection-save');
        if (btnUsernameSave) {
            btnUsernameSave.addEventListener('click', async () => {
                playSound(clickSfx);
                const input = document.getElementById('username-selection-input');
                const username = input ? input.value.trim() : '';
                if (!username) {
                    alert('Please enter a username.');
                    return;
                }
                try {
                    const user = authManager.getUser();
                    const updatedUser = await authManager.updateGamerProfile(username, user ? user.avatar : '');
                    const usernameModal = document.getElementById('username-selection-modal');
                    if (usernameModal) {
                        usernameModal.classList.remove('active');
                    }
                    playSound(successSfx);
                    alert(`Welcome, ${updatedUser.username}! Your Gamer UID is now ${updatedUser.uid}.`);
                } catch (err) {
                    alert('Failed to set username: ' + err.message);
                }
            });
        }

        document.addEventListener('click', () => {
            document.querySelectorAll('.profile-dropdown-menu-mobile').forEach(d => {
                d.classList.add('hidden');
            });
        });

        if (window.initChatbot) {
            window.initChatbot();
        }
    });

})();
