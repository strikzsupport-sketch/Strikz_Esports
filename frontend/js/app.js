/* ==========================================================================
   STRIKZ ESPORTS - GLOBAL APP CONTROL & SPA ROUTER
   ========================================================================== */

(function() {
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
        '/history': window.renderHistory,
        '/achievements': window.renderAchievements,
        '/gallery': window.renderGallery,
        '/news': window.renderNews,
        '/sponsors': window.renderSponsorsPage,
        '/contact': window.renderContact,
        '/registration': window.renderRegistration,
        '/admin': window.renderAdmin,
        '/partners': window.renderPartners
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
                        renderer(appContent);
                        bindSoundEffects();
                        updateActiveNav(path);
                        initScrollAnimations();
                        initSpotlightEffect();
                        updateDynamicLinks();
                        window.scrollTo({ top: 0, behavior: 'instant' });
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
            window.strikzDb.init().then(() => {
                try {
                    renderer(appContent);
                    bindSoundEffects();
                    updateActiveNav(path);
                    initScrollAnimations();
                    initSpotlightEffect();
                    window.scrollTo({ top: 0, behavior: 'instant' });
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
            const data = localStorage.getItem('strikz_user_profile');
            return data ? JSON.parse(data) : null;
        },
        isLoggedIn: () => {
            return localStorage.getItem('strikz_jwt_token') !== null;
        },
        loginUser: async (usernameOrEmail, password) => {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail, password })
            });
            const json = await res.json();
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
        googleLogin: async (name, email, avatar) => {
            const res = await fetch('/api/v1/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, avatar, googleId: 'google-mock-' + name })
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
            return json.user;
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
            updateAuthUI();
            router();
            window.dispatchEvent(new CustomEvent('strikz-auth-changed', { detail: null }));
        }
    };
    window.strikzAuth = authManager;

    // MOCK USER DATA FOR GOOGLE SIGN IN
    const mockGamers = [
        { name: "Viper.FF", email: "viper.ff@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=viper&backgroundColor=0a0a0f" },
        { name: "Rafi.Survivor", email: "rafi.survivor@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=rafi&backgroundColor=0a0a0f" },
        { name: "Kelly.Pro", email: "kelly.ff@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=kelly&backgroundColor=0a0a0f" },
        { name: "Alok.King", email: "alok.king@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=alok&backgroundColor=0a0a0f" },
        { name: "Strikz.Sniper", email: "sniper.strikz@gmail.com", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=sniper&backgroundColor=0a0a0f" }
    ];

    function updateAuthUI() {
        const desktopSlot = document.getElementById('user-profile-slot');
        const mobileSlot = document.getElementById('mobile-auth-slot') || document.getElementById('mobile-drawer-footer');
        const user = authManager.getUser();

        const desktopLoggedInHTML = (avatar, name) => `
            <div class="user-profile-card">
                <img src="${avatar}" alt="${name}" class="user-avatar-small btn-desktop-settings-trigger" style="cursor: pointer;" title="Account Settings">
                <div class="user-info-text btn-desktop-settings-trigger" style="cursor: pointer;" title="Account Settings">
                    <div class="user-gamertag">${name}</div>
                    <div class="user-status-text">AUTHORIZED</div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: center; margin-top: 4px;">
                    <button class="btn-auth-settings btn-desktop-settings-trigger" title="Account Settings" style="color: var(--text-dim); background: none; border: none; cursor: pointer; font-size: 11px;">
                        <i class="fa-solid fa-user-gear"></i>
                    </button>
                    <button class="btn-auth-logout btn-desktop-logout-trigger" title="Log Out / Exit Arena" style="color: var(--text-dim); background: none; border: none; cursor: pointer; font-size: 11px;">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
        `;

        const mobileLoggedInHTML = (avatar, name) => `
            <div class="user-profile-card-mobile">
                <img src="${avatar}" alt="${name}" class="user-avatar-small-mobile btn-mobile-settings-trigger" style="cursor: pointer;" title="Account Settings">
                <div class="user-info-text-mobile btn-mobile-settings-trigger" style="cursor: pointer;" title="Account Settings">
                    <div class="user-gamertag-mobile font-orbitron">${name}</div>
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

        if (user) {
            if (desktopSlot) desktopSlot.innerHTML = desktopLoggedInHTML(user.avatar, user.username);
            if (mobileSlot) mobileSlot.innerHTML = mobileLoggedInHTML(user.avatar, user.username);

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

    function openLoginModal() {
        if (!loginModal) return;
        loginModal.classList.add('active');
        showLogin();
        if (loginLoading) loginLoading.classList.add('hidden');
        if (progressFill) progressFill.style.width = '0%';
        
        // Reset fields
        document.getElementById('login-input-user').value = '';
        document.getElementById('login-input-pass').value = '';
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
        }
        settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
        if (!settingsModal) return;
        settingsModal.classList.remove('active');
    }

    function simulateGoogleSignIn() {
        if (!loginContainer || !loginLoading || !progressFill || !googleAccountsContainer || !googleAccountsList) return;
        
        loginContainer.classList.add('hidden');
        loginLoading.classList.remove('hidden');
        
        let width = 0;
        const interval = setInterval(async () => {
            width += 5;
            progressFill.style.width = width + '%';
            if (width >= 100) {
                clearInterval(interval);
                
                loginLoading.classList.add('hidden');
                googleAccountsContainer.classList.remove('hidden');
                
                // Render list
                googleAccountsList.innerHTML = mockGamers.map((gamer, idx) => `
                    <div class="google-account-card" data-idx="${idx}" style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 10px 15px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px;">
                        <img src="${gamer.avatar}" style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--glass-border); padding: 2px; background: rgba(0,0,0,0.5);">
                        <div style="flex-grow: 1; text-align: left;">
                            <div style="color: #fff; font-weight: 700; font-size: 13px; font-family: var(--font-header); letter-spacing: 0.05em;">${gamer.name}</div>
                            <div style="color: var(--text-dim); font-size: 11px;">${gamer.email}</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: var(--neon-orange); font-size: 12px;"></i>
                    </div>
                `).join('');

                // Bind hover and click events
                googleAccountsList.querySelectorAll('.google-account-card').forEach(card => {
                    card.style.transition = 'all 0.2s ease';
                    card.addEventListener('mouseenter', () => {
                        card.style.background = 'rgba(255, 94, 0, 0.06)';
                        card.style.borderColor = 'var(--neon-orange-border)';
                        card.style.boxShadow = '0 0 10px rgba(255, 94, 0, 0.1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.background = 'rgba(255,255,255,0.02)';
                        card.style.borderColor = 'var(--glass-border)';
                        card.style.boxShadow = 'none';
                    });
                    card.onclick = async function() {
                        const idx = this.dataset.idx;
                        const gamer = mockGamers[idx];
                        
                        // Show loader again briefly
                        googleAccountsContainer.classList.add('hidden');
                        loginLoading.classList.remove('hidden');
                        const loaderText = document.querySelector('#login-loading-container .loader-text');
                        if (loaderText) loaderText.textContent = "AUTHORIZING GAMER...";
                        
                        try {
                            await authManager.googleLogin(gamer.name, gamer.email, gamer.avatar);
                            closeLoginModal();
                            playSound(successSfx);
                        } catch (err) {
                            alert("Google auth portal failed: " + err.message);
                            showLogin();
                            loginLoading.classList.add('hidden');
                        } finally {
                            if (loaderText) loaderText.textContent = "CONNECTING TO GOOGLE SECURE PORTAL...";
                        }
                    };
                });
            }
        }, 40);
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

    // Initial Bindings
    window.addEventListener('hashchange', router);
    window.addEventListener('DOMContentLoaded', () => {
        router();
        initSoundToggle();
        initMusicToggle();
        updateAuthUI();

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

        // Setup Form toggles
        document.getElementById('link-show-register').onclick = showRegister;
        document.getElementById('link-show-forgot').onclick = showForgot;
        document.querySelectorAll('.link-show-login').forEach(el => el.onclick = showLogin);

        // Google sign in click
        const btnGoogleSignin = document.getElementById('btn-google-signin');
        if (btnGoogleSignin) {
            btnGoogleSignin.addEventListener('click', () => {
                playSound(clickSfx);
                simulateGoogleSignIn();
            });
        }

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
                    await authManager.loginUser(userVal, passVal);
                    closeLoginModal();
                    playSound(successSfx);
                } catch (err) {
                    alert("Access Denied: " + err.message);
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
                    await authManager.registerUser(user, email, pass);
                    closeLoginModal();
                    playSound(successSfx);
                    alert("Gamer registration complete. Welcome to the arena!");
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

                try {
                    await authManager.updateGamerProfile(newNick, authManager.getUser().avatar);
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
