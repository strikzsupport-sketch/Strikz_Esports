/* ==========================================================================
   STRIKZ ESPORTS - WINNERS PAGE RENDERER
   ========================================================================== */

(function() {
    function renderAchievements(container) {
        const db = window.strikzDb.get();
        const trophies = db.achievements || [];

        // Check if there are any trophies
        if (trophies.length === 0) {
            container.innerHTML = `
                <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                    <div class="section-header">
                        <span class="section-subtitle">CHAMPIONSHIP WINNERS</span>
                        <h2 class="section-title">WINNER <span>SPOTLIGHT</span></h2>
                        <div class="section-divider"></div>
                    </div>
                    <div class="glass-panel text-center" style="padding: 60px 20px;">
                        <p style="color: var(--text-dim);">No championship winners recorded in the cabinet yet. Check back soon!</p>
                    </div>
                </section>
            `;
            return;
        }

        // Helper to render a tournament's standings and winner spotlight
        function renderTrophyAnnouncement(tr) {
            const winners = tr.winnersList || [];
            if (!winners.length) {
                // Fallback to simple old-style card
                return `
                    <div class="glass-panel trophy-card ${tr.tier === 'gold' ? '' : (tr.tier === 'silver' ? 'silver-trophy' : 'bronze-trophy')}" style="border-radius: var(--border-radius-lg); margin-bottom: 30px;">
                        <div class="trophy-icon">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <h3 class="trophy-title font-orbitron">${tr.title}</h3>
                        <div class="trophy-event font-orbitron">${tr.event}</div>
                        <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 15px;">Date Secured: ${window.strikzFormatDate(tr.date)}</p>
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; display: inline-block;">
                            <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-family: var(--font-header);">Reward: </span>
                            <span style="font-size: 12px; font-weight: 700; color: var(--neon-green);">${tr.reward}</span>
                        </div>
                    </div>
                `;
            }

            // Sort by rank ascending
            const sortedWinners = [...winners].sort((a, b) => a.rank - b.rank);
            const rank1 = sortedWinners.find(w => w.rank === 1) || { teamName: tr.teamName, prize: tr.reward, tier: 'gold' };
            const runnersUp = sortedWinners.filter(w => w.rank > 1);

            // Color mapper for tiers
            const getTierColor = (tier) => {
                if (!tier) return { bg: 'rgba(255,255,255,0.05)', text: '#9ca3af', border: 'rgba(255,255,255,0.1)' };
                switch(tier.toLowerCase()) {
                    case 'diamond':
                        return { bg: 'rgba(0,240,255,0.15)', text: '#00f0ff', border: '#00f0ff' };
                    case 'platinum':
                        return { bg: 'rgba(226,232,240,0.15)', text: '#e2e8f0', border: '#e2e8f0' };
                    case 'gold':
                        return { bg: 'rgba(255,230,0,0.15)', text: '#ffe600', border: '#ffe600' };
                    case 'silver':
                        return { bg: 'rgba(161,161,170,0.15)', text: '#a1a1aa', border: '#a1a1aa' };
                    case 'bronze':
                        return { bg: 'rgba(180,83,9,0.15)', text: '#f59e0b', border: '#d97706' };
                    default:
                        return { bg: 'rgba(255,255,255,0.05)', text: '#9ca3af', border: 'rgba(255,255,255,0.1)' };
                }
            };

            const rank1LogoHtml = rank1.teamLogo 
                ? `<img src="${rank1.teamLogo}" alt="${rank1.teamName}" style="width:96px; height:96px; border-radius:50%; border:2px solid var(--neon-yellow); box-shadow:0 0 20px rgba(255,230,0,0.4); object-fit:contain; background:rgba(0,0,0,0.6); padding:8px; margin-bottom:15px;">`
                : `<div style="width:96px; height:96px; border-radius:50%; border:2px solid var(--neon-yellow); box-shadow:0 0 20px rgba(255,230,0,0.4); background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; margin: 0 auto 15px auto;"><i class="fa-solid fa-crown" style="font-size:36px; color:var(--neon-yellow);"></i></div>`;

            const rank1BadgeColors = getTierColor(rank1.tier || 'gold');
            const rank1BadgeHtml = `<span style="background:${rank1BadgeColors.bg}; color:${rank1BadgeColors.text}; border:1px solid ${rank1BadgeColors.border}; border-radius:12px; padding:2px 10px; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">${rank1.tier ? rank1.tier.toUpperCase() : 'GOLD'} TIER</span>`;

            // Render Runners Up rows / grid
            let runnersUpHtml = '';
            if (runnersUp.length > 0) {
                runnersUpHtml = `
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px; margin-top: 25px;">
                        <h5 class="font-orbitron" style="font-size: 11px; color: var(--text-dim); margin-bottom: 15px; letter-spacing: 0.1em; text-align: left;">STANDINGS & RUNNERS UP</h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
                            ${runnersUp.map(w => {
                                const tc = getTierColor(w.tier);
                                const logoImg = w.teamLogo 
                                    ? `<img src="${w.teamLogo}" alt="${w.teamName}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); padding: 4px; object-fit: contain;">`
                                    : `<div style="width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-shield-halved" style="font-size:14px; color:var(--text-dim);"></i></div>`;
                                return `
                                <div class="glass-panel" style="padding: 12px; display: flex; align-items: center; justify-content: space-between; border-color: rgba(255,255,255,0.02); background: rgba(0,0,0,0.15); border-radius: 6px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        ${logoImg}
                                        <div style="text-align: left;">
                                            <h6 style="font-size: 12px; color: #fff; margin: 0; font-weight:700;">#${w.rank} ${w.teamName}</h6>
                                            <span style="font-size: 9px; color: ${tc.text}; text-transform: uppercase; font-weight:800;">${w.tier || 'NO TIER'}</span>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 11px; font-weight: 800; color: var(--neon-green);">${w.prize || '—'}</div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            return `
                <div class="glass-panel" style="border: 1px solid var(--neon-cyan-border); box-shadow: 0 0 25px rgba(255, 230, 0, 0.04); margin-bottom: 50px; padding: 0; border-radius: var(--border-radius-lg); overflow: hidden;">
                    <!-- Champion Banner -->
                    <div style="position: relative; height: 350px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img src="${tr.image || 'assets/tournament_banner.png'}" alt="${tr.event}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.65);">
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, #050505 0%, rgba(5,5,5,0.7) 50%, rgba(5,5,5,0.2) 100%); z-index: 1;"></div>
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 30px; box-sizing: border-box; z-index: 2;">
                            ${rank1LogoHtml}
                            <div style="margin-bottom: 6px;">
                                ${rank1BadgeHtml}
                            </div>
                            <h3 class="font-orbitron" style="font-size: 32px; font-weight: 900; line-height: 1.1; margin: 4px 0 8px; text-transform: uppercase; text-shadow: 0 0 15px rgba(255, 230, 0, 0.3); color: #fff;">
                                ${rank1.teamName}
                            </h3>
                            <p style="color: var(--neon-cyan); font-family: var(--font-header); font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin: 0;">
                                ${tr.event} &bull; ${window.strikzFormatDate(tr.date)}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Highlights and Standings Grid -->
                    <div style="padding: 30px; background: #080808;">
                        <div class="achievements-highlight-grid" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; margin-bottom: 0;">
                            <div style="text-align: left;">
                                <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 12px; margin-bottom: 10px; letter-spacing: 0.05em; font-weight: 800;">TOURNAMENT SUMMARY</h4>
                                <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin: 0;">
                                    ${tr.details || 'Standings announced for this competitive tournament event.'}
                                </p>
                            </div>
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 18px; border-radius: 6px; display: flex; flex-direction: column; justify-content: center; text-align: left;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 8px;">
                                    <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-family: var(--font-header); font-weight: 700;">CHAMPION REWARD:</span>
                                    <span style="font-size: 14px; font-weight: 900; color: var(--neon-green);">${rank1.prize || tr.reward}</span>
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; display: block; margin-bottom: 4px; font-family: var(--font-header); font-weight: 700;">EVENT TITLE:</span>
                                    <span class="font-orbitron" style="font-size: 14px; font-weight: 800; color: #fff; letter-spacing: 0.02em;">${tr.title}</span>
                                </div>
                            </div>
                        </div>
                        ${runnersUpHtml}
                    </div>
                </div>
            `;
        }

        // The first index is the latest tournament standings
        const latest = trophies[0];
        const pastWinners = trophies.slice(1);

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">CHAMPIONSHIP WINNERS</span>
                    <h2 class="section-title">CHAMPIONS <span>SPOTLIGHT</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Latest Winner Hero Standings Banner -->
                ${renderTrophyAnnouncement(latest)}

                <!-- Past Winners Cabinet Grid -->
                ${pastWinners.length > 0 ? `
                <div style="margin-top: 60px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 45px; letter-spacing: 0.05em;">PAST CHAMPIONSHIPS</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 30px;">
                        ${pastWinners.map(tr => renderTrophyAnnouncement(tr)).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Milestones / Roadmap -->
                <div class="reveal" style="margin-top: 80px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 40px; letter-spacing: 0.05em;">STRIKZ CLUB MILESTONES</h3>
                    
                    <div class="grid-2 reveal-stagger">
                        <div class="glass-panel" style="padding: 24px;">
                            <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-users"></i> 10,000+ DISCORD SURVIVORS</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Our official community server surpassed 10k members, serving as the main recruitment ground for Free Fire Max scrims and team matching.</p>
                        </div>
                        <div class="glass-panel" style="padding: 24px;">
                            <h4 class="font-orbitron" style="color: var(--neon-cyan); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-bolt"></i> GARENA LEVEL 4 GUILD</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Achieved Level 4 Guild status in-game, unlocking premium benefits, regional leaderboard multipliers, and guild showdown entries.</p>
                        </div>
                        <div class="glass-panel" style="padding: 24px; margin-top: 20px;">
                            <h4 class="font-orbitron" style="color: var(--neon-cyan); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-tv"></i> 5,000,000+ STREAM VIEWS</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Cumulative streaming views across tournament showcases, pro scrim channels, and YouTube highlights reached 5M views.</p>
                        </div>
                        <div class="glass-panel" style="padding: 24px; margin-top: 20px;">
                            <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-handshake"></i> RED BULL TITLE SPONSORSHIP</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Signed our landmark title sponsorship deal, securing advanced bootcamp facilities, travel funding, and gear support.</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // Attach to global window
    window.renderAchievements = renderAchievements;
})();
