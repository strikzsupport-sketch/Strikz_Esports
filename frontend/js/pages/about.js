/* ==========================================================================
   STRIKZ ESPORTS - ABOUT US PAGE RENDERER
   ========================================================================== */

(function() {
    function renderAbout(container) {
        const db = window.strikzDb.get() || {};
        const settings = db.settings || {};
        const history = db.history || [];

        const timelineItemsHTML = history.length ? history.map(item => `
            <div class="timeline-item">
                <span class="timeline-year">${item.year}</span>
                <h4 class="timeline-title">${item.title}</h4>
                <p class="timeline-desc">${item.description}</p>
            </div>
        `).join('') : `
            <div class="timeline-item">
                <span class="timeline-year">JUNE 2022</span>
                <h4 class="timeline-title">The Birth of STRIKZ ESPORTS</h4>
                <p class="timeline-desc">STRIKZ ESPORTS was founded with a vision to discover hidden talent and create opportunities for underdog players to compete, grow, and succeed in esports.</p>
            </div>
            <div class="timeline-item">
                <span class="timeline-year">2023</span>
                <h4 class="timeline-title">Building a Strong Community</h4>
                <p class="timeline-desc">Expanded our network by organizing competitive tournaments and creating a platform where passionate gamers could connect, showcase their skills, and pursue their esports ambitions.</p>
            </div>
            <div class="timeline-item">
                <span class="timeline-year">2024</span>
                <h4 class="timeline-title">Recognition Across Odisha</h4>
                <p class="timeline-desc">Through consistent event management and community engagement, STRIKZ ESPORTS became a trusted name among players, teams, and content creators across Odisha.</p>
            </div>
            <div class="timeline-item">
                <span class="timeline-year">2025</span>
                <h4 class="timeline-title">Empowering the Next Generation</h4>
                <p class="timeline-desc">With free tournaments, competitive events, and a growing esports ecosystem, STRIKZ ESPORTS continues its mission to help aspiring players turn their passion into achievement.</p>
            </div>
        `;

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
                        <p style="color: var(--text-silver); margin-bottom: 18px;">Welcome to STRIKZ ESPORTS, a dedicated esports platform established in 2022 with a vision to discover and empower talented underdog players. Our mission is to create opportunities for aspiring gamers by providing a competitive environment where skill, dedication, and passion can shine.</p>
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
                        <p style="font-size: 12px; color: var(--neon-cyan); letter-spacing: 0.1em; text-transform: uppercase;">Est. ${settings.establishedYear || '2022'} • ${settings.arenaLocation || 'Bermuda Arena'}</p>
                        <div style="border-top: 1px solid var(--glass-border); margin-top: 20px; padding-top: 15px;">
                             <span class="font-orbitron" style="font-size: 32px; font-weight: 900; color: var(--neon-orange);">#1</span>
                            <p style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em;">Ranked Free Fire Guild (Qualifiers)</p>
                        </div>
                    </div>
                </div>
 
                <!-- Organization Timeline -->
                <div class="reveal" style="margin-top: 80px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 30px;">${settings.historyHeading || 'OUR JOURNEY TO GLORY'}</h3>
                    <div class="about-timeline reveal-stagger">
                        ${timelineItemsHTML}
                    </div>
                </div>
            </section>n>
        `;
    }

    // Attach to global window
    window.renderAbout = renderAbout;
})();
