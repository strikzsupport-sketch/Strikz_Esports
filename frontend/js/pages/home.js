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
        const products = db.products || [];

        const activeProducts = products.filter(p => p.enabled !== false);
        const featuredProducts = activeProducts.filter(p => p.featured === true).slice(0, 4);

        const getSavingsPercent = (p) => {
            const reg = parseFloat(p.price) || 0;
            const disc = parseFloat(p.discountedPrice) || reg;
            return reg > 0 ? Math.round(((reg - disc) / reg) * 100) : 0;
        };

        const bestDeals = [...activeProducts]
            .filter(p => p.price && p.discountedPrice)
            .sort((a, b) => getSavingsPercent(b) - getSavingsPercent(a))
            .slice(0, 3);

        const popAi = activeProducts
            .filter(p => p.category === 'AI Tools' || p.category === 'AI')
            .slice(0, 3);

        const popOtt = activeProducts
            .filter(p => p.category === 'OTT' || p.category === 'Streaming')
            .slice(0, 3);

        // Sort tournaments: Open first, then Temporary Close, Slot Full, Closed, Completed, Cancelled
        const sortedTournaments = [...tournaments].sort((a, b) => {
            // Sort by featured first
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;

            const statusOrder = {
                'Open': 1,
                'Temporary Close': 2,
                'Slot Full': 3,
                'Closed': 4,
                'Completed': 5,
                'Cancelled': 6
            };
            const priorityA = statusOrder[a.status] || 10;
            const priorityB = statusOrder[b.status] || 10;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            // Secondary sort: closest start date first
            const dateA = new Date(a.startDate || '9999-12-31').getTime();
            const dateB = new Date(b.startDate || '9999-12-31').getTime();
            return dateA - dateB;
        });
        
        // Find featured tournament for countdown (active first, fallback to first active/open, fallback to first)
        const featuredTourney = sortedTournaments.find(t => t.featured && t.status !== 'Closed' && t.status !== 'Completed') ||
                                sortedTournaments.find(t => t.status === 'Open' || t.status === 'Temporary Close' || t.status === 'Slot Full') ||
                                sortedTournaments[0];

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
                        <div class="countdown-tournament-title font-orbitron" id="countdown-label-slot">
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

            <!-- Subscription Shop Showcase Section -->
            ${activeProducts.length > 0 ? `
            <section class="container reveal" style="margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">STORE DEALS</span>
                    <h2 class="section-title">SUBSCRIBERS <span>MARKET</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Featured Products Grid -->
                ${featuredProducts.length > 0 ? `
                    <div style="margin-bottom: 40px;">
                        <h3 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; font-weight: 800; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px; text-transform: uppercase;">
                            <i class="fa-solid fa-star"></i> FEATURED SUBSCRIPTIONS
                        </h3>
                        <div class="grid-4" style="gap: 20px;">
                            ${featuredProducts.map(p => `
                                <div class="glass-panel text-center" style="padding: 15px; border-color: rgba(0, 240, 255, 0.1); background: rgba(0,0,0,0.25); display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; position: relative;">
                                    ${p.badge && p.badge !== 'none' ? `
                                        <span class="badge-status status-approved font-orbitron" style="position: absolute; top: 10px; left: 10px; font-size: 7.5px; padding: 2px 6px;">${p.badge}</span>
                                    ` : ''}
                                    <div>
                                        <img src="${p.image || 'assets/coming_soon.png'}" style="width: 44px; height: 44px; object-fit: contain; margin: 10px auto; display: block; border-radius: 6px; background: rgba(0,0,0,0.3); padding: 3px; border: 1px solid var(--glass-border);">
                                        <h5 class="font-orbitron" style="font-size: 12px; color: #fff; margin: 8px 0 4px 0; text-transform: uppercase;">${p.name}</h5>
                                        <p style="font-size: 10.5px; color: var(--text-silver); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; margin-bottom: 10px;">${p.description || 'Premium plan'}</p>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: var(--neon-yellow); font-family: var(--font-header); font-weight: bold; margin-bottom: 10px;">INR ${p.discountedPrice || p.price}</div>
                                        <a href="#/shop?product=${p.id}" class="cta-button btn-neon-cyan w-full" style="padding: 6px 8px; font-size: 9.5px; font-weight: 800;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">BUY NOW</a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Best Deals & Category Highlights Grid -->
                <div class="account-grid" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start;">
                    
                    <!-- Left: Best Deals -->
                    ${bestDeals.length > 0 ? `
                        <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03); background: rgba(0,0,0,0.15);">
                            <h3 class="font-orbitron" style="font-size: 13px; color: var(--neon-orange); margin-bottom: 20px; font-weight: 800; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px; text-transform: uppercase;">
                                <i class="fa-solid fa-fire"></i> BEST DISCOUNT DEALS
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${bestDeals.map(p => `
                                    <a href="#/shop?product=${p.id}" class="glass-panel" style="padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; gap: 15px; text-decoration: none; background: rgba(0,0,0,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                                        <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                                            <img src="${p.image || 'assets/coming_soon.png'}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px; border: 1px solid var(--glass-border); padding: 2px; background: rgba(0,0,0,0.3);">
                                            <div>
                                                <h5 class="font-orbitron" style="font-size: 12px; color: #fff; margin: 0; text-transform: uppercase;">${p.name}</h5>
                                                <span style="font-size: 9px; color: var(--text-dim); text-transform: uppercase;">${p.category}</span>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 12px; color: var(--neon-yellow); font-family: var(--font-header); font-weight: bold;">INR ${p.discountedPrice}</div>
                                            <span class="badge-status status-approved font-orbitron" style="font-size: 7.5px; font-weight: 800; padding: 1px 4px; color: var(--neon-green); border-color: rgba(34,197,94,0.25); background: none;">${getSavingsPercent(p)}% OFF</span>
                                        </div>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Right: Popular Tabs Switcher -->
                    <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.03); background: rgba(0,0,0,0.15);">
                        
                        <!-- Tabs Header -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <h3 class="font-orbitron" style="font-size: 13px; color: #fff; margin: 0; font-weight: 800; text-transform: uppercase;">
                                <i class="fa-solid fa-cubes" style="color: var(--neon-cyan);"></i> COMMUNITY FAVORITES
                            </h3>
                            <div style="display: flex; gap: 8px;">
                                <button id="btn-home-shop-tab-ai" class="cta-button" style="padding: 4px 10px; font-size: 9.5px; border-color: var(--neon-cyan-border); color: var(--neon-cyan); background: rgba(0,240,255,0.05);" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">AI TOOLS</button>
                                <button id="btn-home-shop-tab-ott" class="cta-button" style="padding: 4px 10px; font-size: 9.5px; border-color: var(--glass-border); color: var(--text-dim);" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">OTT STREAMING</button>
                            </div>
                        </div>

                        <!-- Tab Content mounts -->
                        <div id="home-shop-tab-content-mount" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Loaded dynamically -->
                        </div>
                    </div>

                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="#/shop" class="cta-button btn-neon-cyan" style="padding: 10px 25px; font-size: 11px;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                        <i class="fa-solid fa-store"></i> VISIT FULL STOREFRONT
                    </a>
                </div>
            </section>
            ` : ''}

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
                    ${sponsors.filter(sp => sp.tier !== 'Ad').map(sp => {
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
                        <a href="${targetUrl}" ${targetAttr} class="sponsor-logo-box" title="${sp.name} (${sp.partnerType ? sp.partnerType : (sp.tier + ' Partner')})" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 60px; padding: 10px;">
                            ${logoHtml}
                            ${sp.logo && sp.name ? `<span style="font-size: 10px; font-weight: 800; font-family: var(--font-header); color: var(--text-dim); letter-spacing: 0.06em; text-transform: uppercase; transition: color 0.3s; display: flex; flex-direction: column; align-items: center;" class="sponsor-name-label">${sp.name} ${sp.partnerType ? `<span style="font-size: 8px; color: var(--neon-orange); font-weight: 600; margin-top: 2px;">${sp.partnerType.toUpperCase()}</span>` : ''}</span>` : ''}
                        </a>
                        `;
                    }).join('')}
                </div>
            </section>
        `;

        // INJECT TOURNAMENT CARDS
        const tournamentsGrid = document.getElementById('home-tournaments-grid');
        const displayedTourneys = sortedTournaments.filter(t => t.status !== 'Cancelled');
        
        if (displayedTourneys.length === 0) {
            tournamentsGrid.innerHTML = `
                <div class="glass-panel text-center" style="grid-column: 1 / -1; padding: 50px;">
                    <p style="color: var(--text-dim);">No active tournaments open for registration currently. Check back soon!</p>
                </div>
            `;
        } else {
            tournamentsGrid.innerHTML = displayedTourneys.map(t => {
                let badgeStyle = '';
                let buttonHtml = '';
                let statusText = t.status;
                
                const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                const isComingSoon = t.status === 'Open' && t.registrationStartDate && todayStr < t.registrationStartDate;
                
                if (isComingSoon) {
                    statusText = 'Coming Soon';
                    badgeStyle = 'background: rgba(255, 165, 0, 0.15); border: 1px solid #ffa500; color: #ffa500;';
                    buttonHtml = `<button class="cta-button w-full" disabled style="cursor: not-allowed; opacity: 0.6; background: rgba(255,255,255,0.05); color: #ffa500; border-color: rgba(255, 165, 0, 0.3); box-shadow: none; font-size: 11px;">REGISTRATION STARTS SOON</button>`;
                } else if (t.status === 'Open') {
                    badgeStyle = 'background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #22c55e;';
                    buttonHtml = `<a href="#/registration" class="cta-button btn-neon-orange w-full btn-register-intercept">REGISTER NOW</a>`;
                } else if (t.status === 'Closed') {
                    badgeStyle = 'background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444;';
                    buttonHtml = `<button class="cta-button w-full" disabled style="cursor: not-allowed; opacity: 0.6; background: rgba(255,255,255,0.05); color: #888; border-color: rgba(255,255,255,0.1); box-shadow: none; font-size: 11px;">REGISTRATIONS CLOSED</button>`;
                } else if (t.status === 'Temporary Close') {
                    badgeStyle = 'background: rgba(255, 165, 0, 0.15); border: 1px solid #ffa500; color: #ffa500;';
                    buttonHtml = `<button class="cta-button w-full" disabled style="cursor: not-allowed; opacity: 0.6; background: rgba(255,255,255,0.05); color: #ffa500; border-color: rgba(255, 165, 0, 0.3); box-shadow: none; font-size: 11px;">TEMPORARILY CLOSED</button>`;
                } else if (t.status === 'Slot Full') {
                    badgeStyle = 'background: rgba(255, 0, 255, 0.15); border: 1px solid #ff00ff; color: #ff00ff;';
                    buttonHtml = `<button class="cta-button w-full" disabled style="cursor: not-allowed; opacity: 0.6; background: rgba(255,255,255,0.05); color: #ff00ff; border-color: rgba(255, 0, 255, 0.3); box-shadow: none; font-size: 11px;">SLOTS FULL</button>`;
                } else if (t.status === 'Completed') {
                    badgeStyle = 'background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #3b82f6;';
                    buttonHtml = `<button class="cta-button w-full" disabled style="cursor: not-allowed; opacity: 0.6; background: rgba(255,255,255,0.05); color: #888; border-color: rgba(255,255,255,0.1); box-shadow: none; font-size: 11px;">CHAMPIONSHIP COMPLETED</button>`;
                } else {
                    badgeStyle = 'background: rgba(156, 163, 175, 0.15); border: 1px solid #9ca3af; color: #9ca3af;';
                    buttonHtml = `<button class="cta-button w-full" disabled style="cursor: not-allowed; opacity: 0.6; background: rgba(255,255,255,0.05); color: #888; border-color: rgba(255,255,255,0.1); box-shadow: none; font-size: 11px;">CANCELLED</button>`;
                }

                return `
                    <div class="tournament-card">
                        <div class="tournament-img-wrap">
                            <img src="${t.image}" alt="${t.name}" class="tournament-img">
                            <span class="tournament-badge" style="${badgeStyle}">${statusText}</span>
                        </div>
                        <div class="tournament-info">
                            <div class="tournament-game">${t.game.toUpperCase()}</div>
                            <h3 class="tournament-name">${t.name}</h3>
                            <div class="tournament-stats-grid">
                                <div class="stat-item"><i class="fa-solid fa-trophy"></i> <span>Pool: ${t.prizePool}</span></div>
                                <div class="stat-item"><i class="fa-solid fa-calendar-days"></i> <span>Starts: ${window.strikzFormatDate(t.startDate)}</span></div>
                                <div class="stat-item"><i class="fa-solid fa-gamepad"></i> <span>Mode: ${t.mode}</span></div>
                                <div class="stat-item"><i class="fa-solid fa-clock"></i> <span>Reg Close: ${window.strikzFormatDate(t.regCloseDate)}</span></div>
                                ${t.registrationStartDate ? `<div class="stat-item" style="grid-column: span 2;"><i class="fa-solid fa-calendar-plus"></i> <span>Reg Open: ${window.strikzFormatDate(t.registrationStartDate)}</span></div>` : ''}
                            </div>
                            ${buttonHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // INITIALIZE COUNTDOWN
        if (featuredTourney) {
            initCountdown(featuredTourney);
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
                if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
                    e.preventDefault();
                    if (window.strikzPlayClickSound) {
                        window.strikzPlayClickSound();
                    }
                    alert("Login first to register squad");
                    if (window.strikzOpenLoginModal) {
                        window.strikzOpenLoginModal();
                    } else {
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) {
                            loginModal.classList.add('active');
                        }
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

        // BIND HOME SHOP TABS
        const btnHomeShopTabAi = document.getElementById('btn-home-shop-tab-ai');
        const btnHomeShopTabOtt = document.getElementById('btn-home-shop-tab-ott');
        const homeShopMount = document.getElementById('home-shop-tab-content-mount');

        if (btnHomeShopTabAi && btnHomeShopTabOtt && homeShopMount) {
            const renderHomeTabList = (list) => {
                if (list.length === 0) {
                    homeShopMount.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-dim); font-size: 11.5px;">No popular subscriptions in this category.</div>`;
                    return;
                }
                homeShopMount.innerHTML = list.map(p => `
                    <a href="#/shop?product=${p.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.015)'" onmouseout="this.style.background='none'" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                        <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
                            <img src="${p.image || 'assets/coming_soon.png'}" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px; border: 1px solid var(--glass-border); padding: 1px; background: rgba(0,0,0,0.3);">
                            <span class="font-orbitron" style="font-size: 12px; color: #fff; font-weight: bold; text-transform: uppercase;">${p.name}</span>
                        </div>
                        <span style="font-size: 11px; color: var(--neon-yellow); font-family: var(--font-header);">INR ${p.discountedPrice || p.price}</span>
                    </a>
                `).join('');
            };

            btnHomeShopTabAi.onclick = function() {
                this.style.borderColor = 'var(--neon-cyan-border)';
                this.style.color = 'var(--neon-cyan)';
                this.style.background = 'rgba(0, 240, 255, 0.05)';

                btnHomeShopTabOtt.style.borderColor = 'var(--glass-border)';
                btnHomeShopTabOtt.style.color = 'var(--text-dim)';
                btnHomeShopTabOtt.style.background = 'none';

                renderHomeTabList(popAi);
            };

            btnHomeShopTabOtt.onclick = function() {
                this.style.borderColor = 'var(--neon-cyan-border)';
                this.style.color = 'var(--neon-cyan)';
                this.style.background = 'rgba(0, 240, 255, 0.05)';

                btnHomeShopTabAi.style.borderColor = 'var(--glass-border)';
                btnHomeShopTabAi.style.color = 'var(--text-dim)';
                btnHomeShopTabAi.style.background = 'none';

                renderHomeTabList(popOtt);
            };

            // Initial Tab Content
            renderHomeTabList(popAi);
        }

        // Subtitle and description are statically defined in the template above.
    }

    function initCountdown(tourney) {
        if (!tourney) return;
        
        const regStartDate = tourney.registrationStartDate ? new Date(tourney.registrationStartDate + 'T00:00:00').getTime() : 0;
        const startDate = new Date(tourney.startDate + 'T00:00:00').getTime();

        function updateClock() {
            const now = new Date().getTime();
            
            let targetDate = startDate;
            let phase = 'live'; // 'coming_soon' or 'live'
            
            if (regStartDate && now < regStartDate) {
                targetDate = regStartDate;
                phase = 'coming_soon';
            }

            const distance = targetDate - now;

            // Update label/indicator dynamically
            const labelContainer = document.getElementById('countdown-label-slot');
            if (labelContainer) {
                if (phase === 'coming_soon') {
                    labelContainer.innerHTML = `<span class="live-indicator" style="background: rgba(255, 165, 0, 0.2); border-color: orange; color: orange; margin-right: 10px;"><span class="live-dot" style="background: orange; box-shadow: 0 0 8px orange;"></span>COMING SOON</span> REGISTRATION STARTS IN: <span style="color:var(--neon-cyan); margin-left: 5px;">${tourney.name.toUpperCase()}</span>`;
                } else {
                    labelContainer.innerHTML = `<span class="live-indicator"><span class="live-dot"></span>LIVE ARENA</span> TOURNAMENT STARTS IN: <span style="color:var(--neon-cyan); margin-left: 5px;">${tourney.name.toUpperCase()}</span>`;
                }
            }

            if (distance < 0) {
                if (phase === 'coming_soon') {
                    // Registration just started, recheck state
                    return;
                }
                
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
