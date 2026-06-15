const nodemailer = require('nodemailer');
const { models, nextNumberId } = require('../config/db');
require('dotenv').config();

const getFromAddress = () => {
    return process.env.BREVO_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SUPPORT_EMAIL || 'support@strikzesports.com';
};

const getFromName = () => {
    return process.env.EMAIL_FROM_NAME || 'Strikz Esports';
};

const logEmail = async ({ logId, recipient, subject, type, status, messageId, error }) => {
    await models.EmailLog.create({
        id: logId,
        recipient,
        subject,
        type: type || 'General',
        status,
        messageId,
        error_message: error,
        sent_at: new Date().toISOString()
    });
};

const sendWithResend = async (mailOptions, type, logId) => {
    if (!process.env.RESEND_API_KEY) return null;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: mailOptions.from,
            to: [mailOptions.to],
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text || undefined
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = payload.message || payload.error || `Resend API failed with status ${response.status}`;
        await logEmail({
            logId,
            recipient: mailOptions.to,
            subject: mailOptions.subject,
            type,
            status: 'Failed',
            error: message
        });
        return { success: false, error: message };
    }

    const messageId = payload.id || `resend-${Date.now()}`;
    await logEmail({
        logId,
        recipient: mailOptions.to,
        subject: mailOptions.subject,
        type,
        status: 'Success',
        messageId
    });
    return { success: true, messageId };
};

const sendWithBrevo = async (mailOptions, type, logId) => {
    if (!process.env.BREVO_API_KEY) return null;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: getFromName(),
                email: process.env.BREVO_FROM_EMAIL || getFromAddress()
            },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
            textContent: mailOptions.text || undefined
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = payload.message || payload.error || `Brevo API failed with status ${response.status}`;
        await logEmail({
            logId,
            recipient: mailOptions.to,
            subject: mailOptions.subject,
            type,
            status: 'Failed',
            error: message
        });
        return { success: false, error: message };
    }

    const messageId = payload.messageId || payload.messageIds?.[0] || `brevo-${Date.now()}`;
    await logEmail({
        logId,
        recipient: mailOptions.to,
        subject: mailOptions.subject,
        type,
        status: 'Success',
        messageId
    });
    return { success: true, messageId };
};

// Create transporter helper
const getTransporter = async () => {
    // Dynamically query SMTP settings from database or fallback to .env
    const setting = await models.EmailSetting.findOne({ id: 1 }).lean();
    const smtpHost = (setting && setting.smtpHost) || process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const smtpPort = (setting && setting.smtpPort) || process.env.SMTP_PORT || 2525;
    const smtpUser = (setting && setting.smtpUser) || process.env.SMTP_USER || '';
    const smtpPass = (setting && setting.smtpPass) || process.env.SMTP_PASS || '';
    
    if (smtpUser && smtpPass) {
        return nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });
    }
    return null;
};

// Check if email type is set to automatic control
const isAutomaticEnabled = async (emailType) => {
    const setting = await models.EmailSetting.findOne({ id: 1 }).lean();
    if (!setting) return true; // Default to true if not configured yet
    return setting[emailType] === 'automatic' || setting[emailType] === true;
};

// Send an actual email directly
const sendEmailDirect = async (options) => {
    const transporter = await getTransporter();
    const fromAddress = getFromAddress();
    const mailOptions = {
        from: `${getFromName()} <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || ''
    };

    if (options.attachments) {
        mailOptions.attachments = options.attachments;
    }

    const logId = 'log-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);

    const brevoResult = await sendWithBrevo(mailOptions, options.type, logId);
    if (brevoResult) {
        if (!brevoResult.success) {
            console.error(`[BREVO EMAIL ERROR] ${brevoResult.error}`);
        }
        return brevoResult;
    }

    const resendResult = await sendWithResend(mailOptions, options.type, logId);
    if (resendResult) {
        if (!resendResult.success) {
            console.error(`[RESEND EMAIL ERROR] ${resendResult.error}`);
        }
        return resendResult;
    }
    
    if (transporter) {
        try {
            const info = await transporter.sendMail(mailOptions);
            await logEmail({
                logId,
                recipient: options.to,
                subject: options.subject,
                type: options.type || 'General',
                status: 'Success',
                messageId: info.messageId
            });
            return { success: true, messageId: info.messageId };
        } catch (err) {
            console.error(`[EMAIL DIRECT ERROR] ${err.message}`);
            await logEmail({
                logId,
                recipient: options.to,
                subject: options.subject,
                type: options.type || 'General',
                status: 'Failed',
                error: err.message
            });
            return { success: false, error: err.message };
        }
    } else {
        const error = 'No email provider configured. Add BREVO_API_KEY and BREVO_FROM_EMAIL, or configure Resend/SMTP credentials.';
        console.error(`[EMAIL CONFIG ERROR] ${error}`);
        await logEmail({
            logId,
            recipient: options.to,
            subject: options.subject,
            type: options.type || 'General',
            status: 'Failed',
            error
        });
        return { success: false, error };
    }
};

// Queue email helper
const queueEmail = async (options) => {
    try {
        const id = 'q-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
        await models.EmailQueue.create({
            id,
            to: options.to,
            subject: options.subject,
            html: options.html,
            type: options.type || 'General',
            status: 'Pending',
            attempts: 0,
            scheduled_at: options.scheduledAt || new Date().toISOString(),
            attachments: options.attachments || null
        });
        return true;
    } catch (e) {
        console.error('Failed to queue email:', e);
        return false;
    }
};

// Reusable premium HTML Template Wrapper
const getHtmlWrapper = (content) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Strikz Esports Arena</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: 'Rajdhani', 'Segoe UI', Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0a0a0f; border: 1.5px solid #ffe600; border-radius: 8px; overflow: hidden; box-shadow: 0 0 25px rgba(255, 230, 0, 0.15);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                            <img src="https://strikz-esports.onrender.com/assets/logo.png" alt="Strikz Logo" style="width: 70px; height: 70px; display: block; margin-bottom: 10px;">
                            <h2 style="margin: 0; color: #ff5e00; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">STRIKZ ESPORTS</h2>
                            <p style="margin: 5px 0 0 0; color: #00f0ff; font-size: 11px; font-weight: 700; letter-spacing: 0.2em;">THE ULTIMATE FREE FIRE MAX ARENA</p>
                        </td>
                    </tr>
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 30px 25px; color: #d1d5db; font-size: 14px; line-height: 1.6; background-color: rgba(255, 255, 255, 0.01);">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 25px; border-top: 1px solid rgba(255, 255, 255, 0.05); background-color: #07070a; color: #6b7280; font-size: 11px;">
                            <p style="margin: 0 0 8px 0;">Follow the battlefield updates on our official social frequencies:</p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="https://discord.gg/strikz-esports" style="color: #00f0ff; text-decoration: none; margin: 0 5px;">Discord</a> |
                                <a href="https://instagram.com/strikzesports.in" style="color: #ffffe0; text-decoration: none; margin: 0 5px;">Instagram</a> |
                                <a href="https://youtube.com/strikz-esports" style="color: #ff5e00; text-decoration: none; margin: 0 5px;">YouTube</a>
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #4b5563;">&copy; 2026 Strikz Esports. All rights reserved. Automated Transmission Secure Link.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

// 1. Send OTP Registration Code
const sendOtpEmail = async (email, username, otpCode) => {
    const content = `
        <h3 style="color: #ffffff; font-size: 18px; margin-top: 0;">SECURE GATE OTP DISPATCH</h3>
        <p>Hello Survivor <strong>${username}</strong>,</p>
        <p>Welcome to Strikz Esports Arena! To complete your terminal profile activation, please utilize the 6-digit verification key below:</p>
        <div style="background: rgba(255,230,0,0.05); border: 1px dashed #ffe600; padding: 15px; border-radius: 4px; text-align: center; font-size: 26px; font-weight: 800; color: #ffe600; letter-spacing: 0.2em; margin: 25px 0; font-family: Courier, monospace;">
            ${otpCode}
        </div>
        <p style="color: #ef4444; font-size: 12px; font-weight: bold;">Warning: This verification key expires in 10 minutes. If you did not initiate this activation request, you can safely discard this transmission.</p>
    `;
    
    const html = getHtmlWrapper(content);
    const result = await sendEmailDirect({
        to: email,
        subject: 'Strikz Esports - OTP Account Activation',
        html,
        type: 'OTP Verification'
    });

    if (!result || !result.success) {
        throw new Error(result && result.error ? result.error : 'Failed to send OTP email');
    }

    return result;
};

// 2. Send Registration Confirmation Email
const sendRegistrationConfirmation = async (email, playerName, regId, tournamentName, tournamentDate, venue) => {
    const isAuto = await isAutomaticEnabled('regConfirmation');
    const content = `
        <h3 style="color: #00f0ff; font-size: 18px; margin-top: 0; display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00f0ff; margin-right:6px;"></span>
            CHAMPIONSHIP ENTRY LOCKED
        </h3>
        <p>Hello Gamer <strong>${playerName}</strong>,</p>
        <p>Your squad/solo registration entry for the upcoming tournament has been received successfully!</p>
        
        <table width="100%" style="border-collapse:collapse; margin: 20px 0; border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(255, 255, 255, 0.01);">
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 10px; color: #9ca3af; font-size: 12px; font-weight:bold;">REGISTRATION ID:</td>
                <td style="padding: 10px; color: #ffe600; font-weight: 800;">${regId}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 10px; color: #9ca3af; font-size: 12px; font-weight:bold;">TOURNAMENT:</td>
                <td style="padding: 10px; color: #ffffff; font-weight: 700;">${tournamentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 10px; color: #9ca3af; font-size: 12px; font-weight:bold;">DATE & TIME:</td>
                <td style="padding: 10px; color: #ffffff;">${tournamentDate}</td>
            </tr>
            <tr>
                <td style="padding: 10px; color: #9ca3af; font-size: 12px; font-weight:bold;">VENUE / SERVER:</td>
                <td style="padding: 10px; color: #ffffff;">${venue}</td>
            </tr>
        </table>
        
        <p>Please ensure all team members coordinate in the Team HQ and join our official Discord server for lobby codes and referee broadcasts.</p>
        
        <p style="font-size: 12px; color:#9ca3af; border-top: 1px solid rgba(255,255,255,0.05); padding-top:12px; margin-top:20px;">
            Need terminal support? Reach out to <a href="mailto:support@strikzesports.com" style="color:#00f0ff;">support@strikzesports.com</a>
        </p>
    `;
    
    const html = getHtmlWrapper(content);
    const emailData = {
        to: email,
        subject: `Registration Confirmed: ${tournamentName}`,
        html,
        type: 'Registration Confirmation'
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

// 3. Send Tournament Invitation Email
const sendTournamentInvitation = async (email, username, tournament) => {
    const isAuto = await isAutomaticEnabled('invites');
    const content = `
        <h3 style="color: #ff5e00; font-size: 18px; margin-top: 0;">CHALLENGE ISSUED: BATTLE ROYAL QUALIFIERS</h3>
        <p>Hello Survivor <strong>${username}</strong>,</p>
        <p>You have been selected as an eligible contender to participate in the upcoming championship:</p>
        
        <div style="background: rgba(255, 94, 0, 0.03); border: 1px solid rgba(255, 94, 0, 0.2); padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin:0 0 10px 0; color:#fff; font-size:16px;">${tournament.name}</h4>
            <ul style="margin: 0; padding-left: 20px; color:#d1d5db; font-size: 13px;">
                <li style="margin-bottom: 5px;"><strong>Date:</strong> ${tournament.startDate}</li>
                <li style="margin-bottom: 5px;"><strong>Format:</strong> ${tournament.mode} (${tournament.category})</li>
                <li style="margin-bottom: 5px;"><strong>Prize Pool:</strong> <span style="color: #ffe600; font-weight: bold;">${tournament.prizePool}</span></li>
                <li style="margin-bottom: 5px;"><strong>Reg Close:</strong> ${tournament.regCloseDate}</li>
            </ul>
        </div>
        
        <p>Do you have what it takes to assert dominance and claim your share of the bounty? Lock in your team roster before the gate closes.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://strikz-esports.onrender.com/#/registration" style="background: #ff5e00; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 0 15px rgba(255,94,0,0.3);">
                REGISTER Roster NOW
            </a>
        </div>
    `;
    
    const html = getHtmlWrapper(content);
    const emailData = {
        to: email,
        subject: `Battle Invitation: ${tournament.name}`,
        html,
        type: 'Tournament Invitation'
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

// 4. Send Registration Reminder Email
const sendRegistrationReminder = async (email, username, tournament, daysLeft) => {
    const isAuto = await isAutomaticEnabled('reminders');
    const content = `
        <h3 style="color: #ffe600; font-size: 18px; margin-top: 0;">TERMINAL URGENT: REGISTRATION WARNING</h3>
        <p>Hello Survivor <strong>${username}</strong>,</p>
        <p>This is a countdown notification. Only <strong>${daysLeft} days</strong> remain to register for the tournament: <strong>${tournament.name}</strong>.</p>
        
        <table width="100%" style="border-collapse:collapse; margin: 20px 0; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
            <tr>
                <td style="padding: 10px; color:#9ca3af; font-size:12px;">REGISTRATION CLOSE:</td>
                <td style="padding: 10px; color:#ffe600; font-weight:bold;">${tournament.regCloseDate}</td>
            </tr>
            <tr>
                <td style="padding: 10px; color:#9ca3af; font-size:12px;">PRIZE POOL:</td>
                <td style="padding: 10px; color:#fff; font-weight:bold;">${tournament.prizePool}</td>
            </tr>
            <tr>
                <td style="padding: 10px; color:#9ca3af; font-size:12px;">VENUE:</td>
                <td style="padding: 10px; color:#fff;">${tournament.rules ? 'Server Lobby' : 'Bermuda Arena Office'}</td>
            </tr>
        </table>

        <div style="text-align: center; margin: 25px 0;">
            <a href="https://strikz-esports.onrender.com/#/registration" style="background: #ffe600; color: #000000; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em; display: inline-block;">
                LOCK IN REGISTRATION
            </a>
        </div>
    `;
    
    const html = getHtmlWrapper(content);
    const emailData = {
        to: email,
        subject: `Countdown Alert: ${daysLeft} Days to Register for ${tournament.name}`,
        html,
        type: 'Registration Reminder'
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

// 5. Send Participation Attendance Confirmation Link
const sendAttendanceConfirmation = async (email, playerName, regId, tournamentName) => {
    const isAuto = await isAutomaticEnabled('attendanceConfirm');
    const confirmUrl = `https://strikz-esports.onrender.com/api/v1/my-team/confirm-attendance?regId=${encodeURIComponent(regId)}&status=Confirmed`;
    const declineUrl = `https://strikz-esports.onrender.com/api/v1/my-team/confirm-attendance?regId=${encodeURIComponent(regId)}&status=Declined`;
    
    const content = `
        <h3 style="color: #00f0ff; font-size: 18px; margin-top: 0;">SQUAD ATTENDANCE LOCK REQUIRED</h3>
        <p>Hello Gamer <strong>${playerName}</strong>,</p>
        <p>Your registration entry <strong>${regId}</strong> has been parsed. To avoid roster holds, please verify your attendance for <strong>${tournamentName}</strong> below:</p>
        
        <div style="display:flex; justify-content:center; gap:20px; margin:30px 0; text-align:center;">
            <a href="${confirmUrl}" style="background: #ffe600; color: #00; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: 800; display: inline-block; margin-right: 15px;">
                CONFIRM ATTENDANCE
            </a>
            <a href="${declineUrl}" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; text-decoration: none; padding: 11px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">
                DECLINE ENTRY
            </a>
        </div>
        
        <p style="font-size:12px; color:var(--text-dim);">By confirming attendance, your team slot will be officially bracketed. Declining will forfeit your reservation and allow other pending players to join.</p>
    `;
    
    const html = getHtmlWrapper(content);
    const emailData = {
        to: email,
        subject: `Attendance Lock: ${tournamentName}`,
        html,
        type: 'Attendance Confirmation'
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

// 6. Send Attendance Reminder Email
const sendAttendanceReminder = async (email, playerName, regId, tournamentName, hoursLeft) => {
    const isAuto = await isAutomaticEnabled('reminders');
    const confirmUrl = `https://strikz-esports.onrender.com/api/v1/my-team/confirm-attendance?regId=${encodeURIComponent(regId)}&status=Confirmed`;
    
    const content = `
        <h3 style="color: #ff5e00; font-size: 18px; margin-top: 0;">FINAL NOTICE: ATTENDANCE SLOT WARNING</h3>
        <p>Hello Gamer <strong>${playerName}</strong>,</p>
        <p>This is a warning transmission. You have not confirmed attendance for <strong>${tournamentName}</strong>.</p>
        <p>Roster validation closes soon. If you do not click confirm within <strong>${hoursLeft} hours</strong>, your tournament ticket registration will be deleted.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #00f0ff; color: #000000; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 0 15px rgba(0,240,255,0.3);">
                CONFIRM ATTENDANCE NOW
            </a>
        </div>
    `;
    
    const html = getHtmlWrapper(content);
    const emailData = {
        to: email,
        subject: `Action Required: Attendance Reminder for ${tournamentName}`,
        html,
        type: 'Attendance Reminder'
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

// 7. Send Tournament Update (Schedule, rules or emergency broadcasts)
const sendTournamentUpdate = async (email, playerName, tournamentName, updateType, updateMessage) => {
    const isAuto = await isAutomaticEnabled('updates');
    const content = `
        <h3 style="color: #ef4444; font-size: 18px; margin-top: 0; display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; margin-right:6px; animation: pulse 1s infinite;"></span>
            ARENA BROADCAST: ${updateType.toUpperCase()}
        </h3>
        <p>Hello Survivor <strong>${playerName}</strong>,</p>
        <p>An official tournament update has been dispatched for <strong>${tournamentName}</strong>:</p>
        
        <div style="background: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 0 4px 4px 0; margin: 20px 0; color: #ffffff; font-size: 13.5px; line-height: 1.6;">
            ${updateMessage}
        </div>
        
        <p>Please align your squad roster and review the rules lobby. Check our platform dashboard for updated schedule files.</p>
    `;
    
    const html = getHtmlWrapper(content);
    const emailData = {
        to: email,
        subject: `Tournament Update: ${updateType} - ${tournamentName}`,
        html,
        type: 'Tournament Update'
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

// 8. Send Results & Winner Notification
const sendResultsNotification = async (email, playerName, tournamentName, winnerName, resultsSummary, certificateBase64) => {
    const isAuto = await isAutomaticEnabled('results');
    const isWinner = playerName.toLowerCase() === winnerName.toLowerCase();
    
    const content = `
        <h3 style="color: ${isWinner ? '#ffe600' : '#00f0ff'}; font-size: 18px; margin-top: 0;">TOURNAMENT OPERATIONS CONCLUDED</h3>
        <p>Hello Gamer <strong>${playerName}</strong>,</p>
        
        ${isWinner ? `
            <div style="background: rgba(255, 230, 0, 0.05); border: 1.5px solid #ffe600; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
                <h2 style="color: #ffe600; margin: 0 0 10px 0; font-size: 22px;">🏆 CHAMPION CLAIMED 🏆</h2>
                <p style="margin: 0; color: #fff;">Congratulations! Your squad has claimed the ultimate crown in the <strong>${tournamentName}</strong>!</p>
            </div>
        ` : `
            <p>The brackets have concluded for <strong>${tournamentName}</strong>. Thank you for entering the arena and demonstrating elite strategic gameplay.</p>
        `}
        
        <h4 style="color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; margin-top: 25px;">ARENA STANDINGS</h4>
        <div style="font-size: 13px; color: #d1d5db; line-height: 1.6; background: rgba(0,0,0,0.15); padding: 15px; border-radius: 4px;">
            ${resultsSummary.replace(/\n/g, '<br>')}
        </div>
        
        ${certificateBase64 ? `
            <p style="margin-top: 20px;">We have generated your official Strikz Arena participation certificate and attached it to this transmission as a secure PDF document. Show it off to your guildmates!</p>
        ` : ''}
    `;
    
    const html = getHtmlWrapper(content);
    
    const attachments = [];
    if (certificateBase64) {
        attachments.push({
            filename: `Strikz_Certificate_${tournamentName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
            content: Buffer.from(certificateBase64, 'base64'),
            contentType: 'application/pdf'
        });
    }

    const emailData = {
        to: email,
        subject: isWinner ? `Booyah! Congratulations Champion of ${tournamentName}!` : `Standings Concluded: ${tournamentName}`,
        html,
        type: 'Results & Winners',
        attachments: attachments.length > 0 ? attachments : null
    };
    
    if (isAuto) {
        return await sendEmailDirect(emailData);
    } else {
        return await queueEmail(emailData);
    }
};

module.exports = {
    sendEmailDirect,
    queueEmail,
    sendOtpEmail,
    sendRegistrationConfirmation,
    sendTournamentInvitation,
    sendRegistrationReminder,
    sendAttendanceConfirmation,
    sendAttendanceReminder,
    sendTournamentUpdate,
    sendResultsNotification,
    getHtmlWrapper
};
