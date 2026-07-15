/* ==========================================================================
   STRIKZ ESPORTS - SPONSORS SHOWCASE & BRAND PROMOTIONS
   ========================================================================== */

(function() {
    function renderSponsorsPage(container) {
        const db = window.strikzDb.get();
        const sponsors = db.sponsors || [];

        // Group sponsors by tier
        const titleSponsors = sponsors.filter(s => s.tier === 'Title');
        const platinumSponsors = sponsors.filter(s => s.tier === 'Platinum');
        const goldSponsors = sponsors.filter(s => s.tier === 'Gold');

        // Sponsored Channels / Promotions
        const sponsoredPromos = sponsors.filter(s => s.tier === 'Ad');

        container.innerHTML = `
            <!-- Page Header -->
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 40px;">
                <div class="section-header">
                    <span class="section-subtitle">OFFICIAL SUPPORT BRANDS</span>
                    <h2 class="section-title">STRIKZ <span>SPONSORS</span></h2>
                    <div class="section-divider"></div>
                </div>
                <p class="text-center" style="max-width: 700px; margin: 0 auto; color: var(--text-silver); font-size: 14px; line-height: 1.6;">
                    Our strategic partners, beverage sponsors, hardware suppliers, and featured community content creators driving the championship ecosystem.
                </p>
            </section>

            <!-- Featured Brand Promotions (Admin promoted channels/links) -->
            ${sponsoredPromos.length > 0 ? `
            <section class="container bg-section-black reveal" style="margin-bottom: 60px;">
                <h3 class="font-orbitron text-center" style="font-size: 16px; color: var(--neon-yellow); letter-spacing: 0.15em; margin-bottom: 25px;"><i class="fa-solid fa-rectangle-ad"></i> AD SPONSORS</h3>
                
                <div class="grid-3" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    ${sponsoredPromos.map(sp => `
                        <div class="glass-panel" style="border: 2px solid var(--neon-orange-border); box-shadow: 0 0 15px rgba(255, 230, 0, 0.08); background: rgba(255, 230, 0, 0.01); display: flex; flex-direction: column; justify-content: space-between; padding: 25px;">
                            <div>
                                <span style="font-size: 9px; font-weight: 800; background: rgba(255, 230, 0, 0.1); border: 1px solid var(--neon-yellow-border); color: var(--neon-yellow); padding: 3px 8px; border-radius: 4px; font-family: var(--font-header); text-transform: uppercase;">
                                    ${sp.promoType || 'Sponsorship'}
                                </span>
                                <h4 class="font-orbitron" style="font-size: 18px; color: #fff; margin-top: 15px; margin-bottom: 8px;">${sp.name}</h4>
                                <p style="font-size: 12px; color: var(--text-silver); line-height: 1.5; margin-bottom: 20px;">
                                    ${sp.description || 'Visit our official brand partner for exclusive details, products, and community events!'}
                                </p>
                            </div>
                            <a href="${sp.link}" target="_blank" class="cta-button btn-neon-orange text-center font-orbitron" style="display: block; padding: 10px 0; font-size: 11px; font-weight: 900;">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> CLICK HERE
                            </a>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Sponsors Tier Boards -->
            <section class="container bg-section-black reveal" style="margin-bottom: 80px;">
                <!-- Title Tier -->
                ${titleSponsors.length > 0 ? `
                <div style="margin-bottom: 50px;">
                    <h3 class="font-orbitron text-center" style="font-size: 16px; color: var(--neon-yellow); letter-spacing: 0.2em; margin-bottom: 25px; text-shadow: 0 0 8px var(--neon-yellow-border);">TITLE PARTNERS</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">
                        ${titleSponsors.map(sp => `
                            <div class="glass-panel" style="min-width: 250px; text-align: center; padding: 35px 20px; border: 1.5px solid var(--neon-yellow); box-shadow: 0 0 20px rgba(255, 230, 0, 0.15); background: rgba(255, 230, 0, 0.02);">
                                <div class="font-orbitron" style="font-size: 22px; font-weight: 900; letter-spacing: 0.1em; color: #fff; min-height: 45px; display: flex; align-items: center; justify-content: center;">
                                    ${sp.logo ? `<img src="${sp.logo}" style="max-height: 45px; max-width: 180px; object-fit: contain;">` : sp.logoText}
                                </div>
                                <div style="font-size: 9px; color: var(--neon-yellow); letter-spacing: 0.15em; font-weight: 800; margin-top: 12px; font-family: var(--font-header);">${sp.partnerType ? sp.partnerType.toUpperCase() : 'OFFICIAL TITLE PARTNER'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Platinum Tier -->
                ${platinumSponsors.length > 0 ? `
                <div style="margin-bottom: 50px;">
                    <h3 class="font-orbitron text-center" style="font-size: 14px; color: var(--neon-orange); letter-spacing: 0.2em; margin-bottom: 25px; text-shadow: 0 0 8px var(--neon-orange-glow);">PLATINUM SPONSORS</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 25px;">
                        ${platinumSponsors.map(sp => `
                            <div class="glass-panel" style="min-width: 210px; text-align: center; padding: 25px 20px; border-color: var(--neon-orange-border); background: rgba(255, 230, 0, 0.01);">
                                <div class="font-orbitron" style="font-size: 18px; font-weight: 800; letter-spacing: 0.08em; color: #fff; min-height: 40px; display: flex; align-items: center; justify-content: center;">
                                    ${sp.logo ? `<img src="${sp.logo}" style="max-height: 40px; max-width: 150px; object-fit: contain;">` : sp.logoText}
                                </div>
                                <div style="font-size: 9px; color: var(--neon-orange); letter-spacing: 0.12em; font-weight: 800; margin-top: 8px; font-family: var(--font-header);">${sp.partnerType ? sp.partnerType.toUpperCase() : 'PLATINUM SPONSOR'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Gold Tier -->
                ${goldSponsors.length > 0 ? `
                <div>
                    <h3 class="font-orbitron text-center" style="font-size: 13px; color: var(--text-dim); letter-spacing: 0.2em; margin-bottom: 25px;">GOLD SPONSORS</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
                        ${goldSponsors.map(sp => `
                            <div class="glass-panel" style="min-width: 180px; text-align: center; padding: 20px 15px; border-color: rgba(255,255,255,0.05);">
                                <div class="font-orbitron" style="font-size: 15px; font-weight: 700; color: var(--text-silver); min-height: 35px; display: flex; align-items: center; justify-content: center;">
                                    ${sp.logo ? `<img src="${sp.logo}" style="max-height: 35px; max-width: 120px; object-fit: contain;">` : sp.logoText}
                                </div>
                                <div style="font-size: 8px; color: var(--text-dim); letter-spacing: 0.1em; font-weight: 700; margin-top: 6px; font-family: var(--font-header);">${sp.partnerType ? sp.partnerType.toUpperCase() : 'GOLD SPONSOR'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </section>
        `;
    }

    // Attach to global window
    window.renderSponsorsPage = renderSponsorsPage;
})();
