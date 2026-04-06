import type { LaundrySession } from "../db/database.js";

export function formatDateTime(value: string | null) {
    if (!value) {
        return "Not recorded";
    }

    return new Date(value).toLocaleString();
}

export function formatSeconds(value: number | null) {
    if (value === null) {
        return "Not set";
    }

    return `${value} seconds`;
}

export function formatDuration(totalSeconds: number) {
    const clampedSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(clampedSeconds / 3600);
    const minutes = Math.floor((clampedSeconds % 3600) / 60);
    const seconds = clampedSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
}

function getRemainingSeconds(endsAt: string | null, now = Date.now()) {
    if (!endsAt) {
        return 0;
    }

    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
}

export function buildLaundryStatusText(session: LaundrySession, now = Date.now()) {
    const parts: string[] = [];

    if (session.washer_running === 1 && session.washer_ends_at) {
        parts.push(`Washer: ${formatDuration(getRemainingSeconds(session.washer_ends_at, now))} remaining.`);
    }

    if (session.dryer_running === 1 && session.dryer_ends_at) {
        parts.push(`Dryer: ${formatDuration(getRemainingSeconds(session.dryer_ends_at, now))} remaining.`);
    }

    return parts.join(" ");
}
