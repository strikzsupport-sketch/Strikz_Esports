const seed = {
    settings: [
        {
            id: 1,
            discordLink: 'https://discord.gg/strikz-esports',
            supportEmail: 'support@strikzesports.com',
            partnerEmail: 'partners@strikzesports.com',
            address: 'Bermuda Arena Office, Digital Esports Valley, IN',
            instagramLink: 'https://instagram.com/strikzesports.in',
            youtubeLink: 'https://youtube.com/strikz-esports',
            twitterLink: '#'
        }
    ],
    users: [],
    tournaments: [
        {
            id: 'ff-ws-2026',
            name: 'Free Fire Max World Series (FFWS) 2026',
            game: 'Free Fire Max',
            mode: 'Squad Battle Royale',
            category: 'Squad',
            prizePool: '$500,000 USD',
            startDate: '2026-07-15',
            regCloseDate: '2026-07-05',
            status: 'Open',
            rules: 'Official Garena tournament rules apply. Roster size: 4 main players + 1 sub. Device: Mobile devices only (no emulators allowed). Anticheat active.',
            ruleBook: '1. Roster Requirements: 4 Main Players + 1 optional substitute.\n2. Device rules: Mobiles only. iPads/Tablets/Emulators are strictly prohibited.\n3. Anticheat: Garena official anticheat will monitor all matches. Any player caught hacking will get a lifetime ban.\n4. Standings: Placement points (12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0) + 1 point per kill.',
            soloRegistrationEnabled: false,
            description: 'The pinnacle of Free Fire Max esports. Teams from across the globe gather to claim the ultimate title of World Champions.',
            image: 'assets/tournament_banner.png',
            featured: true
        },
        {
            id: 'ff-ic-2026',
            name: 'Free Fire Max India Championship (FFIC)',
            game: 'Free Fire Max',
            mode: 'Squad Battle Royale',
            category: 'Squad',
            prizePool: '$200,000 USD',
            startDate: '2026-08-20',
            regCloseDate: '2026-08-10',
            status: 'Open',
            rules: 'Indian residency required. Roster size: 4-5 players. Age limit: 16+. Emulators are strictly banned. Match schedule details will be sent to registered captains.',
            ruleBook: '1. Eligibility: Roster must consist of Indian residents only. Age limit 16+.\n2. Roster: 4 core players + 1 optional sub.\n3. Custom Room Settings: Battle Royale, Competitive Mode.\n4. Captain Responsibility: Captains must attend all discord briefings.',
            soloRegistrationEnabled: false,
            description: 'The premier national championship for Free Fire Max in India. The top 2 teams qualify directly for the FFWS Play-Ins.',
            image: 'assets/hero_bg.png',
            featured: false
        },
        {
            id: 'ff-cs-showdown',
            name: 'Clash Squad Showdown: Invitational',
            game: 'Free Fire Max',
            mode: '4v4 Clash Squad',
            category: 'Squad',
            prizePool: '$50,000 USD',
            startDate: '2026-06-25',
            regCloseDate: '2026-06-20',
            status: 'Open',
            rules: 'Single Elimination brackets. 4v4 game mode. Custom room settings: Competitive Mode. Best of 3 matches, Finals Best of 5.',
            ruleBook: '1. Match format: 4v4 Clash Squad mode.\n2. Economy settings: Competitive Mode (standard starting cash).\n3. Character Skills: Active character skills allowed, no attribute skins.\n4. Map pool: Bermuda, Kalahari, Purgatory.',
            soloRegistrationEnabled: false,
            description: 'High-octane, close-quarters combat. The ultimate test of individual mechanics and fast-paced coordination.',
            image: 'assets/hero_bg.png',
            featured: false
        },
        {
            id: 'ff-solo-clash',
            name: 'Solo Combat Arena Season 1',
            game: 'Free Fire Max',
            mode: 'Solo Battle Royale',
            category: 'Solo',
            prizePool: '$10,000 USD',
            startDate: '2026-07-01',
            regCloseDate: '2026-06-28',
            status: 'Open',
            rules: '1v100 Solo Battle Royale format. Top 10 players from 6 custom rooms qualify for the Grand Finals.',
            ruleBook: '1. Roster format: Strictly 1 player (Solo).\n2. Placement: Points based strictly on match rank and kills.\n3. Teaming up: Collaborating with other players will result in immediate disqualification.\n4. Emulators: Banned.',
            soloRegistrationEnabled: true,
            description: 'Showcase your individual gunplay, survival mechanics, and positioning in a 1v100 battlefield.',
            image: 'assets/hero_bg.png',
            featured: false
        }
    ],
    registrations: [
        { id: 'REG-98124', type: 'Team', tournament_id: 'ff-ws-2026', team_name: 'Team Dominators', captain_name: 'Rajesh Sen', captain_email: 'rajesh@dominators.com', captain_phone: '+91 98765 43210', status: 'Approved', stage: 3, submission_date: '2026-06-08' },
        { id: 'REG-22194', type: 'Solo', tournament_id: 'ff-solo-clash', player_name: 'Vikram "Slayer" Rao', player_email: 'vikram.slayer@gmail.com', player_phone: '+91 91234 56789', game_uid: 'UID-5591028', role: 'Rusher', status: 'Pending', stage: 2, submission_date: '2026-06-10' },
        { id: 'REG-44390', type: 'Team', tournament_id: 'ff-cs-showdown', team_name: 'Viper Esports', captain_name: 'Viper.FF', captain_email: 'viper.ff@gmail.com', captain_phone: '+91 88776 65544', status: 'Pending', stage: 1, submission_date: '2026-06-11' }
    ],
    registrationPlayers: [
        { id: 1, registration_id: 'REG-98124', name: 'Rajesh Sen', game_uid: 'UID-1992019', role: 'IGL', real_name: 'Rajesh Sen', confirmed: true },
        { id: 2, registration_id: 'REG-98124', name: 'Sanjay Kumar', game_uid: 'UID-8201928', role: 'Rusher', real_name: 'Sanjay Kumar', confirmed: true },
        { id: 3, registration_id: 'REG-98124', name: 'Deepak Dev', game_uid: 'UID-7391029', role: 'Sniper', real_name: 'Deepak Dev', confirmed: true },
        { id: 4, registration_id: 'REG-98124', name: 'Aman Patel', game_uid: 'UID-4401928', role: 'Support', real_name: 'Aman Patel', confirmed: true },
        { id: 5, registration_id: 'REG-44390', name: 'Viper.FF', game_uid: 'UID-9901928', role: 'IGL', real_name: 'Satyajit Mohanty', confirmed: true },
        { id: 6, registration_id: 'REG-44390', name: 'Rafi.Survivor', game_uid: 'UID-8201928', role: 'Rusher', real_name: 'Rafi Ahmed', confirmed: false },
        { id: 7, registration_id: 'REG-44390', name: 'Kelly.Pro', game_uid: 'UID-7391029', role: 'Sniper', real_name: 'Kelly Sen', confirmed: false },
        { id: 8, registration_id: 'REG-44390', name: 'Alok.King', game_uid: 'UID-4401928', role: 'Support', real_name: 'Alok Roy', confirmed: false }
    ],
    teams: [
        { id: 'team-1', name: 'Viper Esports', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=viper&backgroundColor=0a0a0f', captain: 'Viper.FF', description: 'Elite Odisha squad training for the national championships.' }
    ],
    teamMembers: [
        { id: 1, team_id: 'team-1', name: 'Viper.FF', game_uid: 'UID-9901928', role: 'IGL', real_name: 'Satyajit Mohanty' },
        { id: 2, team_id: 'team-1', name: 'Rafi.Survivor', game_uid: 'UID-8201928', role: 'Rusher', real_name: 'Rafi Ahmed' },
        { id: 3, team_id: 'team-1', name: 'Kelly.Pro', game_uid: 'UID-7391029', role: 'Sniper', real_name: 'Kelly Sen' },
        { id: 4, team_id: 'team-1', name: 'Alok.King', game_uid: 'UID-4401928', role: 'Support', real_name: 'Alok Roy' }
    ],
    news: [
        { id: 'news-1', title: 'Free Fire Max World Series 2026 Registration Now Open', tag: 'Tournament', date: 'June 10, 2026', summary: 'Get ready for the biggest stage of the year. Registrations for the Free Fire Max World Series 2026 qualifiers have officially begun.', content: 'Strikz Esports platform is hosting the registration gateway for the upcoming regional qualifiers of the Free Fire Max World Series (FFWS). Teams from all registered guilds are eligible to apply. Please make sure to fill in complete player IDs and verification requirements. Emulators are strictly prohibited. Read the full rules book in the Tournaments panel before registering.', image: 'assets/tournament_banner.png', contentType: 'Article', redirectLink: '' },
        { id: 'news-2', title: 'Storm Joins Strikz Esports Roster as Main Rusher', tag: 'Roster Update', date: 'June 02, 2026', summary: 'We are thrilled to announce the signing of Rohan "Storm" Verma to our active competitive line-up.', content: 'Strikz Esports welcomes Rohan "Storm" Verma to the family as our lead Rusher. Previously representing Team Apex, Storm is widely regarded as one of the most mechanically skilled close-quarters combatants in the country, maintaining a massive 5.4 K/D. Storm will make his debut under our banner at the Clash Squad Showdown.', image: 'assets/hero_bg.png', contentType: 'Article', redirectLink: '' },
        { id: 'news-3', title: '5 Crucial Clash Squad Strategies from Captain Viper (Watch Now!)', tag: 'Video', date: 'May 28, 2026', summary: 'Increase your win rate. Watch Viper share his team loadout, buy priorities, and positioning tips for Clash Squad mode.', content: '', image: 'assets/hero_bg.png', contentType: 'Video', redirectLink: 'https://youtube.com/strikz-esports' },
        { id: 'news-4', title: 'Server Maintenance Scheduled for June 15', tag: 'Notice', date: 'June 11, 2026', summary: 'Brief 30-minute backend database synchronization is scheduled at 04:00 AM IST. Scrim rooms will be paused.', content: 'To prepare for the massive signups expected for the India Championship, our secure servers will undergo a brief hardware expansion. Please ensure your captains copy their active registration tickets beforehand.', image: 'assets/hero_bg.png', contentType: 'Article', redirectLink: '' },
        { id: 'news-5', title: 'Roster Registration System: UID Verification Required', tag: 'Alert', date: 'June 09, 2026', summary: 'All team rosters must provide unique Garena digital UIDs. Submitting incorrect IDs will result in verification hold.', content: 'We are noticing several registration attempts with mismatched in-game names and UIDs. Please note that Garena verifies players by their unique digital IDs. Emulators are strictly blocked from the India Championship bracket.', image: 'assets/tournament_banner.png', contentType: 'Article', redirectLink: '' }
    ],
    gallery: [
        { id: 1, type: 'image', url: 'assets/hero_bg.png', title: 'FFWS Finals Arena Setup' },
        { id: 2, type: 'image', url: 'assets/tournament_banner.png', title: 'Strikz Lifting FFIC Trophy' },
        { id: 3, type: 'image', url: 'assets/hero_bg.png', title: 'Roster Press Conference' },
        { id: 4, type: 'image', url: 'assets/tournament_banner.png', title: 'Team Huddle in Esports Arena' }
    ],
    roster: [
        { id: 'Viper', tag: 'Viper', fullName: 'Aarav Sharma', role: 'In-Game Leader (IGL)', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=viper&backgroundColor=0a0a0f', kd: '4.85', hs: '68%', matches: '1,450', winRate: '42%', twitter: '#', youtube: '#', instagram: '#' },
        { id: 'Storm', tag: 'Storm', fullName: 'Rohan Verma', role: 'Rusher', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=storm&backgroundColor=0a0a0f', kd: '5.42', hs: '75%', matches: '1,200', winRate: '38%', twitter: '#', youtube: '#', instagram: '#' },
        { id: 'Deadeye', tag: 'Deadeye', fullName: 'Aditya Patel', role: 'Sniper', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deadeye&backgroundColor=0a0a0f', kd: '4.98', hs: '89%', matches: '1,100', winRate: '45%', twitter: '#', youtube: '#', instagram: '#' },
        { id: 'Guardian', tag: 'Guardian', fullName: 'Kabir Mehta', role: 'Support', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guardian&backgroundColor=0a0a0f', kd: '3.90', hs: '48%', matches: '1,650', winRate: '40%', twitter: '#', youtube: '#', instagram: '#' },
        { id: 'COACH ARES', tag: 'COACH ARES', fullName: 'Vikram Aditya', role: 'Head Coach / Analyst', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ares&backgroundColor=0a0a0f', kd: 'N/A', hs: 'N/A', matches: 'N/A', winRate: 'N/A', twitter: '#', youtube: '#', instagram: '#' },
        { id: 'NEXUS', tag: 'NEXUS', fullName: 'Neha Sen', role: 'Team Manager', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus&backgroundColor=0a0a0f', kd: 'N/A', hs: 'N/A', matches: 'N/A', winRate: 'N/A', twitter: '#', youtube: '#', instagram: '#' }
    ],
    sponsors: [
        { id: 1, name: 'Garena', tier: 'Title', logo: null, logoText: 'GARENA', link: 'https://youtube.com/strikz-esports', promoType: 'Channel' },
        { id: 2, name: 'Red Bull', tier: 'Title', logo: null, logoText: 'RED BULL', link: 'https://redbull.com', promoType: 'Website' },
        { id: 3, name: 'Intel', tier: 'Platinum', logo: null, logoText: 'INTEL', link: 'https://intel.com', promoType: 'Website' },
        { id: 4, name: 'ASUS ROG', tier: 'Platinum', logo: null, logoText: 'ASUS ROG', link: 'https://rog.asus.com', promoType: 'Website' }
    ],
    achievements: [
        { id: 1, teamName: 'STRIKZ ESPORTS', title: 'Champions', event: 'FFIC India Grand Finals 2025', date: 'Oct 2025', reward: '$80,000 USD', details: 'Secured the championship with 186 total points and 3 spectacular Booyahs in the final stage, claiming the national throne.', image: 'assets/tournament_banner.png', tier: 'gold' },
        { id: 2, teamName: 'STRIKZ ESPORTS', title: 'Runner Up (2nd)', event: 'Free Fire World Series (FFWS) Bangkok', date: 'Nov 2025', reward: '$250,000 USD', details: 'Represented India at the international level and finished as runners-up, showcasing world-class strategic execution.', image: 'assets/hero_bg.png', tier: 'silver' },
        { id: 3, teamName: 'STRIKZ ESPORTS', title: 'Champions', event: 'Clash Squad Master Invitational 2024', date: 'Aug 2024', reward: '$20,000 USD', details: 'Dominated the 4v4 brackets, sweeping the finals 3-0 with unmatched aggressive close-combat coordination.', image: 'assets/hero_bg.png', tier: 'gold' },
        { id: 4, teamName: 'STRIKZ ESPORTS', title: '3rd Place', event: 'Asia Arena Showdown 2024', date: 'Mar 2024', reward: '$10,000 USD', details: 'Bravely fought through the play-ins and secured a podium finish, solidifying Strikz as an Asian contender.', image: 'assets/tournament_banner.png', tier: 'bronze' }
    ],
    chatbotTickets: [
        { id: 'CHAT-001', senderName: 'Sunny', senderEmail: 'sunny@games.com', message: 'I entered my UID wrong during registration. Can I change it to UID-8839019?', date: '2026-06-11 10:30 AM', status: 'Pending', type: 'Player' },
        { id: 'CHAT-002', senderName: 'Global Brands Inc.', senderEmail: 'sponsorship@globalbrands.com', message: 'We are interested in sponsoring the upcoming Free Fire Max World Series. Please share the media kit and tier packages.', date: '2026-06-12 02:15 PM', status: 'Pending', type: 'Partner' }
    ],
    socialFeed: [
        { id: 'post-1', platform: 'Discord', author: 'Viper.IGL', content: 'BOOYAH! Strikz takes the scrim lobby tonight! GG to all teams. Roster is looking sharp for FFWS!', date: '1 hour ago', likes: 342, url: 'https://discord.gg/strikz-esports' },
        { id: 'post-2', platform: 'Instagram', author: '@strikz_esports', content: 'Prepare for impact. The new official Strikz tournament jersey has arrived! Pre-orders live tomorrow. #StrikzOdisha #StrikzEsports', date: '4 hours ago', likes: 1205, url: 'https://instagram.com/strikz-esports' },
        { id: 'post-3', platform: 'YouTube', author: 'Strikz Esports TV', content: "NEW VIDEO OUT! Storm's insane 1v4 clutch against Team X Spark in FFIC qualifiers. Watch the full breakdown now!", date: '1 day ago', likes: 4500, url: 'https://youtube.com/strikz-esports' }
    ],
    management: [
        { id: 1, name: 'Satyajit Mohanty', tag: 'Viper', role: 'Founder & CEO', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=viperceo&backgroundColor=0a0a0f', bio: 'Esports visionary spearheading competitive tournaments in the region.', instagram: 'https://instagram.com/strikzesports.in', youtube: '#', socials: { instagram: 'https://instagram.com/strikzesports.in', youtube: '#' } },
        { id: 2, name: 'Biswajit Panda', tag: 'Storm', role: 'Co-Founder & COO', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=stormcoo&backgroundColor=0a0a0f', bio: 'Operations strategist leading tournament management and sponsorship relations.', instagram: '#', youtube: '#', socials: { instagram: '#', youtube: '#' } },
        { id: 3, name: 'Priyabrata Patra', tag: 'Deadeye', role: 'Head of Operations', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deadeyeops&backgroundColor=0a0a0f', bio: 'Technical controller handling bracket logic and server security portals.', instagram: '#', youtube: '#', socials: { instagram: '#', youtube: '#' } }
    ]
};

const upsertMany = async (Model, docs) => {
    for (const doc of docs) {
        await Model.updateOne({ id: doc.id }, { $setOnInsert: doc }, { upsert: true });
    }
};

const seedDatabase = async (models) => {
    // ALWAYS force-recreate admin user with correct credentials on every startup.
    // This ensures any stale password hashes in the live DB are overwritten.
    try {
        const bcrypt = require('bcryptjs');
        const ADMIN_USERNAME = 'strikz_admin';
        const ADMIN_PASSWORD = 'strikz_password_2026';
        const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Wipe both the old 'admin' account and any existing 'strikz_admin'
        await models.User.deleteMany({ username: { $in: ['admin', ADMIN_USERNAME] } });

        // Re-create fresh with correct hash
        let uid = 'admin_73';
        let exists = await models.User.exists({ uid });
        while (exists) {
            uid = 'admin_' + Math.floor(10 + Math.random() * 900);
            exists = await models.User.exists({ uid });
        }
        await models.User.create({
            id: 1,
            uid,
            username: ADMIN_USERNAME,
            email: 'admin@strikzesports.com',
            password_hash: adminHash,
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin&backgroundColor=0a0a0f',
            isVerified: true
        });
        console.log(`[SEED] Admin user "${ADMIN_USERNAME}" created/reset successfully.`);
    } catch (err) {
        console.error('[SEED] Failed to seed default admin:', err.message);
    }

    const hasSettings = await models.Setting.exists({ id: 1 });
    if (hasSettings) return;

    await upsertMany(models.Setting, seed.settings);
    await upsertMany(models.User, seed.users);
    await upsertMany(models.Tournament, seed.tournaments);
    await upsertMany(models.Registration, seed.registrations);
    await upsertMany(models.RegistrationPlayer, seed.registrationPlayers);
    await upsertMany(models.Team, seed.teams);
    await upsertMany(models.TeamMember, seed.teamMembers);
    await upsertMany(models.News, seed.news);
    await upsertMany(models.Gallery, seed.gallery);
    await upsertMany(models.Roster, seed.roster);
    await upsertMany(models.Sponsor, seed.sponsors);
    await upsertMany(models.Achievement, seed.achievements);
    await upsertMany(models.ChatbotTicket, seed.chatbotTickets);
    await upsertMany(models.SocialFeed, seed.socialFeed);
    await upsertMany(models.Management, seed.management);
    console.log('MongoDB seed data inserted');
};

module.exports = { seedDatabase };
