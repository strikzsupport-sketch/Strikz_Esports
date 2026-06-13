/* ==========================================================================
   STRIKZ ESPORTS - ROSTER PAGE RENDERER
   ========================================================================== */

(function() {
    function renderTeam(container) {
        const db = window.strikzDb.get();
        const roster = db.roster;

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">THE SQUAD</span>
                    <h2 class="section-title">OFFICIAL <span>ESPORTS TEAM</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Category Filters -->
                <div class="filter-tabs">
                    <button class="filter-tab active" data-category="pro">PRO PLAYERS</button>
                    <button class="filter-tab" data-category="support">COACH & MGMT</button>
                </div>

                <!-- Roster Grid -->
                <div class="grid-4 reveal-stagger" id="roster-grid">
                    <!-- Cards injected by JS -->
                </div>
            </section>
        `;

        const rosterGrid = document.getElementById('roster-grid');

        // Render functions
        function displayRoster(filter) {
            let list = roster;
            if (filter === 'pro') {
                list = roster.filter(p => !p.role.toLowerCase().includes('management') && !p.role.toLowerCase().includes('coach') && !p.role.toLowerCase().includes('manager'));
            } else if (filter === 'support') {
                list = roster.filter(p => p.role.toLowerCase().includes('management') || p.role.toLowerCase().includes('coach') || p.role.toLowerCase().includes('manager'));
            }

            rosterGrid.innerHTML = list.map(player => `
                <div class="player-card">
                    <div class="player-img-box">
                        <img src="${player.avatar}" alt="${player.tag}" class="player-avatar">
                        <span class="player-role-badge">${player.role}</span>
                    </div>
                    <div class="player-details">
                        <h3 class="player-tag">STRIKZ.${player.tag}</h3>
                        <p class="player-real-name">${player.fullName}</p>
                        
                        <div class="player-stats-row">
                            <div>
                                <div class="player-stat-val">${player.kd}</div>
                                <div class="player-stat-lbl">K/D Ratio</div>
                            </div>
                            <div>
                                <div class="player-stat-val">${player.hs}</div>
                                <div class="player-stat-lbl">Headshot %</div>
                            </div>
                            <div>
                                <div class="player-stat-val">${player.matches}</div>
                                <div class="player-stat-lbl">Matches</div>
                            </div>
                        </div>

                        <div class="player-socials">
                            <a href="${player.twitter}" class="player-social-icon" title="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
                            <a href="${player.youtube}" class="player-social-icon" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
                            <a href="${player.instagram}" class="player-social-icon" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Re-trigger reveal states for filtered cards
            setTimeout(() => {
                rosterGrid.classList.add('active');
                rosterGrid.querySelectorAll('.player-card').forEach(card => {
                    card.style.opacity = 1;
                    card.style.transform = 'translateY(0)';
                });
            }, 50);
        }

        // Initial render
        displayRoster('pro');

        // Event Listeners for Filters
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const category = e.target.dataset.category;
                displayRoster(category);
            });
        });
    }

    // Attach to global window
    window.renderTeam = renderTeam;
})();
