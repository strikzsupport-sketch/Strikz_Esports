/* ==========================================================================
   STRIKZ ESPORTS - ABOUT US PAGE RENDERER
   ========================================================================== */

(function() {
    function renderAbout(container) {
        const db = window.strikzDb.get() || {};
        const settings = db.settings || {};
        // Sort and group winners
        let history = db.history || [];
        if (history.length === 0) {
            history = [
                { id: 'mock-1', rank: 1, tournamentName: 'FFIC Indian Championship', date: 'October 2025', title: 'STRIKZ ESPORTS', description: 'Booyah! Champions - $80,000 USD Prize Pool', logo: 'assets/logo.png', type: 'recent' },
                { id: 'mock-2', rank: 2, tournamentName: 'FFIC Indian Championship', date: 'October 2025', title: 'TEAM STORM', description: 'Runner Up - $30,000 USD', logo: '', type: 'recent' },
                { id: 'mock-3', rank: 3, tournamentName: 'FFIC Indian Championship', date: 'October 2025', title: 'VIPER CLAN', description: '3rd Place - $15,000 USD', logo: '', type: 'recent' },
                { id: 'mock-4', rank: 1, tournamentName: 'Odisha Scrims Cup V2', date: 'June 2024', title: 'STRIKZ ESPORTS', description: 'Champions - $5,000 USD', logo: 'assets/logo.png', type: 'past' },
                { id: 'mock-5', rank: 2, tournamentName: 'Odisha Scrims Cup V2', date: 'June 2024', title: 'TEAM REBEL', description: 'Runner Up - $2,000 USD', logo: '', type: 'past' }
            ];
        }

        const recentWinners = history.filter(w => w.type === 'recent').sort((a, b) => (a.rank || 99) - (b.rank || 99));
        const pastWinners = history.filter(w => w.type === 'past').sort((a, b) => {
            const dateA = a.date || a.year || '';
            const dateB = b.date || b.year || '';
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            return (a.rank || 99) - (b.rank || 99);
        });

        const recentChampion = recentWinners.find(w => w.rank === 1) || recentWinners[0];
        const recentRunnersUp = recentWinners.filter(w => w !== recentChampion);

        const championLogo = recentChampion && recentChampion.logo 
            ? `<img src="${recentChampion.logo}" alt="${recentChampion.title} Logo" style="max-height: 140px; max-width: 140px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));">`
            : `<div style="width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.03); border: 2px dashed #d4af37; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #d4af37; text-shadow: 0 0 10px rgba(212,175,55,0.5);"><i class="fa-solid fa-crown"></i></div>`;

        const championHTML = recentChampion ? `
            <div class="champion-banner glass-panel" style="display: flex; align-items: center; gap: 40px; padding: 40px; border: 2px solid #d4af37; background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 10, 15, 0.8) 100%); box-shadow: 0 0 30px rgba(212, 175, 55, 0.25); border-radius: 12px; margin-bottom: 40px; position: relative; overflow: hidden; flex-wrap: wrap; justify-content: center; text-align: left; transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;">
                <div style="position: absolute; top: -10px; right: -10px; font-size: 120px; color: rgba(212,175,55,0.04); font-weight: 900; font-family: var(--font-header); pointer-events: none; z-index: 0; text-transform: uppercase;">01</div>
                <div style="z-index: 1; flex-shrink: 0;">
                    ${championLogo}
                </div>
                <div style="z-index: 1; flex: 1; min-width: 250px;">
                    <span class="font-orbitron" style="font-size: 11px; background: #d4af37; color: #000; padding: 4px 10px; border-radius: 4px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; box-shadow: 0 0 10px rgba(212,175,55,0.4); display: inline-block; margin-bottom: 15px;"><i class="fa-solid fa-crown"></i> CHAMPION (1ST PLACE)</span>
                    <h4 class="font-orbitron" style="font-size: 32px; font-weight: 900; color: #fff; margin-bottom: 8px; text-shadow: 0 0 8px rgba(255,255,255,0.2);">${recentChampion.title}</h4>
                    <span class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); letter-spacing: 0.05em; display: block; margin-bottom: 8px;"><strong>${recentChampion.tournamentName || '—'}</strong></span>
                    <span style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 12px; font-weight: 500;">DATE: ${recentChampion.date || recentChampion.year || '—'}</span>
                    <p style="font-size: 16px; color: var(--text-silver); margin: 0; line-height: 1.6;">${recentChampion.description}</p>
                </div>
            </div>
        ` : '';

        function renderWinnerCard(w) {
            const logoHtml = w.logo 
                ? `<img src="${w.logo}" alt="${w.title} Logo" style="max-height: 70px; max-width: 70px; object-fit: contain; filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2));">`
                : `<div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.02); border: 1.5px dashed var(--text-dim); display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--text-dim);"><i class="fa-solid fa-shield"></i></div>`;
            
            let rankText = `#${w.rank}`;
            let badgeBg = 'rgba(255,255,255,0.07)';
            let badgeColor = 'var(--text-silver)';
            if (w.rank === 1) {
                rankText = '1ST PLACE';
                badgeBg = 'rgba(212, 175, 55, 0.15)';
                badgeColor = '#ffd700';
            } else if (w.rank === 2) {
                rankText = '2ND PLACE';
                badgeBg = 'rgba(192, 192, 192, 0.15)';
                badgeColor = '#e0e0e0';
            } else if (w.rank === 3) {
                rankText = '3RD PLACE';
                badgeBg = 'rgba(205, 127, 50, 0.15)';
                badgeColor = '#cd7f32';
            } else {
                rankText = `${w.rank}TH PLACE`;
            }

            return `
            <div class="glass-panel" style="padding: 25px; border-color: rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: space-between; transition: transform 0.3s ease, border-color 0.3s ease; height: 100%;">
                <div style="width: 100%;">
                    <span class="font-orbitron" style="font-size: 9px; background: ${badgeBg}; color: ${badgeColor}; padding: 3px 8px; border-radius: 3px; font-weight: 800; letter-spacing: 0.1em; display: inline-block; margin-bottom: 15px;">${rankText}</span>
                    <div style="height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        ${logoHtml}
                    </div>
                    <h5 class="font-orbitron" style="font-size: 18px; color: #fff; margin-bottom: 6px; letter-spacing: 0.05em;">${w.title}</h5>
                    <span class="font-orbitron" style="font-size: 12px; color: var(--neon-cyan); letter-spacing: 0.05em; display: block; margin-bottom: 4px; font-weight: bold;">${w.tournamentName || '—'}</span>
                    <span style="font-size: 10px; color: var(--text-dim); display: block; margin-bottom: 12px;">${w.date || w.year || '—'}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-dim); margin: 0; line-height: 1.5; width: 100%;">${w.description}</p>
            </div>
            `;
        }

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">WHO WE ARE</span>
                    <h2 class="section-title">ABOUT <span>STRIKZ ESPORTS</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="about-grid reveal-stagger">
                    <div>
                        <h3 class="font-orbitron" style="font-size: 22px; color: var(--neon-cyan); margin-bottom: 15px;">DOMINATING THE BATTLE ROYALE ARENA</h3>
                        <p style="color: var(--text-silver); margin-bottom: 18px;">Welcome to STRIKZ ESPORTS, a dedicated esports platform established in ${settings.establishedYear || '2022'} with a vision to discover and empower talented underdog players. Our mission is to create opportunities for aspiring gamers by providing a competitive environment where skill, dedication, and passion can shine.</p>
                        <p style="color: var(--text-silver); margin-bottom: 30px;">At STRIKZ ESPORTS, we organize free tournaments, LAN events, and competitive gaming experiences designed to help players showcase their talent and take meaningful steps toward their esports goals. Backed by a passionate team of esports enthusiasts, we are committed to building a supportive and professional community where every player has a chance to grow, compete, and succeed.</p>
                        
                        <div class="grid-2">
                            <div class="glass-panel" style="padding: 20px;">
                                <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 14px; margin-bottom: 8px;"><i class="fa-solid fa-crosshairs"></i> OUR MISSION</h4>
                                <p style="font-size: 13px; color: var(--text-silver);">Our mission is to discover and support talented underdog gamers by providing free tournaments, LAN events, and competitive opportunities that help them develop their skills, gain recognition, and achieve their esports dreams</p>
                            </div>
                            <div class="glass-panel" style="padding: 20px;">
                                <h4 class="font-orbitron" style="color: var(--neon-cyan); font-size: 14px; margin-bottom: 8px;"><i class="fa-solid fa-eye"></i> OUR VISION</h4>
                                <p style="font-size: 13px; color: var(--text-silver);">Our vision is to build a leading esports ecosystem where every talented player, regardless of background, has equal opportunities to compete, grow, and transform their passion for gaming into success.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-panel" style="text-align: center; border-color: var(--neon-cyan-border); box-shadow: 0 0 15px rgba(0, 240, 255, 0.05);">
                        <img src="assets/logo.png" alt="Strikz Shield" style="max-height: 180px; margin: 0 auto 20px auto;">
                        <h4 class="font-orbitron" style="font-size: 18px; margin-bottom: 6px;">STRIKZ ESPORTS ARENA</h4>
                        <p style="font-size: 12px; color: var(--neon-cyan); letter-spacing: 0.1em; text-transform: uppercase;">Est. ${settings.establishedYear || '2022'} • ${settings.arenaLocation || 'BHUBANESWAR, ODISHA'}</p>
                        <div style="border-top: 1px solid var(--glass-border); margin-top: 20px; padding-top: 15px;">
                             <span class="font-orbitron" style="font-size: 32px; font-weight: 900; color: var(--neon-orange);">#1</span>
                            <p style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em;">Ranked Free Fire Guild (Qualifiers)</p>
                        </div>
                    </div>
                </div>
 
                <!-- Winners Board Section -->
                <div class="reveal" style="margin-top: 80px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 30px;">${settings.historyHeading || 'TOURNAMENT WINNERS BOARD'}</h3>
                    <div class="winners-board-container" style="max-width: 1000px; margin: 0 auto;">
                        
                        <!-- Recent Tournament section -->
                        ${championHTML}
                        ${recentRunnersUp.length ? `
                        <div style="margin-top: 30px; margin-bottom: 50px;">
                            <h4 class="font-orbitron" style="font-size: 14px; color: var(--neon-cyan); letter-spacing: 0.1em; margin-bottom: 20px; border-left: 3px solid var(--neon-cyan); padding-left: 10px; text-align: left;">RECENT TOURNAMENT RUNNERS UP</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
                                ${recentRunnersUp.map(w => renderWinnerCard(w)).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Past Tournaments section -->
                        ${pastWinners.length ? `
                        <div style="margin-top: 60px;">
                            <h4 class="font-orbitron" style="font-size: 14px; color: var(--neon-orange); letter-spacing: 0.1em; margin-bottom: 20px; border-left: 3px solid var(--neon-orange); padding-left: 10px; text-align: left;">PAST TOURNAMENT CHAMPIONS & STANDINGS</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
                                ${pastWinners.map(w => renderWinnerCard(w)).join('')}
                            </div>
                        </div>
                        ` : ''}

                    </div>
                </div>
            </section>
        `;
    }

    // Attach to global window
    window.renderAbout = renderAbout;
})();
