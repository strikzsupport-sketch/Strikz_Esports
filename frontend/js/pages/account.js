/* ==========================================================================
   STRIKZ ESPORTS - MY ACCOUNT PAGE RENDERER
   ========================================================================== */

(function() {
    async function renderAccountPage(container) {
        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 80px; margin-bottom: 80px; max-width: 600px; text-align: center;">
                    <div style="padding: 20px 10px;">
                        <i class="fa-solid fa-user-lock" style="font-size: 58px; color: var(--neon-orange); filter: drop-shadow(0 0 12px var(--neon-orange-glow)); margin-bottom: 20px;"></i>
                        <h2 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 10px; letter-spacing: 0.05em;">MY ACCOUNT</h2>
                        <p style="color: var(--text-silver); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            You must log in to your gamer profile to access account configuration, edit your avatar, or manage security.
                        </p>
                        <button class="cta-button btn-neon-orange w-full" id="btn-account-login-trigger" style="padding: 15px;">
                            <i class="fa-solid fa-right-to-bracket"></i> LOGIN TO ARENA
                        </button>
                    </div>
                </section>
            `;
            const btn = document.getElementById('btn-account-login-trigger');
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
        const safeAvatar = user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(user.username);
        
        // List of cool predefined gamer avatars
        const predefinedAvatars = [
            'https://api.dicebear.com/7.x/bottts/svg?seed=strikz1',
            'https://api.dicebear.com/7.x/bottts/svg?seed=strikz2',
            'https://api.dicebear.com/7.x/bottts/svg?seed=strikz3',
            'https://api.dicebear.com/7.x/bottts/svg?seed=strikz4',
            'https://api.dicebear.com/7.x/bottts/svg?seed=strikz5',
            'https://api.dicebear.com/7.x/bottts/svg?seed=strikz6'
        ];

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 800px;">
                <div class="section-header" style="margin-bottom: 35px;">
                    <span class="section-subtitle">GAMER PROFILE CONFIGURATION</span>
                    <h2 class="section-title">MY <span>ACCOUNT</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="grid-2" style="grid-template-columns: 1fr 2fr; gap: 30px; align-items: start;">
                    <!-- LEFT COLUMN: Profile summary -->
                    <div class="glass-panel text-center" style="padding: 30px 20px; border-color: var(--neon-cyan-border); box-shadow: 0 0 15px rgba(0, 240, 255, 0.03);">
                        <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 20px auto; border-radius: 50%; overflow: hidden; border: 2.5px solid var(--neon-cyan); background: rgba(0,0,0,0.4);">
                            <img id="account-page-avatar-preview" src="${safeAvatar}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <h4 class="font-orbitron" style="font-size: 18px; color: #fff; margin-bottom: 5px;">${user.username}</h4>
                        <span style="font-size: 10px; font-weight: bold; background: rgba(0, 242, 254, 0.1); border: 1px solid var(--neon-cyan-border); color: var(--neon-cyan); padding: 3px 10px; border-radius: 4px; font-family: var(--font-header); text-transform: uppercase;">
                            ${user.role || 'Gamer'}
                        </span>
                        
                        <div style="margin-top: 30px; border-top: 1px solid var(--glass-border); padding-top: 20px; text-align: left; display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="font-size: 9px; color: var(--text-dim); display: block; font-family: var(--font-header); letter-spacing: 0.05em; text-transform: uppercase;">Strikz Gamer UID</label>
                                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 8px 12px; border-radius: 4px; font-family: var(--font-header); font-size: 11px; color: var(--neon-yellow); margin-top: 4px;">
                                    <span id="account-uid-text">${user.uid || 'STRIKZ-XXXXXX'}</span>
                                    <button id="btn-account-copy-uid" class="sound-click" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:10px; padding:0;" title="Copy UID">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 9px; color: var(--text-dim); display: block; font-family: var(--font-header); letter-spacing: 0.05em; text-transform: uppercase;">Email Address</label>
                                <span style="font-size: 12px; color: var(--text-silver); display: block; padding-left: 2px; margin-top: 4px;">${user.email || 'N/A'}</span>
                            </div>
                        </div>

                        <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 10px;">
                            ${user.role === 'admin' ? `
                                <a href="#/admin" class="cta-button btn-neon-yellow text-center font-orbitron sound-click" style="display: block; padding: 12px 0; font-size: 11px; width: 100%; color:#000 !important; font-weight:800;">
                                    <i class="fa-solid fa-lock"></i> ADMIN PANEL
                                </a>
                            ` : ''}
                            <button id="btn-account-logout" class="cta-button text-center font-orbitron sound-click w-full" style="padding: 12px 0; font-size: 11px; background: rgba(255, 60, 60, 0.1); border: 1px solid rgba(255, 60, 60, 0.3); color: #ff5f5f;">
                                <i class="fa-solid fa-right-from-bracket"></i> LOG OUT FROM PORTAL
                            </button>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Settings Form -->
                    <div class="glass-panel" style="padding: 35px 30px; border-color: var(--neon-orange-border);">
                        <h4 class="font-orbitron" style="font-size: 14px; color: var(--neon-orange); margin-bottom: 20px; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px;">UPDATE NICK & AVATAR</h4>
                        
                        <form id="account-settings-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 20px;">
                            <div class="form-group">
                                <label>Gamer Tag (Username)</label>
                                <input type="text" id="account-input-username" value="${user.username}" required style="color:#fff;">
                            </div>

                            <div class="form-group">
                                <label>Choose Gamer Avatar</label>
                                <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0;">
                                    ${predefinedAvatars.map(av => `
                                        <div class="avatar-option ${safeAvatar === av ? 'selected' : ''}" data-avatar="${av}" style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; cursor: pointer; border: 2px solid ${safeAvatar === av ? 'var(--neon-orange)' : 'transparent'}; background: rgba(0,0,0,0.3); transition: all 0.2s;">
                                            <img src="${av}" style="width: 100%; height: 100%; object-fit: cover;">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Custom Avatar Image URL</label>
                                <input type="text" id="account-input-avatar-url" placeholder="https://example.com/avatar.jpg" value="${user.avatar || ''}" style="color:#fff;">
                            </div>

                            <button type="submit" class="cta-button btn-neon-orange w-full" style="padding: 15px; margin-top: 10px; font-weight: 800;">
                                SAVE PROFILE CHANGES
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;

        // Handle Avatar Picker selection
        const avatarOptions = container.querySelectorAll('.avatar-option');
        const customAvatarInput = document.getElementById('account-input-avatar-url');
        const avatarPreview = document.getElementById('account-page-avatar-preview');

        avatarOptions.forEach(opt => {
            opt.onclick = function() {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                avatarOptions.forEach(o => o.style.borderColor = 'transparent');
                this.style.borderColor = 'var(--neon-orange)';
                const selectedAvatar = this.dataset.avatar;
                customAvatarInput.value = selectedAvatar;
                avatarPreview.src = selectedAvatar;
            };
        });

        // Copy UID handler
        const copyUidBtn = document.getElementById('btn-account-copy-uid');
        if (copyUidBtn) {
            copyUidBtn.onclick = function() {
                navigator.clipboard.writeText(user.uid || '').then(() => {
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    const icon = copyUidBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fa-solid fa-check';
                        setTimeout(() => { icon.className = 'fa-regular fa-copy'; }, 1500);
                    }
                });
            };
        }

        // Logout handler
        const logoutBtn = document.getElementById('btn-account-logout');
        if (logoutBtn) {
            logoutBtn.onclick = function() {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                window.strikzAuth.logout();
                window.location.hash = '#/';
            };
        }

        // Submit form handler
        const form = document.getElementById('account-settings-form');
        if (form) {
            form.onsubmit = async function(e) {
                e.preventDefault();
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();

                const newUsername = document.getElementById('account-input-username').value.trim();
                const newAvatar = customAvatarInput.value.trim() || predefinedAvatars[0];

                if (!newUsername) {
                    alert("Gamer Tag cannot be left empty.");
                    return;
                }

                try {
                    await window.strikzAuth.updateGamerProfile(newUsername, newAvatar);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Gamer profile updated successfully!");
                    renderAccountPage(container); // Re-render to show updated settings
                } catch (err) {
                    alert("Failed to update profile: " + err.message);
                }
            };
        }
    }

    // Attach to global window
    window.renderAccountPage = renderAccountPage;
})();
