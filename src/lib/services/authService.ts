import { getDb } from '../db';
import { UserRole, UserSession } from '../types';

export function authenticateUser(username: string, passwordAttempt: string): { success: boolean; session?: UserSession; message?: string } {
  const db = getDb();
  const now = new Date();
  const nowIso = now.toISOString();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    return { success: false, message: 'Invalid credentials.' };
  }

  // Check account lockout (Req 8.4: 5 failed attempts -> 30 min lockout)
  if (user.locked_until) {
    const lockExpiry = new Date(user.locked_until);
    if (now < lockExpiry) {
      const remainingMins = Math.ceil((lockExpiry.getTime() - now.getTime()) / (60 * 1000));
      return {
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMins} minutes.`
      };
    } else {
      // Lock expired, reset failed counter
      db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE username = ?').run(username);
    }
  }

  // Verify password (demo comparison)
  if (user.password_hash !== passwordAttempt) {
    const newFailedCount = (user.failed_login_attempts || 0) + 1;
    let lockTime: string | null = null;

    if (newFailedCount >= 5) {
      // Lock account for 30 minutes
      lockTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    }

    db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE username = ?')
      .run(newFailedCount, lockTime, username);

    return {
      success: false,
      message: newFailedCount >= 5
        ? 'Account has been locked for 30 minutes due to 5 consecutive failed login attempts.'
        : `Invalid credentials. Failed attempts: ${newFailedCount}/5.`
    };
  }

  // Successful login -> Reset failed attempts
  db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE username = ?').run(username);

  // Log audit
  db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(username, nowIso, 'LOGIN', username, `User logged in with role '${user.role}'`);

  const session: UserSession = {
    user_id: username,
    username: username,
    role: user.role as UserRole,
    login_timestamp: nowIso,
    last_activity: nowIso
  };

  return { success: true, session };
}

export function logAuditAction(userId: string, actionType: string, affectedResourceId: string, details?: string) {
  const db = getDb();
  db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(userId, new Date().toISOString(), actionType, affectedResourceId, details || null);
}

export function getAuditLogs(): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200').all();
}
