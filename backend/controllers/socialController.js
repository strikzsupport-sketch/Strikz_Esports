const { models, nextNumberId } = require('../config/db');

// helper to escape regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 1. Send Friend Request
const sendFriendRequest = async (req, res, next) => {
    try {
        const { friendUid } = req.body;
        const myUid = req.user.uid;

        if (!friendUid) {
            res.status(400);
            return next(new Error('Friend Gamer UID is required'));
        }

        const cleanFriendUid = friendUid.trim().toLowerCase();
        if (cleanFriendUid === myUid.toLowerCase()) {
            res.status(400);
            return next(new Error('You cannot send a friend request to yourself'));
        }

        const targetUser = await models.User.findOne({ uid: cleanFriendUid }).lean();
        if (!targetUser) {
            res.status(404);
            return next(new Error('Gamer not found in the arena'));
        }

        // Check if relationship already exists
        const existing = await models.Friendship.findOne({
            $or: [
                { user_uid_1: myUid, user_uid_2: targetUser.uid },
                { user_uid_1: targetUser.uid, user_uid_2: myUid }
            ]
        }).lean();

        if (existing) {
            if (existing.status === 'Pending') {
                res.status(400);
                return next(new Error('Friend request already pending or received'));
            } else {
                res.status(400);
                return next(new Error('You are already friends with this gamer'));
            }
        }

        const id = 'friendship-' + Date.now();
        await models.Friendship.create({
            id,
            user_uid_1: myUid,
            user_uid_2: targetUser.uid,
            status: 'Pending',
            sender_uid: myUid
        });

        res.status(201).json({
            success: true,
            message: `Friend request dispatched to ${targetUser.username}`
        });
    } catch (err) {
        next(err);
    }
};

// 2. Get Pending Friend Requests
const getFriendRequests = async (req, res, next) => {
    try {
        const myUid = req.user.uid;

        const pendingList = await models.Friendship.find({
            $or: [
                { user_uid_1: myUid },
                { user_uid_2: myUid }
            ],
            status: 'Pending',
            sender_uid: { $ne: myUid }
        }).lean();

        const requests = [];
        for (const item of pendingList) {
            const senderUid = item.sender_uid;
            const sender = await models.User.findOne({ uid: senderUid }).select('username uid avatar').lean();
            if (sender) {
                requests.push({
                    id: item.id,
                    sender: {
                        username: sender.username,
                        uid: sender.uid,
                        avatar: sender.avatar
                    }
                });
            }
        }

        res.json({ success: true, requests });
    } catch (err) {
        next(err);
    }
};

// 3. Accept Friend Request
const acceptFriendRequest = async (req, res, next) => {
    try {
        const { friendshipId } = req.body;
        const myUid = req.user.uid;

        if (!friendshipId) {
            res.status(400);
            return next(new Error('Friendship ID is required'));
        }

        const friendship = await models.Friendship.findOne({ id: friendshipId });
        if (!friendship) {
            res.status(404);
            return next(new Error('Friend request not found'));
        }

        if (friendship.user_uid_1 !== myUid && friendship.user_uid_2 !== myUid) {
            res.status(403);
            return next(new Error('Access denied: You are not a party to this request'));
        }

        await models.Friendship.updateOne({ id: friendshipId }, { $set: { status: 'Accepted' } });

        res.json({ success: true, message: 'Friend request accepted! You can now chat.' });
    } catch (err) {
        next(err);
    }
};

// 4. Decline/Reject Friend Request
const rejectFriendRequest = async (req, res, next) => {
    try {
        const { friendshipId } = req.body;
        const myUid = req.user.uid;

        if (!friendshipId) {
            res.status(400);
            return next(new Error('Friendship ID is required'));
        }

        const result = await models.Friendship.deleteOne({
            id: friendshipId,
            $or: [
                { user_uid_1: myUid },
                { user_uid_2: myUid }
            ]
        });

        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Friend request not found or unauthorized'));
        }

        res.json({ success: true, message: 'Friend request declined' });
    } catch (err) {
        next(err);
    }
};

// 5. Get Friend List
const getFriends = async (req, res, next) => {
    try {
        const myUid = req.user.uid;

        const list = await models.Friendship.find({
            $or: [
                { user_uid_1: myUid },
                { user_uid_2: myUid }
            ],
            status: 'Accepted'
        }).lean();

        const friends = [];
        for (const item of list) {
            const friendUid = item.user_uid_1 === myUid ? item.user_uid_2 : item.user_uid_1;
            const friend = await models.User.findOne({ uid: friendUid }).select('username uid avatar').lean();
            if (friend) {
                friends.push(friend);
            }
        }

        res.json({ success: true, friends });
    } catch (err) {
        next(err);
    }
};

// 6. Send Direct Message
const sendChatMessage = async (req, res, next) => {
    try {
        const { receiverUid, message, content } = req.body;
        const myUid = req.user.uid;
        const msgText = (message || content || '').trim();

        if (!receiverUid || !msgText) {
            res.status(400);
            return next(new Error('Receiver and non-empty message body are required'));
        }

        // Verify they are friends
        const isFriend = await models.Friendship.exists({
            $or: [
                { user_uid_1: myUid, user_uid_2: receiverUid },
                { user_uid_1: receiverUid, user_uid_2: myUid }
            ],
            status: 'Accepted'
        });

        if (!isFriend) {
            res.status(403);
            return next(new Error('Access Denied: You can only chat with established friends'));
        }

        const id = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const msg = await models.ChatMessage.create({
            id,
            sender_uid: myUid,
            receiver_uid: receiverUid,
            message: msgText,
            content: msgText,
            created_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: msg });
    } catch (err) {
        next(err);
    }
};

// 7. Get Direct Message History
const getChatMessageHistory = async (req, res, next) => {
    try {
        const myUid = req.user.uid;
        const { friendUid } = req.params;

        if (!friendUid) {
            res.status(400);
            return next(new Error('Friend Gamer UID is required'));
        }

        const history = await models.ChatMessage.find({
            $or: [
                { sender_uid: myUid, receiver_uid: friendUid },
                { sender_uid: friendUid, receiver_uid: myUid }
            ]
        })
        .sort({ created_at: 1 })
        .limit(100)
        .lean();

        const messages = history.map(msg => ({
            ...msg,
            content: msg.message || msg.content,
            message: msg.message || msg.content
        }));
        res.json({ success: true, messages, history: messages });
    } catch (err) {
        next(err);
    }
};

// 8. Send Team Chat Message
const sendTeamMessage = async (req, res, next) => {
    try {
        const { message, content } = req.body;
        const user = req.user;
        const msgText = (message || content || '').trim();

        if (!msgText) {
            res.status(400);
            return next(new Error('Non-empty message body is required'));
        }

        // Find user's team
        let team = await models.Team.findOne({ captain_uid: user.uid }).lean();
        if (!team) {
            const memberRecord = await models.TeamMember.findOne({ user_uid: user.uid, confirmed: true }).lean();
            if (memberRecord) {
                team = await models.Team.findOne({ id: memberRecord.team_id }).lean();
            }
        }

        if (!team) {
            res.status(403);
            return next(new Error('Access Denied: You must belong to an active esports squad to use team chat'));
        }

        const id = 'teamsg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const msg = await models.TeamMessage.create({
            id,
            team_id: team.id,
            sender_uid: user.uid,
            sender_name: user.username,
            sender_avatar: user.avatar,
            message: msgText,
            content: msgText,
            created_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: msg });
    } catch (err) {
        next(err);
    }
};

// 9. Get Team Chat History
const getTeamMessageHistory = async (req, res, next) => {
    try {
        const user = req.user;

        // Find user's team
        let team = await models.Team.findOne({ captain_uid: user.uid }).lean();
        if (!team) {
            const memberRecord = await models.TeamMember.findOne({ user_uid: user.uid, confirmed: true }).lean();
            if (memberRecord) {
                team = await models.Team.findOne({ id: memberRecord.team_id }).lean();
            }
        }

        if (!team) {
            res.status(403);
            return next(new Error('Access Denied: You must belong to an active esports squad to use team chat'));
        }

        const history = await models.TeamMessage.find({ team_id: team.id })
            .sort({ created_at: 1 })
            .limit(100)
            .lean();

        const messages = history.map(msg => ({
            ...msg,
            content: msg.message || msg.content,
            message: msg.message || msg.content
        }));
        res.json({ success: true, messages, history: messages });
    } catch (err) {
        next(err);
    }
};

const confirmAttendance = async (req, res, next) => {
    try {
        const { regId, status } = req.query;
        if (!regId || !status) {
            return res.status(400).send(`
                <html>
                <head><title>Invalid Request</title></head>
                <body style="background:#0a0a0f; color:#fff; font-family:sans-serif; text-align:center; padding:100px;">
                    <h1 style="color:#ef4444;">INVALID VERIFICATION TRANSMISSION</h1>
                    <p>Parameters regId and status are required.</p>
                </body>
                </html>
            `);
        }

        const registration = await models.Registration.findOne({ id: regId }).lean();
        if (!registration) {
            return res.status(404).send(`
                <html>
                <head><title>Not Found</title></head>
                <body style="background:#0a0a0f; color:#fff; font-family:sans-serif; text-align:center; padding:100px;">
                    <h1 style="color:#ef4444;">REGISTRATION NOT FOUND</h1>
                    <p>We could not retrieve the tournament entry for registration ID: ${regId}.</p>
                </body>
                </html>
            `);
        }

        let dbStatus = 'Pending';
        let stage = registration.stage || 1;
        let responseMessage = '';

        if (status === 'Confirmed') {
            dbStatus = 'Approved';
            stage = 3;
            responseMessage = 'Your attendance has been confirmed and locked. Good luck on the battlefield!';
        } else if (status === 'Declined') {
            dbStatus = 'Rejected';
            responseMessage = 'You have declined attendance. Your registration slot has been released.';
        } else {
            return res.status(400).send(`
                <html>
                <head><title>Invalid Status</title></head>
                <body style="background:#0a0a0f; color:#fff; font-family:sans-serif; text-align:center; padding:100px;">
                    <h1 style="color:#ef4444;">INVALID STATUS VALUE</h1>
                    <p>Status must be Confirmed or Declined.</p>
                </body>
                </html>
            `);
        }

        await models.Registration.updateOne(
            { id: regId },
            { $set: { status: dbStatus, stage } }
        );

        try {
            const emailService = require('../utils/emailService');
            await emailService.notifyRegistrationStatusChange(regId, dbStatus);
        } catch (emailErr) {
            console.error('Failed to send status update email to team:', emailErr.message);
        }

        // Render a modern, professional, responsive HTML page matching the theme of Strikz Esports
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Attendance Locked - Strikz Esports</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&display=swap');
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #050508;
                        color: #ffffff;
                        font-family: 'Rajdhani', 'Segoe UI', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .container {
                        background-color: #0a0a0f;
                        border: 1.5px solid ${status === 'Confirmed' ? '#ffe600' : '#ef4444'};
                        border-radius: 8px;
                        padding: 40px;
                        max-width: 500px;
                        width: 90%;
                        text-align: center;
                        box-shadow: 0 0 30px ${status === 'Confirmed' ? 'rgba(255, 230, 0, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
                    }
                    h1 {
                        color: ${status === 'Confirmed' ? '#ffe600' : '#ef4444'};
                        font-size: 28px;
                        font-weight: 800;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
                        margin-top: 0;
                    }
                    p {
                        color: #d1d5db;
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    .btn {
                        background: ${status === 'Confirmed' ? '#ffe600' : 'rgba(255,255,255,0.05)'};
                        color: ${status === 'Confirmed' ? '#000000' : '#ffffff'};
                        border: ${status === 'Confirmed' ? 'none' : '1px solid rgba(255,255,255,0.2)'};
                        padding: 12px 30px;
                        border-radius: 4px;
                        font-weight: 800;
                        font-size: 14px;
                        letter-spacing: 0.05em;
                        text-decoration: none;
                        display: inline-block;
                        margin-top: 25px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }
                    .btn:hover {
                        transform: scale(1.05);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="https://www.strikzesports.in/assets/logo.png" alt="Strikz Logo" style="width: 80px; height: 80px; margin-bottom: 20px;">
                    <h1>${status === 'Confirmed' ? 'ATTENDANCE LOCKED' : 'REGISTRATION DECLINED'}</h1>
                    <p>${responseMessage}</p>
                    <a href="https://www.strikzesports.in/#/" class="btn">RETURN TO MAIN TERMINAL</a>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    sendChatMessage,
    getChatMessageHistory,
    sendTeamMessage,
    getTeamMessageHistory,
    confirmAttendance
};
