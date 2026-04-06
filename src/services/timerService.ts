import type { Client } from "discord.js";

import {
    getAllLaundrySessions,
    getLaundrySessionByUserId,
    getUserById,
    updateLaundrySession,
    type LaundrySession,
} from "../db/database.js";
import { sendDirectMessage } from "./dmService.js";

const activeTimers = new Map<string, NodeJS.Timeout>();

function getTimerKey(userId: number, phase: "washer" | "dryer") {
    return `${phase}:${userId}`;
}

function clearTimer(userId: number, phase: "washer" | "dryer") {
    const key = getTimerKey(userId, phase);
    const timer = activeTimers.get(key);

    if (timer) {
        clearTimeout(timer);
        activeTimers.delete(key);
    }
}

function hasWashedLoadWaiting(session: LaundrySession) {
    return (
        session.loads_started_in_washer > session.loads_moved_to_dryer &&
        session.washer_running === 0
    );
}

async function handleWasherFinished(client: Client, userId: number) {
    clearTimer(userId, "washer");

    const session = getLaundrySessionByUserId(userId);

    if (!session || session.washer_running !== 1) {
        return;
    }

    const shouldAwaitMove = session.dryer_running === 0;
    const updatedSession = updateLaundrySession(session.id, {
        washerRunning: 0,
        washerEndsAt: null,
        awaitingMove: shouldAwaitMove ? 1 : session.awaiting_move,
    });

    if (shouldAwaitMove) {
        const user = getUserById(userId);

        if (user) {
            await sendDirectMessage(
                client,
                user.discord_id,
                "It is time to move your laundry. Run /movelaundry to continue."
            );
        }
    }

    syncLaundrySessionTimers(client, updatedSession);
}

async function handleDryerFinished(client: Client, userId: number) {
    clearTimer(userId, "dryer");

    const session = getLaundrySessionByUserId(userId);

    if (!session || session.dryer_running !== 1) {
        return;
    }

    const completedLoads = session.dryer_loads_completed + 1;
    const waitingToMove = hasWashedLoadWaiting(session);
    const isFinished = completedLoads >= session.total_loads;

    const updatedSession = updateLaundrySession(session.id, {
        dryerRunning: 0,
        dryerEndsAt: null,
        dryerLoadsCompleted: completedLoads,
        awaitingMove: waitingToMove && !isFinished ? 1 : 0,
        awaitingFinish: isFinished ? 1 : 0,
    });

    const user = getUserById(userId);

    if (!user) {
        syncLaundrySessionTimers(client, updatedSession);
        return;
    }

    if (isFinished) {
        await sendDirectMessage(
            client,
            user.discord_id,
            "Your laundry is done. Run /finishlaundry to record it."
        );
    } else if (waitingToMove) {
        await sendDirectMessage(
            client,
            user.discord_id,
            "It is time to move your laundry. Run /movelaundry to continue."
        );
    }

    syncLaundrySessionTimers(client, updatedSession);
}

function scheduleTimer(
    client: Client,
    userId: number,
    phase: "washer" | "dryer",
    endsAt: string,
    callback: () => Promise<void>
) {
    clearTimer(userId, phase);

    const delay = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const key = getTimerKey(userId, phase);

    activeTimers.set(
        key,
        setTimeout(() => {
            void callback();
        }, delay)
    );
}

export function clearLaundrySessionTimers(userId: number) {
    clearTimer(userId, "washer");
    clearTimer(userId, "dryer");
}

export function resetTimerService() {
    for (const timer of activeTimers.values()) {
        clearTimeout(timer);
    }

    activeTimers.clear();
}

export function syncLaundrySessionTimers(client: Client, session: LaundrySession) {
    clearLaundrySessionTimers(session.user_id);

    if (session.washer_running === 1 && session.washer_ends_at) {
        scheduleTimer(client, session.user_id, "washer", session.washer_ends_at, () =>
            handleWasherFinished(client, session.user_id)
        );
    }

    if (session.dryer_running === 1 && session.dryer_ends_at) {
        scheduleTimer(client, session.user_id, "dryer", session.dryer_ends_at, () =>
            handleDryerFinished(client, session.user_id)
        );
    }
}

export function initializeTimerService(client: Client) {
    const sessions = getAllLaundrySessions();

    for (const session of sessions) {
        syncLaundrySessionTimers(client, session);
    }
}
