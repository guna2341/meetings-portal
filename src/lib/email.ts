import nodemailer from 'nodemailer';

// ─── Singleton transporter ────────────────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,   // your Gmail address
      pass: process.env.GMAIL_APP_PASS, // Gmail App Password (not your login password)
    },
  });

  return transporter;
}

// ─── Email Payloads ───────────────────────────────────────────────────────────

export interface InvitationEmailPayload {
  to: string;           // invitee email
  inviteUrl: string;    // full invite link with token
  orgName: string;      // organization name
  role: string;         // role being granted
  invitedByName: string; // name/email of the person who invited
  expiresAt: Date;      // expiry time
}

export interface MeetingReminderEmailPayload {
  to: string;
  meetingTitle: string;
  meetingTime: string;
  meetingDate: string;
  meetingLink?: string;
  organizerName: string;
}

// ─── HTML Templates ────────────────────────────────────────────────────────────

function buildInvitationEmail(payload: InvitationEmailPayload): string {
  const { inviteUrl, orgName, role, invitedByName, expiresAt } = payload;

  const expiresFormatted = expiresAt.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:0;height:6px;"></td>
          </tr>

          <!-- Logo / App name -->
          <tr>
            <td align="center" style="padding:36px 40px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;
                              width:44px;height:44px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:22px;font-weight:700;line-height:44px;">M</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">MeetHub</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 40px;">

              <!-- Org avatar + title -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="width:64px;height:64px;border-radius:16px;
                                 background:linear-gradient(135deg,#4f46e5,#7c3aed);
                                 display:inline-block;text-align:center;line-height:64px;
                                 font-size:28px;font-weight:700;color:#fff;">
                      ${orgName[0].toUpperCase()}
                    </div>
                    <h1 style="margin:16px 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
                      You're invited to join
                    </h1>
                    <p style="margin:0;font-size:20px;font-weight:600;color:#4f46e5;">
                      ${orgName}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#64748b;font-size:13px;">Invited by</span>
                          <span style="float:right;color:#0f172a;font-weight:600;font-size:13px;">
                            ${invitedByName}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#64748b;font-size:13px;">Your role</span>
                          <span style="float:right;background:#ede9fe;color:#5b21b6;
                                      font-size:12px;font-weight:700;padding:3px 10px;
                                      border-radius:20px;">
                            ${roleCapitalized}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#64748b;font-size:13px;">Link expires</span>
                          <span style="float:right;color:#dc2626;font-size:13px;font-weight:600;">
                            ${expiresFormatted} (IST)
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);
                               color:#ffffff;font-size:15px;font-weight:600;padding:14px 40px;
                               border-radius:12px;text-decoration:none;letter-spacing:0.2px;
                               box-shadow:0 4px 14px rgba(79,70,229,0.4);">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Or copy link -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 10px;font-size:13px;color:#94a3b8;">
                      Or copy this link into your browser:
                    </p>
                    <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;
                                padding:10px 16px;font-size:12px;color:#475569;
                                word-break:break-all;font-family:monospace;">
                      ${inviteUrl}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Decline note -->
              <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
                If you don't want to join, simply ignore this email.<br/>
                This invitation will expire automatically.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;"/>

              <!-- Footer -->
              <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;line-height:1.6;">
                This email was sent by <strong>MeetHub</strong> on behalf of
                <strong>${invitedByName}</strong>.<br/>
                If you weren't expecting this, you can safely ignore it.
              </p>

            </td>
          </tr>

          <!-- Bottom bar -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                        padding:16px 40px;text-align:center;">
              <span style="font-size:12px;color:#94a3b8;">
                © 2026 MeetHub. All rights reserved.
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildReminderEmail(payload: MeetingReminderEmailPayload): string {
  const { meetingTitle, meetingTime, meetingDate, meetingLink, organizerName } = payload;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Meeting Starting: ${meetingTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header alert bar -->
          <tr>
            <td style="background:#ef4444;padding:12px;text-align:center;color:#ffffff;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">
              Meeting starts in 1 minute
            </td>
          </tr>

          <!-- Logo / App name -->
          <tr>
            <td align="center" style="padding:32px 40px 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#ef4444,#f97316);border-radius:10px;
                              width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:700;line-height:36px;">M</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;">MeetHub reminder</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">
                ${meetingTitle}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;text-align:center;">
                Your meeting with <strong>${organizerName}</strong> is starting soon.
              </p>

              <!-- Meeting Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="color:#64748b;font-size:13px;display:block;margin-bottom:2px;">When</span>
                          <span style="color:#0f172a;font-weight:600;font-size:15px;">
                            Today · ${meetingTime}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="color:#64748b;font-size:13px;display:block;margin-bottom:2px;">Location</span>
                          <span style="color:#0f172a;font-weight:600;font-size:15px;">
                            ${meetingLink ? 'Online Meeting' : 'In-person Meeting'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              ${meetingLink ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${meetingLink}"
                      style="display:inline-block;background:#2563eb;
                               color:#ffffff;font-size:15px;font-weight:700;padding:16px 48px;
                               border-radius:12px;text-decoration:none;
                               box-shadow:0 10px 15px -3px rgba(37,99,235,0.3);">
                      Join Meeting Now →
                    </a>
                  </td>
                </tr>
              </table>
              ` : `
              <p style="text-align:center;font-size:13px;color:#94a3b8;margin-bottom:24px;">
                Please head to the meeting location.
              </p>
              `}

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;"/>

              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                You are receiving this because you accepted or are pending for this meeting.<br/>
                Login to <strong>MeetHub</strong> to manage your schedule.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send functions ───────────────────────────────────────────────────────────

/**
 * Send an organization invitation email to the invitee's inbox.
 */
export async function sendInvitationEmail(
  payload: InvitationEmailPayload
): Promise<void> {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"MeetHub" <${process.env.GMAIL_USER}>`,
    to: payload.to,
    subject: `You're invited to join ${payload.orgName} on MeetHub`,
    html: buildInvitationEmail(payload),
    text: `
You have been invited to join ${payload.orgName} on MeetHub as ${payload.role}.

Invited by: ${payload.invitedByName}
Expires at: ${payload.expiresAt.toISOString()}

Click the link below to accept or decline:
${payload.inviteUrl}

If you weren't expecting this, ignore this email.
    `.trim(),
  });
}

/**
 * Send a meeting reminder email.
 */
export async function sendMeetingReminderEmail(
  payload: MeetingReminderEmailPayload
): Promise<void> {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"MeetHub" <${process.env.GMAIL_USER}>`,
    to: payload.to,
    subject: `REMINDER: ${payload.meetingTitle} is starting now!`,
    html: buildReminderEmail(payload),
    text: `
Your meeting "${payload.meetingTitle}" with ${payload.organizerName} is starting soon (at ${payload.meetingTime}).

${payload.meetingLink ? `Join here: ${payload.meetingLink}` : 'Please head to the meeting location.'}

Sent by MeetHub.
    `.trim(),
  });
}
