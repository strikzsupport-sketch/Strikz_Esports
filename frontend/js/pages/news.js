/* ==========================================================================
   STRIKZ ESPORTS - NEWS PAGE RENDERER
   ========================================================================== */

(function() {
    function renderNews(container) {
        const db = window.strikzDb.get();
        const news = db.news;

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">COMMUNITY BLOG</span>
                    <h2 class="section-title">NEWS & <span>ANNOUNCEMENTS</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Search & Filters -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; gap: 20px; flex-wrap: wrap;">
                    <div style="display: flex; gap: 10px;">
                        <button class="filter-tab active" id="news-filter-all">ALL NEWS</button>
                        <button class="filter-tab" id="news-filter-t">TOURNAMENTS</button>
                        <button class="filter-tab" id="news-filter-r">ROSTER</button>
                    </div>
                    <div>
                        <input type="text" id="news-search" placeholder="Search articles..." style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 4px; padding: 10px 16px; font-size: 14px; color: #fff; width: 250px;">
                    </div>
                </div>

                <!-- News Grid -->
                <div class="grid-3 reveal-stagger" id="news-list-grid">
                    <!-- Cards loaded dynamically -->
                </div>
            </section>

            <!-- News Reader Modal -->
            <div class="lightbox" id="news-reader-modal" style="padding: 20px;">
                <span class="lightbox-close" id="reader-close-btn">&times;</span>
                <div class="glass-panel" style="max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto; border-color: var(--neon-cyan-border); box-shadow: 0 0 25px rgba(0, 240, 255, 0.15);">
                    <div style="height: 250px; overflow: hidden; border-radius: var(--border-radius-sm); margin-bottom: 20px;">
                        <img id="reader-img" src="" alt="Header Image" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <span id="reader-tag" class="badge-status status-pending" style="font-size: 10px; margin-bottom: 10px;">TAG</span>
                    <h3 id="reader-title" class="font-orbitron" style="font-size: 22px; margin-bottom: 6px; color: #fff;">TITLE</h3>
                    <p id="reader-date" style="font-size: 12px; color: var(--text-dim); margin-bottom: 20px;">DATE</p>
                    <div id="reader-content" style="color: var(--text-silver); font-size: 15px; line-height: 1.7; border-top: 1px solid var(--glass-border); padding-top: 20px;">
                        CONTENT
                    </div>
                </div>
            </div>
        `;

        const grid = document.getElementById('news-list-grid');
        const searchInput = document.getElementById('news-search');
        
        // Modal references
        const modal = document.getElementById('news-reader-modal');
        const readerImg = document.getElementById('reader-img');
        const readerTag = document.getElementById('reader-tag');
        const readerTitle = document.getElementById('reader-title');
        const readerDate = document.getElementById('reader-date');
        const readerContent = document.getElementById('reader-content');
        const readerClose = document.getElementById('reader-close-btn');

        function displayArticles(filterTag = 'all', searchQuery = '') {
            let filtered = news;

            // Apply category filter
            if (filterTag !== 'all') {
                filtered = filtered.filter(item => item.tag.toLowerCase().includes(filterTag));
            }

            // Apply search query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(item => 
                    item.title.toLowerCase().includes(q) || 
                    item.summary.toLowerCase().includes(q) ||
                    item.content.toLowerCase().includes(q)
                );
            }

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div class="glass-panel text-center" style="grid-column: 1 / -1; padding: 50px;">
                        <p style="color: var(--text-dim);">No matching news articles found.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(item => {
                let btnText = 'CLICK HERE';
                let btnClass = 'btn-neon-cyan';
                if (item.contentType === 'Video') {
                    btnClass = 'btn-neon-orange';
                } else if (item.contentType === 'Post') {
                    btnClass = 'btn-neon-orange';
                }

                if (item.redirectLink) {
                    return `
                        <article class="tournament-card">
                            <div class="tournament-img-wrap">
                                <img src="${item.image}" alt="${item.title}" class="tournament-img">
                                <span class="tournament-badge" style="background: rgba(255,204,0,0.15); border-color: var(--neon-orange); color: var(--neon-orange);">${item.tag}</span>
                            </div>
                            <div class="tournament-info">
                                <div class="tournament-game" style="color: var(--text-dim);">${window.strikzFormatDate(item.date)}</div>
                                <h3 class="tournament-name" style="font-size: 16px; min-height: 48px;">${item.title}</h3>
                                <p style="font-size: 13px; color: var(--text-silver); margin-bottom: 20px;">${item.summary}</p>
                                <a href="${item.redirectLink}" target="_blank" class="cta-button ${btnClass} w-full text-center" style="display: block; text-decoration: none; line-height: 2.2;">
                                    <i class="${item.contentType === 'Video' ? 'fa-solid fa-play' : 'fa-solid fa-arrow-up-right-from-square'}"></i> ${btnText}
                                </a>
                            </div>
                        </article>
                    `;
                } else {
                    return `
                        <article class="tournament-card">
                            <div class="tournament-img-wrap">
                                <img src="${item.image}" alt="${item.title}" class="tournament-img">
                                <span class="tournament-badge" style="background: rgba(255,204,0,0.15); border-color: var(--neon-orange); color: var(--neon-orange);">${item.tag}</span>
                            </div>
                            <div class="tournament-info">
                                <div class="tournament-game" style="color: var(--text-dim);">${window.strikzFormatDate(item.date)}</div>
                                <h3 class="tournament-name" style="font-size: 16px; min-height: 48px;">${item.title}</h3>
                                <p style="font-size: 13px; color: var(--text-silver); margin-bottom: 20px;">${item.summary}</p>
                                <button class="cta-button ${btnClass} w-full read-btn" data-id="${item.id}">${btnText}</button>
                            </div>
                        </article>
                    `;
                }
            }).join('');

            // Bind Read Article Modal opening
            grid.querySelectorAll('.read-btn').forEach(btn => {
                btn.onclick = function() {
                    const id = this.dataset.id;
                    const article = news.find(n => n.id === id);
                    if (article) {
                        readerImg.src = article.image;
                        readerTag.textContent = article.tag;
                        readerTitle.textContent = article.title;
                        readerDate.textContent = window.strikzFormatDate(article.date);
                        readerContent.innerHTML = article.content.replace(/\n/g, '<br><br>');
                        
                        modal.classList.add('active');
                    }
                };
            });

            // Re-trigger scroll reveal transitions for news cards
            setTimeout(() => {
                grid.classList.add('active');
                grid.querySelectorAll('.tournament-card').forEach(card => {
                    card.style.opacity = 1;
                    card.style.transform = 'translateY(0)';
                });
            }, 50);
        }

        // Close modal handlers
        readerClose.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };

        // Initialize Display
        displayArticles();

        // Search trigger
        searchInput.oninput = function() {
            const activeTab = document.querySelector('.filter-tab.active');
            let category = 'all';
            if (activeTab.id === 'news-filter-t') category = 'tourn';
            if (activeTab.id === 'news-filter-r') category = 'rost';

            displayArticles(category, this.value);
        };

        // Filter tabs trigger
        const tabAll = document.getElementById('news-filter-all');
        const tabT = document.getElementById('news-filter-t');
        const tabR = document.getElementById('news-filter-r');

        function clearActive() {
            [tabAll, tabT, tabR].forEach(t => t.classList.remove('active'));
        }

        tabAll.onclick = function() { clearActive(); this.classList.add('active'); displayArticles('all', searchInput.value); };
        tabT.onclick = function() { clearActive(); this.classList.add('active'); displayArticles('tourn', searchInput.value); };
        tabR.onclick = function() { clearActive(); this.classList.add('active'); displayArticles('rost', searchInput.value); };
    }

    // Attach to global window
    window.renderNews = renderNews;
})();
