const { models, nextNumberId, clean } = require('../config/db');

const sortByIdDesc = (a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const publicDoc = (doc) => clean(doc);

const getPublicSnapshot = async (req, res, next) => {
    try {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        // Automatically close tournaments whose start date has arrived (in Indian Standard Time)
        await models.Tournament.updateMany(
            { status: 'Open', startDate: { $lte: todayStr } },
            { $set: { status: 'Closed' } }
        );

        const [tournaments, sponsors, gallery, news, roster, achievements, management, socialFeed, settings, history] = await Promise.all([
            models.Tournament.find().sort({ startDate: 1 }).lean(),
            models.Sponsor.find().sort({ tier: -1, name: 1 }).lean(),
            models.Gallery.find().sort({ id: -1 }).lean(),
            models.News.find().sort({ created_at: -1 }).lean(),
            models.Roster.find().lean(),
            models.Achievement.find().sort({ id: -1 }).lean(),
            models.Management.find().sort({ id: 1 }).lean(),
            models.SocialFeed.find().sort({ id: -1 }).lean(),
            models.Setting.findOne({ id: 1 }).lean(),
            models.History.find().sort({ id: 1 }).lean()
        ]);

        res.json({
            success: true,
            data: {
                tournaments: tournaments.map(publicDoc),
                sponsors: sponsors.map(publicDoc),
                gallery: gallery.map(publicDoc),
                news: news.map(publicDoc),
                roster: roster.map(r => {
                    const doc = publicDoc(r);
                    if (!doc.stats) {
                        doc.stats = {
                            kd: doc.kd || 'N/A',
                            hs: doc.hs || 'N/A',
                            matches: doc.matches || 'N/A',
                            winRate: doc.winRate || 'N/A'
                        };
                    }
                    if (!doc.socials) {
                        doc.socials = {
                            twitter: doc.twitter || '#',
                            youtube: doc.youtube || '#',
                            instagram: doc.instagram || '#'
                        };
                    }
                    if (!doc.avatar && doc.image) doc.avatar = doc.image;
                    if (!doc.image && doc.avatar) doc.image = doc.avatar;
                    if (!doc.kd && doc.stats) doc.kd = doc.stats.kd || 'N/A';
                    if (!doc.hs && doc.stats) doc.hs = doc.stats.hs || 'N/A';
                    if (!doc.matches && doc.stats) doc.matches = doc.stats.matches || 'N/A';
                    if (!doc.winRate && doc.stats) doc.winRate = doc.stats.winRate || 'N/A';
                    if (!doc.twitter && doc.socials) doc.twitter = doc.socials.twitter || '#';
                    if (!doc.youtube && doc.socials) doc.youtube = doc.socials.youtube || '#';
                    if (!doc.instagram && doc.socials) doc.instagram = doc.socials.instagram || '#';
                    return doc;
                }),
                achievements: achievements.map(ach => {
                    const doc = publicDoc(ach);
                    doc.reward = doc.reward || doc.prize || '';
                    doc.prize = doc.reward;
                    doc.title = doc.title || doc.placement || '';
                    doc.placement = doc.title;
                    doc.details = doc.details || '';
                    return doc;
                }),
                management: management.map(publicDoc),
                socialFeed: socialFeed.map(sf => {
                    const doc = publicDoc(sf);
                    doc.image = doc.image || doc.mediaUrl || '';
                    doc.mediaUrl = doc.image;
                    doc.url = doc.url || doc.link || '';
                    doc.link = doc.url;
                    return doc;
                }),
                settings: publicDoc(settings) || {},
                history: history.map(publicDoc)
            }
        });
    } catch (err) {
        next(err);
    }
};

const trackRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reg = await models.Registration.findOne({ id }).lean();

        if (!reg) {
            res.status(404);
            return next(new Error('Gamer registration ticket code not found'));
        }

        const [players, tourney] = await Promise.all([
            models.RegistrationPlayer.find({ registration_id: id }).select('name game_uid role confirmed real_name').lean(),
            models.Tournament.findOne({ id: reg.tournament_id }).select('name image').lean()
        ]);

        res.json({
            success: true,
            registration: {
                id: reg.id,
                type: reg.type,
                tournamentId: reg.tournament_id,
                tournamentName: tourney ? tourney.name : '',
                tournamentImage: tourney ? tourney.image : '',
                status: reg.status,
                stage: reg.stage,
                submissionDate: reg.submission_date,
                teamName: reg.team_name,
                captainName: reg.captain_name,
                playerName: reg.player_name,
                gameUid: reg.game_uid,
                role: reg.role,
                players: players.map(publicDoc)
            }
        });
    } catch (err) {
        next(err);
    }
};

const createRegistration = async (req, res, next) => {
    try {
        const { type, tournamentId, teamName, captainName, captainEmail, captainPhone, players, playerName, gameUid, playerEmail, playerPhone, role } = req.body;

        if (!type || !tournamentId) {
            res.status(400);
            return next(new Error('Registration requires type and tournament target'));
        }

        const tourney = await models.Tournament.findOne({ id: tournamentId }).lean();
        if (!tourney) {
            res.status(404);
            return next(new Error('Tournament arena not found'));
        }

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        if (tourney.registrationStartDate && todayStr < tourney.registrationStartDate) {
            res.status(400);
            return next(new Error('Championship registration has not started yet'));
        }

        if (tourney.status === 'Open' && tourney.startDate && tourney.startDate <= todayStr) {
            await models.Tournament.updateOne({ id: tournamentId }, { $set: { status: 'Closed' } });
            res.status(400);
            return next(new Error('Championship registration portal is currently closed'));
        }

        if (tourney.status === 'Slot Full') {
            res.status(400);
            return next(new Error('Championship slots are currently full'));
        }

        if (tourney.status === 'Temporary Close') {
            res.status(400);
            return next(new Error('Championship registration portal is temporarily closed'));
        }

        if (tourney.status !== 'Open') {
            res.status(400);
            return next(new Error('Championship registration portal is currently closed'));
        }

        if (type === 'Solo' && !tourney.soloRegistrationEnabled) {
            res.status(400);
            return next(new Error('Solo entries are restricted for this championship'));
        }

        let regId;
        do {
            regId = 'REG-' + Math.floor(10000 + Math.random() * 90000);
        } while (await models.Registration.exists({ id: regId }));

        const submissionDate = new Date().toISOString().slice(0, 10);
        const baseRegistration = {
            id: regId,
            type,
            tournament_id: tournamentId,
            status: 'Pending',
            stage: type === 'Solo' ? 2 : 1,
            submission_date: submissionDate
        };

        if (type === 'Solo') {
            Object.assign(baseRegistration, {
                player_name: playerName,
                game_uid: gameUid,
                player_email: playerEmail,
                player_phone: playerPhone,
                role
            });
        } else {
            Object.assign(baseRegistration, {
                team_name: teamName,
                captain_name: captainName,
                captain_email: captainEmail,
                captain_phone: captainPhone
            });
        }

        await models.Registration.create(baseRegistration);

        if (type !== 'Solo' && players && players.length > 0) {
            const captainUid = req.user.uid;
            let userTeam = await models.Team.findOne({ captain_uid: captainUid }).lean();
            if (!userTeam) {
                const memberRecord = await models.TeamMember.findOne({ user_uid: captainUid, confirmed: true }).lean();
                if (memberRecord) {
                    userTeam = await models.Team.findOne({ id: memberRecord.team_id }).lean();
                }
            }
            const teamMembers = userTeam ? await models.TeamMember.find({ team_id: userTeam.id }).lean() : [];

            let nextId = await nextNumberId(models.RegistrationPlayer);
            await models.RegistrationPlayer.insertMany(players.map((p) => {
                const matchedMember = teamMembers.find(tm => 
                    (tm.name && tm.name.toLowerCase() === p.name.toLowerCase()) || 
                    (tm.game_uid && tm.game_uid === p.gameUid)
                );

                return {
                    id: nextId++,
                    registration_id: regId,
                    user_uid: matchedMember ? matchedMember.user_uid : (p.userUid || p.user_uid),
                    name: p.name,
                    game_uid: p.gameUid,
                    role: p.role,
                    real_name: p.realName || p.name,
                    confirmed: !!p.confirmed
                };
            }));
        }

        // Dispatch Registration and Attendance Confirmation Emails
        const emailService = require('../utils/emailService');
        if (type === 'Team' || type === 'Duo') {
            // 1. Send registration and attendance confirmation to captain
            if (baseRegistration.captain_email) {
                try {
                    await emailService.sendRegistrationConfirmation(
                        baseRegistration.captain_email,
                        baseRegistration.captain_name,
                        regId,
                        tourney.name,
                        tourney.startDate,
                        tourney.rules ? 'Server Lobby' : 'Bermuda Arena Office'
                    );
                    await emailService.sendAttendanceConfirmation(
                        baseRegistration.captain_email,
                        baseRegistration.captain_name,
                        regId,
                        tourney.name
                    );
                } catch (emailErr) {
                    console.error('Failed to send registration/attendance email to captain:', emailErr.message);
                }
            }

            // 2. Send registration confirmation to all teammates
            try {
                const regPlayers = await models.RegistrationPlayer.find({ registration_id: regId }).lean();
                for (const p of regPlayers) {
                    if (!p.user_uid) continue;
                    const playerUser = await models.User.findOne({ uid: p.user_uid }).select('email username').lean();
                    if (playerUser && playerUser.email && playerUser.email !== baseRegistration.captain_email) {
                        try {
                            await emailService.sendRegistrationConfirmation(
                                playerUser.email,
                                p.name || playerUser.username,
                                regId,
                                tourney.name,
                                tourney.startDate,
                                tourney.rules ? 'Server Lobby' : 'Bermuda Arena Office',
                                true
                            );
                        } catch (emailErr) {
                            console.error(`Failed to send registration email to teammate ${playerUser.email}:`, emailErr.message);
                        }
                    }
                }
            } catch (pErr) {
                console.error('Failed to query teammate players for registration emails:', pErr.message);
            }
        } else {
            // Solo registration
            if (baseRegistration.player_email) {
                try {
                    await emailService.sendRegistrationConfirmation(
                        baseRegistration.player_email,
                        baseRegistration.player_name,
                        regId,
                        tourney.name,
                        tourney.startDate,
                        tourney.rules ? 'Server Lobby' : 'Bermuda Arena Office'
                    );
                    await emailService.sendAttendanceConfirmation(
                        baseRegistration.player_email,
                        baseRegistration.player_name,
                        regId,
                        tourney.name
                    );
                } catch (emailErr) {
                    console.error('Failed to send solo registration/attendance emails:', emailErr.message);
                }
            }
        }

        res.status(201).json({
            success: true,
            registration: {
                id: regId,
                type,
                tournamentId,
                tournamentName: tourney.name,
                tournamentImage: tourney.image,
                status: 'Pending',
                stage: type === 'Solo' ? 2 : 1,
                submissionDate,
                teamName,
                captainName: captainName || playerName,
                playerName: playerName,
                gameUid: gameUid,
                role: role,
                players: players ? players.map(p => ({
                    name: p.name,
                    game_uid: p.gameUid,
                    role: p.role,
                    real_name: p.realName || p.name,
                    confirmed: !!p.confirmed
                })) : []
            }
        });
    } catch (err) {
        next(err);
    }
};

const getMyTeam = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        
        // Find if user is captain of a team
        let team = await models.Team.findOne({ captain_uid: uid }).lean();
        let isCaptain = true;
        
        if (!team) {
            // Find if user is a confirmed member of a team
            const member = await models.TeamMember.findOne({ user_uid: uid, confirmed: true }).lean();
            if (member) {
                team = await models.Team.findOne({ id: member.team_id }).lean();
                isCaptain = false;
            }
        }

        if (!team) {
            // Find pending invitations for this user
            const invites = await models.TeamMember.find({ user_uid: uid, confirmed: false }).lean();
            const invitations = [];
            for (const invite of invites) {
                const inviteTeam = await models.Team.findOne({ id: invite.team_id }).lean();
                if (inviteTeam) {
                    invitations.push({
                        teamId: inviteTeam.id,
                        teamName: inviteTeam.name,
                        logo: inviteTeam.logo,
                        description: inviteTeam.description,
                        captainName: inviteTeam.captain_name || inviteTeam.captain,
                        role: invite.role
                    });
                }
            }
            return res.json({ success: true, team: null, invitations });
        }

        const members = await models.TeamMember.find({ team_id: team.id }).select('name user_uid game_uid role real_name ign confirmed').lean();
        const populatedMembers = [];
        for (const m of members) {
            const u = await models.User.findOne({ uid: m.user_uid }).select('avatar').lean();
            
            let fallbackGameUid = m.game_uid;
            let fallbackRealName = m.real_name;
            let fallbackName = m.name;
            
            if (!fallbackGameUid || !fallbackRealName) {
                // Look up their details in past registration records as a fallback
                const pastReg = await models.RegistrationPlayer.findOne({ user_uid: m.user_uid }).lean();
                if (pastReg) {
                    if (!fallbackGameUid) fallbackGameUid = pastReg.game_uid;
                    if (!fallbackRealName) fallbackRealName = pastReg.real_name;
                    if (!fallbackName) fallbackName = pastReg.name;
                }
            }

            populatedMembers.push({
                ...m,
                name: fallbackName || m.name || (u ? u.username : ''),
                real_name: fallbackRealName || m.real_name || (u ? u.username : ''),
                game_uid: fallbackGameUid || m.game_uid || '',
                avatar: u ? u.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fallbackName || m.name || '')}`
            });
        }
        res.json({
            success: true,
            team: {
                id: team.id,
                name: team.name,
                logo: team.logo,
                captain: team.captain_name || team.captain,
                captain_uid: team.captain_uid,
                description: team.description,
                members: populatedMembers.map(publicDoc)
            }
        });
    } catch (err) {
        next(err);
    }
};

const createMyTeam = async (req, res, next) => {
    try {
        const { name, description, members } = req.body;
        const user = req.user;

        if (!name || !description || !members || members.length === 0) {
            res.status(400);
            return next(new Error('Please provide team name, description and member list'));
        }

        // Check if captain is already in a team
        const existingCaptain = await models.Team.findOne({ captain_uid: user.uid }).lean();
        const existingMember = await models.TeamMember.findOne({ user_uid: user.uid, confirmed: true }).lean();
        if (existingCaptain || existingMember) {
            res.status(400);
            return next(new Error('You are already registered inside an active esports squad'));
        }

        // Check unique team name
        const teamNameExists = await models.Team.findOne({ name: new RegExp('^' + escapeRegExp(name) + '$', 'i') }).lean();
        if (teamNameExists) {
            res.status(400);
            return next(new Error('Team name already taken by another squad'));
        }

        // Validate captain detail (Member #1)
        const captainDetail = members[0];
        if (!captainDetail) {
            res.status(400);
            return next(new Error('Captain details are required'));
        }

        // Validate invited members
        const invitesToCreate = [];
        for (let i = 1; i < members.length; i++) {
            const m = members[i];
            if (!m.user_uid) continue; // Skip empty member inputs

            const cleanUid = m.user_uid.trim().toLowerCase();
            if (cleanUid === user.uid) {
                res.status(400);
                return next(new Error('You cannot invite yourself as a member.'));
            }

            const invitee = await models.User.findOne({ uid: cleanUid }).lean();
            if (!invitee) {
                res.status(400);
                return next(new Error(`Invalid Strikz Gamer UID: ${cleanUid}`));
            }

            // Check if invitee is already in a team
            const inviteeCaptain = await models.Team.findOne({ captain_uid: invitee.uid }).lean();
            const inviteeMember = await models.TeamMember.findOne({ user_uid: invitee.uid, confirmed: true }).lean();
            if (inviteeCaptain || inviteeMember) {
                res.status(400);
                return next(new Error(`Player ${invitee.username} (${cleanUid}) is already registered in an esports squad`));
            }

            invitesToCreate.push({
                user_uid: invitee.uid,
                name: invitee.username,
                realName: m.realName || invitee.username,
                gameUid: m.gameUid,
                role: m.role
            });
        }

        const teamId = 'team-' + Date.now();
        const logo = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a0a0f`;
        
        await models.Team.create({ 
            id: teamId, 
            name: name.toUpperCase(), 
            logo, 
            captain: user.username, 
            captain_name: user.username, 
            captain_uid: user.uid, 
            description 
        });

        let nextId = await nextNumberId(models.TeamMember);
        
        // Insert captain
        await models.TeamMember.create({
            id: nextId++,
            team_id: teamId,
            user_uid: user.uid,
            name: user.username,
            game_uid: captainDetail.gameUid,
            role: captainDetail.role,
            real_name: captainDetail.realName || user.username,
            confirmed: true
        });

        // Insert invited members
        if (invitesToCreate.length > 0) {
            await models.TeamMember.insertMany(invitesToCreate.map((m) => ({
                id: nextId++,
                team_id: teamId,
                user_uid: m.user_uid,
                name: m.name,
                game_uid: m.gameUid,
                role: m.role,
                real_name: m.realName,
                confirmed: false
            })));
        }

        res.status(201).json({
            success: true,
            team: { 
                id: teamId, 
                name, 
                logo, 
                captain: user.username, 
                captain_uid: user.uid, 
                description, 
                members: [
                    { name: user.username, user_uid: user.uid, gameUid: captainDetail.gameUid, role: captainDetail.role, realName: captainDetail.realName, confirmed: true },
                    ...invitesToCreate.map(inv => ({ name: inv.name, user_uid: inv.user_uid, gameUid: inv.gameUid, role: inv.role, realName: inv.realName, confirmed: false }))
                ]
            }
        });
    } catch (err) {
        next(err);
    }
};

const acceptInvite = async (req, res, next) => {
    try {
        const { teamId } = req.body;
        const uid = req.user.uid;

        if (!teamId) {
            res.status(400);
            return next(new Error('Please provide the team ID to accept'));
        }

        // Check if user is already in a team
        const existingCaptain = await models.Team.findOne({ captain_uid: uid }).lean();
        const existingMember = await models.TeamMember.findOne({ user_uid: uid, confirmed: true }).lean();
        if (existingCaptain || existingMember) {
            res.status(400);
            return next(new Error('You are already registered inside an active esports squad'));
        }

        const result = await models.TeamMember.updateOne(
            { team_id: teamId, user_uid: uid, confirmed: false },
            { $set: { confirmed: true } }
        );

        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('No pending invitation found for this team'));
        }

        res.json({ success: true, message: 'Successfully accepted team invitation!' });
    } catch (err) {
        next(err);
    }
};

const declineInvite = async (req, res, next) => {
    try {
        const { teamId } = req.body;
        const uid = req.user.uid;

        if (!teamId) {
            res.status(400);
            return next(new Error('Please provide the team ID to decline'));
        }

        const result = await models.TeamMember.deleteOne({ team_id: teamId, user_uid: uid, confirmed: false });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('No pending invitation found to decline'));
        }

        res.json({ success: true, message: 'Successfully declined team invitation.' });
    } catch (err) {
        next(err);
    }
};

const confirmJoin = async (req, res, next) => {
    try {
        const { regId } = req.body;
        const uid = req.user.uid;

        if (!regId) {
            res.status(400);
            return next(new Error('Please provide the registration ID to confirm'));
        }

        const result = await models.RegistrationPlayer.updateOne(
            { registration_id: regId, user_uid: uid, confirmed: false },
            { $set: { confirmed: true } }
        );

        if (result.matchedCount === 0) {
            const alreadyConfirmed = await models.RegistrationPlayer.exists({ registration_id: regId, user_uid: uid, confirmed: true });
            if (alreadyConfirmed) {
                res.status(400);
                return next(new Error('You have already confirmed this registration invitation'));
            }
            res.status(404);
            return next(new Error('No pending registration invitation found for your Gamer UID'));
        }

        const allPlayers = await models.RegistrationPlayer.find({ registration_id: regId }).select('confirmed').lean();
        const allConfirmed = allPlayers.every((p) => p.confirmed === true);

        if (allConfirmed) {
            await models.Registration.updateOne({ id: regId }, { $set: { stage: 2 } });
        }

        // Notify all team members about the confirmed player
        try {
            const registration = await models.Registration.findOne({ id: regId }).lean();
            if (registration && (registration.type === 'Team' || registration.type === 'Duo')) {
                const tourney = await models.Tournament.findOne({ id: registration.tournament_id }).lean();
                const player = await models.RegistrationPlayer.findOne({ registration_id: regId, user_uid: uid }).lean();
                const emailService = require('../utils/emailService');

                const recipients = [];
                // Add captain
                if (registration.captain_email) {
                    recipients.push({
                        email: registration.captain_email,
                        name: registration.captain_name
                    });
                }
                // Add players
                const regPlayers = await models.RegistrationPlayer.find({ registration_id: regId }).lean();
                for (const rp of regPlayers) {
                    if (!rp.user_uid) continue;
                    const pUser = await models.User.findOne({ uid: rp.user_uid }).select('email username').lean();
                    if (pUser && pUser.email && !recipients.some(r => r.email === pUser.email)) {
                        recipients.push({
                            email: pUser.email,
                            name: rp.name || pUser.username
                        });
                    }
                }

                // Send email to everyone in the list
                for (const r of recipients) {
                    try {
                        const content = `
                            <h3 style="color: #00f0ff; font-size: 18px; margin-top: 0;">SQUAD MEMBER ATTENDANCE LOCKED</h3>
                            <p>Hello <strong>${r.name}</strong>,</p>
                            <p>This is to notify you that player <strong>${player ? player.name : uid}</strong> has confirmed their roster participation for tournament <strong>${tourney ? tourney.name : 'Championship'}</strong> in squad <strong>${registration.team_name}</strong>.</p>
                            <p>Roster status of the squad is being updated. Thank you!</p>
                        `;
                        const html = emailService.getHtmlWrapper(content);
                        await emailService.sendEmailDirect({
                            to: r.email,
                            subject: `Member Confirmed: ${registration.team_name}`,
                            html,
                            type: 'Member Confirmation'
                        });
                    } catch (emailErr) {
                        console.error(`Failed to send player confirmation email to ${r.email}:`, emailErr.message);
                    }
                }
            }
        } catch (notifErr) {
            console.error('Failed to notify team members about confirmation:', notifErr.message);
        }

        res.json({ success: true, message: 'Roster join invitation confirmed successfully', allConfirmed });
    } catch (err) {
        next(err);
    }
};

const getPendingConfirmations = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        if (!uid) return res.json({ success: true, confirmations: [] });

        const players = await models.RegistrationPlayer.find({
            user_uid: uid,
            confirmed: false
        }).lean();

        const confirmations = [];
        for (const player of players) {
            const reg = await models.Registration.findOne({ id: player.registration_id, status: 'Pending' }).lean();
            if (!reg) continue;
            const tourney = await models.Tournament.findOne({ id: reg.tournament_id }).select('name').lean();
            confirmations.push({
                regId: reg.id,
                tournamentId: reg.tournament_id,
                tournamentName: tourney ? tourney.name : '',
                teamName: reg.team_name
            });
        }

        res.json({ success: true, confirmations: confirmations.sort(sortByIdDesc) });
    } catch (err) {
        next(err);
    }
};

const getMyTeamInbox = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        if (!uid) {
            return res.json({ success: true, inbox: [] });
        }

        // 1. Fetch team invitations
        const invites = await models.TeamMember.find({ user_uid: uid, confirmed: false }).lean();
        const teamInvites = [];
        for (const invite of invites) {
            const team = await models.Team.findOne({ id: invite.team_id }).lean();
            if (!team) continue;
            teamInvites.push({
                id: `invite-${invite.id}-${team.id}`,
                type: 'team_invite',
                title: `Team Invite: ${team.name}`,
                message: `Invite from Captain ${team.captain || 'unknown'} to join as ${invite.role}.`,
                date: invite.created_at ? new Date(invite.created_at).toISOString() : new Date().toISOString(),
                timestamp: invite.created_at ? new Date(invite.created_at).getTime() : Date.now(),
                metadata: {
                    teamId: team.id,
                    teamName: team.name,
                    role: invite.role,
                    logo: team.logo,
                    description: team.description,
                    captainName: team.captain
                }
            });
        }

        // 2. Fetch tournament confirmations
        const players = await models.RegistrationPlayer.find({ user_uid: uid, confirmed: false }).lean();
        const tourneyConfirms = [];
        for (const player of players) {
            const reg = await models.Registration.findOne({ id: player.registration_id, status: 'Pending' }).lean();
            if (!reg) continue;
            const tourney = await models.Tournament.findOne({ id: reg.tournament_id }).select('name').lean();
            tourneyConfirms.push({
                id: `confirm-${player.id}-${reg.id}`,
                type: 'tournament_confirm',
                title: 'Tournament Roster Join Verification',
                message: `Roster join confirmation requested for squad '${reg.team_name}' in the tournament '${tourney ? tourney.name : 'Unknown Championship'}'.`,
                date: reg.created_at ? new Date(reg.created_at).toISOString() : new Date().toISOString(),
                timestamp: reg.created_at ? new Date(reg.created_at).getTime() : Date.now(),
                metadata: {
                    regId: reg.id,
                    tournamentId: reg.tournament_id,
                    tournamentName: tourney ? tourney.name : '',
                    teamName: reg.team_name
                }
            });
        }

        // 3. Fetch general alerts/notifications from DB
        const alerts = await models.Notification.find({ user_uid: uid }).lean();
        const alertList = alerts.map(a => ({
            id: `alert-${a.id}`,
            type: 'alert',
            title: a.title,
            message: a.content,
            date: a.created_at ? new Date(a.created_at).toISOString() : new Date().toISOString(),
            timestamp: a.created_at ? new Date(a.created_at).getTime() : Date.now(),
            metadata: {
                dbNotifId: a.id
            }
        }));

        // Combine and sort by timestamp descending
        const inbox = [...teamInvites, ...tourneyConfirms, ...alertList].sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, inbox });
    } catch (err) {
        next(err);
    }
};

const dismissNotification = async (req, res, next) => {
    try {
        let { id } = req.params;
        const uid = req.user.uid;

        if (id.startsWith('alert-')) {
            id = id.substring(6);
        }

        const numericId = Number(id);
        await models.Notification.deleteOne({ id: isNaN(numericId) ? id : numericId, user_uid: uid });
        res.json({ success: true, message: 'Notification dismissed' });
    } catch (err) {
        next(err);
    }
};

const leaveTeam = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const username = req.user.username;

        const memberRecord = await models.TeamMember.findOne({ user_uid: uid }).lean();
        if (!memberRecord) {
            res.status(400);
            return next(new Error('You are not currently in any squad'));
        }

        const team = await models.Team.findOne({ id: memberRecord.team_id }).lean();
        if (!team) {
            await models.TeamMember.deleteOne({ id: memberRecord.id });
            res.status(400);
            return next(new Error('Squad details not found'));
        }

        if (team.captain_uid === uid) {
            res.status(400);
            return next(new Error('Team Captains cannot exit the team. Use Disband Team or transfer leadership instead.'));
        }

        await models.TeamMember.deleteOne({ id: memberRecord.id });

        const captainUid = team.captain_uid;
        if (captainUid) {
            const nextNotifId = await nextNumberId(models.Notification);
            await models.Notification.create({
                id: nextNotifId,
                user_uid: captainUid,
                title: 'Teammate Left Roster',
                content: `Gamer ${username} has left your esports squad '${team.name}'.`,
                type: 'alert'
            });
        }

        const otherMembers = await models.TeamMember.find({ team_id: team.id, user_uid: { $ne: uid } }).lean();
        for (const m of otherMembers) {
            if (m.user_uid) {
                const nextNotifId = await nextNumberId(models.Notification);
                await models.Notification.create({
                    id: nextNotifId,
                    user_uid: m.user_uid,
                    title: 'Squad Roster Change',
                    content: `Gamer ${username} has left your esports squad '${team.name}'.`,
                    type: 'alert'
                });
            }
        }

        res.json({ success: true, message: 'Successfully exited the squad roster' });
    } catch (err) {
        next(err);
    }
};

const disbandTeam = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const team = await models.Team.findOne({ captain_uid: uid }).lean();
        if (!team) {
            res.status(400);
            return next(new Error('You are not the captain of any esports squad'));
        }

        const members = await models.TeamMember.find({ team_id: team.id, user_uid: { $ne: uid } }).lean();

        await models.TeamMember.deleteMany({ team_id: team.id });
        await models.Team.deleteOne({ id: team.id });

        for (const member of members) {
            if (member.user_uid) {
                const nextNotifId = await nextNumberId(models.Notification);
                await models.Notification.create({
                    id: nextNotifId,
                    user_uid: member.user_uid,
                    title: 'Squad Disbanded',
                    content: `Your esports squad '${team.name}' has been disbanded by the Captain.`,
                    type: 'alert'
                });
            }
        }

        res.json({ success: true, message: 'Esports squad disbanded successfully' });
    } catch (err) {
        next(err);
    }
};

const kickMember = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { memberUid } = req.body;

        if (!memberUid) {
            res.status(400);
            return next(new Error('Target gamer UID is required'));
        }

        const team = await models.Team.findOne({ captain_uid: uid }).lean();
        if (!team) {
            res.status(400);
            return next(new Error('Only Team Captains can remove roster members'));
        }

        const member = await models.TeamMember.findOne({ team_id: team.id, user_uid: memberUid }).lean();
        if (!member) {
            res.status(404);
            return next(new Error('Gamer not found on your squad roster'));
        }

        await models.TeamMember.deleteOne({ id: member.id });

        const nextNotifId = await nextNumberId(models.Notification);
        await models.Notification.create({
            id: nextNotifId,
            user_uid: memberUid,
            title: 'Removed from Roster',
            content: `You have been removed from the esports squad '${team.name}' by the Captain.`,
            type: 'alert'
        });

        const otherMembers = await models.TeamMember.find({ team_id: team.id, user_uid: { $ne: uid } }).lean();
        for (const m of otherMembers) {
            if (m.user_uid && m.user_uid !== memberUid) {
                const nextNotifId = await nextNumberId(models.Notification);
                await models.Notification.create({
                    id: nextNotifId,
                    user_uid: m.user_uid,
                    title: 'Squad Roster Change',
                    content: `Gamer ${member.name || 'A player'} has been removed from the roster.`,
                    type: 'alert'
                });
            }
        }

        res.json({ success: true, message: 'Member successfully removed from roster' });
    } catch (err) {
        next(err);
    }
};

const updateTeamLogo = async (req, res, next) => {
    try {
        const { logo } = req.body;
        const user = req.user;
        if (!logo) {
            res.status(400);
            return next(new Error('Please provide logo URL'));
        }
        const team = await models.Team.findOneAndUpdate(
            { captain_uid: user.uid },
            { logo },
            { new: true }
        );
        if (!team) {
            res.status(404);
            return next(new Error('You must be the captain of an active squad to update the team logo'));
        }
        res.json({ success: true, team });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPublicSnapshot,
    trackRegistration,
    createRegistration,
    getMyTeam,
    createMyTeam,
    acceptInvite,
    declineInvite,
    confirmJoin,
    getPendingConfirmations,
    getMyTeamInbox,
    dismissNotification,
    leaveTeam,
    disbandTeam,
    kickMember,
    updateTeamLogo
};
