/* ==========================================================================
   STRIKZ ESPORTS - HOME PAGE RENDERER
   ========================================================================== */

(function() {
    // Keep track of countdown interval globally to prevent duplicate ticks
    let countdownInterval = null;

    function renderHome(container) {
        // Clear old intervals
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        const db = window.strikzDb.get();
        const tournaments = db.tournaments || [];
        const allNews = db.news || [];
        const sponsors = db.sponsors || [];
        const socials = db.socialFeed || [];
        
        // Find featured tournament for countdown
        const featuredTourney = tournaments.find(t => t.featured) || tournaments[0];

        // Split news into General News (left) and Notices/Alerts (right)
        const noticesTags = ['notice', 'alert', 'system'];
        const noticeItems = allNews.filter(n => noticesTags.includes(n.tag.toLowerCase()));
        const generalNews = allNews.filter(n => !noticesTags.includes(n.tag.toLowerCase()));

        // RENDER PAGE STRUCTURE
        container.innerHTML = `
            <!-- Hero Section -->
            <section class="hero-section">
                <!-- Background Loop Video -->
                <video class="hero-video-bg" autoplay loop muted playsinline>
                    <source src="assets/hero-bg.mp4" type="video/mp4">
                </video>

                <div class="container hero-container">
                    <img src="assets/logo.png" alt="Strikz Esports Logo" class="hero-logo">
                    <h1 class="hero-title font-orbitron glitch-text" data-text="STRIKZ ESPORTS">STRIKZ <span data-text="ESPORTS">ESPORTS</span></h1>
                    
                    <div class="hero-subtitle-block font-orbitron" id="hero-typewriter-subtitle" style="font-size: 14px; letter-spacing: 0.15em; min-height: auto; padding: 8px 20px; margin-bottom: 35px;">From the Heart of Odisha to the Nation's Biggest Stage</div>
                    
                    <div class="hero-buttons">
                        <a href="#/registration" class="cta-button btn-neon-orange btn-register-intercept">REGISTER SQUAD</a>
                        <a href="#/about" class="cta-button btn-neon-cyan">ABOUT US</a>
                    </div>

                    <!-- EWC-Styled Countdown Clock -->
                    ${featuredTourney ? `
                    <div class="countdown-container-wrap">
                        <div class="countdown-tournament-title font-orbitron">
                            <span class="live-indicator"><span class="live-dot"></span>LIVE ARENA</span>
                            ${featuredTourney.name.toUpperCase()}
                        </div>
                        <div class="countdown-timer-ewc" id="home-countdown">
                            <div class="timer-segment-ewc">
                                <div class="timer-num-box-ewc">
                                    <span class="timer-num-ewc timer-num" id="cd-days">00</span>
                                </div>
                                <span class="timer-lbl-ewc">DAYS</span>
                            </div>
                            <div class="timer-colon-ewc">:</div>
                            <div class="timer-segment-ewc">
                                <div class="timer-num-box-ewc">
                                    <span class="timer-num-ewc timer-num" id="cd-hours">00</span>
                                </div>
                                <span class="timer-lbl-ewc">HOURS</span>
                            </div>
                            <div class="timer-colon-ewc">:</div>
                            <div class="timer-segment-ewc">
                                <div class="timer-num-box-ewc">
                                    <span class="timer-num-ewc timer-num" id="cd-minutes">00</span>
                                </div>
                                <span class="timer-lbl-ewc">MINUTES</span>
                            </div>
                            <div class="timer-colon-ewc">:</div>
                            <div class="timer-segment-ewc">
                                <div class="timer-num-box-ewc">
                                    <span class="timer-num-ewc timer-num" id="cd-seconds">00</span>
                                </div>
                                <span class="timer-lbl-ewc">SECONDS</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Animated Scroll Explore indicator -->
                <div class="scroll-explore" id="scroll-explore-btn">
                    <span class="scroll-text font-orbitron">SCROLL TO EXPLORE</span>
                    <div class="scroll-mouse"><div class="scroll-wheel"></div></div>
                </div>
            </section>

            <!-- Inbox Signals Widget (If Logged In) -->
            <div id="home-inbox-section" class="container reveal hidden" style="margin-bottom: 50px;">
                <div class="glass-panel" style="padding: 25px; border-color: var(--neon-orange-border); background: rgba(255, 94, 0, 0.02); box-shadow: 0 0 20px rgba(255,94,0,0.05);">
                    <h3 class="font-orbitron" style="font-size: 16px; color: #fff; margin-bottom: 15px; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-bell logo-spin-glow" style="color: var(--neon-orange);"></i> ARENA SIGNALS & ALERTS
                    </h3>
                    <div id="home-inbox-mount"></div>
                </div>
            </div>

            <!-- Featured Tournaments Section -->
            <section class="container reveal" style="margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">ACTIVE ARENAS</span>
                    <h2 class="section-title">CHAMPIONSHIP <span>TOURNAMENTS</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="grid-3 reveal-stagger" id="home-tournaments-grid">
                    <!-- Cards injected by JS -->
                </div>
            </section>

            <!-- Split News & Stacked Notices Section -->
            <section class="container reveal" style="margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">UPDATES</span>
                    <h2 class="section-title">NEWS & <span>ANNOUNCEMENTS</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="news-notices-container">
                    <!-- Left: General News -->
                    <div style="display: flex; flex-direction: column; gap: 25px;">
                        ${generalNews.map(item => `
                            <article class="tournament-card" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; min-height: 200px;">
                                <div class="tournament-img-wrap" style="height: 100%; min-height: 200px;">
                                    <img src="${item.image}" alt="${item.title}" class="tournament-img" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div class="tournament-info" style="display: flex; flex-direction: column; justify-content: space-between; padding: 20px;">
                                    <div>
                                        <div class="tournament-game" style="color: var(--neon-orange); margin-bottom: 5px;">${item.tag.toUpperCase()}</div>
                                        <h3 class="tournament-name" style="font-size: 18px; margin-bottom: 10px; line-height: 1.3;">${item.title}</h3>
                                        <p style="font-size: 13px; color: var(--text-silver); line-height: 1.5; margin-bottom: 10px;">${item.summary}</p>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                        <span style="font-size: 11px; color: var(--text-dim);">${item.date}</span>
                                        ${item.redirectLink ? (() => {
                                            let dest = item.redirectLink;
                                            if (dest && dest !== '#' && !dest.startsWith('http://') && !dest.startsWith('https://') && !dest.startsWith('#')) {
                                                dest = 'https://' + dest;
                                            }
                                            return `
                                                <a href="${dest}" target="_blank" class="cta-button btn-neon-orange" style="padding: 6px 14px; font-family: var(--font-header); font-size: 10px; font-weight: 800; border-radius: 4px; color:#000 !important;">
                                                    <i class="${item.contentType === 'Video' ? 'fa-solid fa-play' : 'fa-solid fa-arrow-up-right-from-square'}"></i> 
                                                    CLICK HERE
                                                </a>
                                            `;
                                        })() : `
                                            <a href="#/news" class="btn-neon-cyan" style="padding: 6px 14px; font-family: var(--font-header); font-size: 10px; font-weight: 800; border-radius: 4px;">CLICK HERE</a>
                                        `}
                                    </div>
                                </div>
                            </article>
                        `).join('')}
                    </div>

                    <!-- Right: Stacked Notices -->
                    <div class="glass-panel" style="padding: 25px; border-color: rgba(255, 255, 255, 0.05); height: max-content;">
                        <h3 class="font-orbitron" style="font-size: 15px; color: #fff; margin-bottom: 20px; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;"><i class="fa-solid fa-bell"></i> NOTICES & BROADCASTS</h3>
                        <div class="notices-stack">
                            ${noticeItems.map(item => `
                                <div class="notice-item">
                                    <div class="notice-meta">
                                        <span class="${item.tag.toLowerCase() === 'alert' ? 'notice-tag-alert' : (item.tag.toLowerCase() === 'notice' ? 'notice-tag-info' : 'notice-tag-system')}">${item.tag.toUpperCase()}</span>
                                        <span class="notice-date">${item.date}</span>
                                    </div>
                                    <h4 class="notice-title">${item.title}</h4>
                                    <p class="notice-summary">${item.summary}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Social Media Feed Section -->
            <section class="container reveal" style="margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">COMMUNITY</span>
                    <h2 class="section-title">RECENT <span>POSTS</span></h2>
                    <div class="section-divider"></div>
                </div>
                
                <div class="grid-3 reveal-stagger">
                    ${socials.map(post => {
                        let targetUrl = post.link || post.url || '#';
                        if (targetUrl && targetUrl !== '#' && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                            targetUrl = 'https://' + targetUrl;
                        }
                        const isClickable = targetUrl && targetUrl !== '#';
                        const clickAttr = isClickable ? `onclick="window.open('${targetUrl}', '_blank')"` : '';
                        const styleAttr = isClickable ? 'style="cursor: pointer;"' : '';
                        return `
                        <div class="social-card ${post.platform.toLowerCase()}-card" ${clickAttr} ${styleAttr}>
                            <div class="social-card-header">
                                <span class="social-author">${post.author}</span>
                                <span class="social-platform-badge ${post.platform.toLowerCase()}-badge">
                                    <i class="fa-brands fa-${post.platform.toLowerCase() === 'discord' ? 'discord' : (post.platform.toLowerCase() === 'youtube' ? 'youtube' : 'instagram')}"></i> ${post.platform}
                                </span>
                            </div>
                            <div class="social-body">
                                ${post.content}
                                ${(post.image || post.mediaUrl) ? `
                                <div class="social-post-img-wrap" style="margin-top: 12px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
                                    <img src="${post.image || post.mediaUrl}" alt="Community Post Image" style="width: 100%; height: auto; display: block; object-fit: cover; max-height: 200px;">
                                </div>
                                ` : ''}
                            </div>
                            <div class="social-footer">
                                <span class="social-likes"><i class="fa-solid fa-heart"></i> ${post.likes}</span>
                                <span>${window.strikzFormatDate(post.date)}</span>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </section>

            <!-- Management Showcase (Leadership) -->
            <section class="container bg-section-black reveal" style="margin-bottom: 80px; padding: 30px; border-radius: 8px; border: 1px solid var(--glass-border);">
                <div class="section-header">
                    <span class="section-subtitle">THE LEADERSHIP</span>
                    <h2 class="section-title">MANAGEMENT <span>MEMBERS</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="grid-3 reveal-stagger">
                    ${(db.management || []).map(m => {
                        const instagram = (m.socials && m.socials.instagram) || m.instagram || '#';
                        const youtube = (m.socials && m.socials.youtube) || m.youtube || '#';
                        return `
                        <div class="glass-panel text-center" style="padding: 25px; border-color: rgba(255,255,255,0.03);">
                            <img src="${m.avatar}" alt="${m.name}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--neon-yellow); margin: 0 auto 15px auto; box-shadow:0 0 10px rgba(255,230,0,0.2);">
                            <h4 class="font-orbitron" style="font-size: 15px; color: #fff; margin-bottom: 4px;">${m.name}</h4>
                            <div style="font-size: 10px; color: var(--neon-orange); font-weight: 800; font-family: var(--font-header); letter-spacing: 0.05em; margin-bottom: 12px; text-transform: uppercase;">
                                ${m.role}
                            </div>
                            <p style="font-size: 12px; color: var(--text-silver); line-height: 1.4; text-align: left; margin-bottom: 12px;">${m.bio}</p>
                            <div style="display:flex; justify-content:center; gap:10px;">
                                <a href="${instagram}" target="_blank" style="color:var(--text-dim); font-size:14px;"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${youtube}" target="_blank" style="color:var(--text-dim); font-size:14px;"><i class="fa-brands fa-youtube"></i></a>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </section>

            <!-- Partners Showcase (Slider Bottom) -->
            <section class="sponsors-showcase">
                <div class="sponsors-title font-orbitron">OFFICIAL PARTNERS</div>
                <div class="sponsors-grid">
                    ${sponsors.map(sp => {
                        let targetUrl = sp.link || sp.website || '#';
                        if (targetUrl && targetUrl !== '#' && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                            targetUrl = 'https://' + targetUrl;
                        }
                        const isExternal = targetUrl.startsWith('http');
                        const targetAttr = isExternal ? 'target="_blank"' : '';
                        const logoHtml = sp.logo
                            ? `<img src="${sp.logo}" alt="${sp.name} Logo" style="max-height: 45px; max-width: 150px; object-fit: contain; filter: grayscale(1); transition: filter 0.3s;" onmouseover="this.style.filter='grayscale(0)'" onmouseout="this.style.filter='grayscale(1)'">`
                            : `<div style="font-family: var(--font-header); font-size: 16px; font-weight: 900; letter-spacing: 0.1em; color: var(--text-silver); text-shadow: 0 0 5px rgba(255,255,255,0.1); border: 1px solid var(--glass-border); padding: 8px 18px; border-radius: 4px; background: rgba(255,255,255,0.01);">${sp.logoText}</div>`;
                        return `
                        <a href="${targetUrl}" ${targetAttr} class="sponsor-logo-box" title="${sp.name} (${sp.tier} Partner)" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 60px; padding: 10px;">
                            ${logoHtml}
                            ${sp.logo && sp.name ? `<span style="font-size: 10px; font-weight: 800; font-family: var(--font-header); color: var(--text-dim); letter-spacing: 0.06em; text-transform: uppercase; transition: color 0.3s;" class="sponsor-name-label">${sp.name}</span>` : ''}
                        </a>
                        `;
                    }).join('')}
                </div>
            </section>
        `;

        // INJECT TOURNAMENT CARDS
        const tournamentsGrid = document.getElementById('home-tournaments-grid');
        const openTourneys = tournaments.filter(t => t.status === 'Open');
        
        if (openTourneys.length === 0) {
            tournamentsGrid.innerHTML = `
                <div class="glass-panel text-center" style="grid-column: 1 / -1; padding: 50px;">
                    <p style="color: var(--text-dim);">No active tournaments open for registration currently. Check back soon!</p>
                </div>
            `;
        } else {
            tournamentsGrid.innerHTML = openTourneys.map(t => `
                <div class="tournament-card">
                    <div class="tournament-img-wrap">
                        <img src="${t.image}" alt="${t.name}" class="tournament-img">
                        <span class="tournament-badge">${t.status}</span>
                    </div>
                    <div class="tournament-info">
                        <div class="tournament-game">${t.game.toUpperCase()}</div>
                        <h3 class="tournament-name">${t.name}</h3>
                        <div class="tournament-stats-grid">
                            <div class="stat-item"><i class="fa-solid fa-trophy"></i> <span>Pool: ${t.prizePool}</span></div>
                            <div class="stat-item"><i class="fa-solid fa-calendar-days"></i> <span>Starts: ${window.strikzFormatDate(t.startDate)}</span></div>
                            <div class="stat-item"><i class="fa-solid fa-gamepad"></i> <span>Mode: ${t.mode}</span></div>
                            <div class="stat-item"><i class="fa-solid fa-clock"></i> <span>Reg Close: ${window.strikzFormatDate(t.regCloseDate)}</span></div>
                        </div>
                        <a href="#/registration" class="cta-button btn-neon-orange w-full btn-register-intercept">REGISTER NOW</a>
                    </div>
                </div>
            `).join('');
        }

        // INITIALIZE COUNTDOWN
        if (featuredTourney) {
            initCountdown(featuredTourney.startDate);
        }

        // BIND SCROLL EXPLORE CLICK BEHAVIOR
        const scrollBtn = document.getElementById('scroll-explore-btn');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                const nextSection = document.querySelector('.hero-section').nextElementSibling;
                if (nextSection) {
                    nextSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // INTERCEPT REGISTRATION CLICKS AND FORBID LOGGED-OUT USERS
        document.querySelectorAll('.btn-register-intercept').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (!window.strikzAuth.isLoggedIn()) {
                    e.preventDefault();
                    if (window.strikzPlayClickSound) {
                        window.strikzPlayClickSound();
                    }
                    const loginModal = document.getElementById('login-modal');
                    if (loginModal) {
                        loginModal.classList.add('active');
                    }
                }
            });
        });

        // FETCH AND RENDER HOME INBOX ALERTS
        if (window.strikzAuth && window.strikzAuth.isLoggedIn()) {
            window.strikzDb.getMyTeamInbox().then(res => {
                const inbox = res.inbox || [];
                const section = document.getElementById('home-inbox-section');
                const mount = document.getElementById('home-inbox-mount');
                if (section && mount) {
                    if (inbox.length > 0) {
                        section.classList.remove('hidden');
                        if (window.renderInboxTab) {
                            window.renderInboxTab(mount, inbox, container);
                        }
                    } else {
                        section.classList.add('hidden');
                    }
                }
            }).catch(err => {
                console.error("Home inbox fetch error:", err);
            });
        }

        // Subtitle and description are statically defined in the template above.
    }

    function initCountdown(targetDateStr) {
        const targetDate = new Date(targetDateStr + 'T00:00:00').getTime();

        function updateClock() {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                if (countdownInterval) clearInterval(countdownInterval);
                const container = document.getElementById('home-countdown');
                if (container) {
                    container.innerHTML = `<div style="font-family: var(--font-header); font-size: 20px; color: var(--neon-orange); font-weight: 800; padding: 10px;">TOURNAMENT UNDERWAY!</div>`;
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const daysEl = document.getElementById('cd-days');
            const hoursEl = document.getElementById('cd-hours');
            const minsEl = document.getElementById('cd-minutes');
            const secsEl = document.getElementById('cd-seconds');

            if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
            if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
        }

        updateClock();
        countdownInterval = setInterval(updateClock, 1000);
    }

    // Attach to global window
    window.renderHome = renderHome;
})();
