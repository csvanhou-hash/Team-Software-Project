import {
    createLaundrySession,
    deleteLaundrySessionByUserId,
    getLaundrySessionByUserId,
    insertLaundry,
    updateLaundrySession,
    updateUser,
    type LaundrySession,
} from "../db/database.js";

function addSecondsToNow(seconds: number) {
    return new Date(Date.now() + seconds * 1000).toISOString();
}

export function startLaundrySession(input: {
    userId: number;
    totalLoads: number;
    washerTimeSeconds: number;
    dryerTimeSeconds: number;
}) {
    const existingSession = getLaundrySessionByUserId(input.userId);

    if (existingSession) {
        return {
            ok: false as const,
            message: "You already have a laundry session in progress.",
        };
    }

    const session = createLaundrySession({
        userId: input.userId,
        totalLoads: input.totalLoads,
        washerTimeSeconds: input.washerTimeSeconds,
        dryerTimeSeconds: input.dryerTimeSeconds,
        loadsStartedInWasher: 1,
        loadsMovedToDryer: 0,
        dryerLoadsCompleted: 0,
        washerRunning: 1,
        dryerRunning: 0,
        washerEndsAt: addSecondsToNow(input.washerTimeSeconds),
        dryerEndsAt: null,
        awaitingMove: 0,
        awaitingFinish: 0,
    });

    return {
        ok: true as const,
        session,
    };
}

function hasWashedLoadWaiting(session: LaundrySession) {
    return (
        session.loads_started_in_washer > session.loads_moved_to_dryer &&
        session.washer_running === 0
    );
}

export function moveLaundrySession(userId: number) {
    const session = getLaundrySessionByUserId(userId);

    if (!session) {
        return {
            ok: false as const,
            message: "You do not have an active laundry session.",
        };
    }

    if (session.awaiting_finish === 1) {
        return {
            ok: false as const,
            message: "Your laundry is ready to finish. Run /finishlaundry instead.",
        };
    }

    if (session.awaiting_move !== 1) {
        return {
            ok: false as const,
            message: "Nothing needs to be moved right now. I’ll DM you when it is time.",
        };
    }

    if (!hasWashedLoadWaiting(session) || session.dryer_running === 1) {
        return {
            ok: false as const,
            message: "Your laundry is not ready to move right now. I’ll DM you when it is time.",
        };
    }

    const hasMoreWasherLoads = session.loads_started_in_washer < session.total_loads;

    const updatedSession = updateLaundrySession(session.id, {
        loadsMovedToDryer: session.loads_moved_to_dryer + 1,
        dryerRunning: 1,
        dryerEndsAt: addSecondsToNow(session.dryer_time_seconds),
        awaitingMove: 0,
        awaitingFinish: 0,
        loadsStartedInWasher: hasMoreWasherLoads
            ? session.loads_started_in_washer + 1
            : session.loads_started_in_washer,
        washerRunning: hasMoreWasherLoads ? 1 : 0,
        washerEndsAt: hasMoreWasherLoads
            ? addSecondsToNow(session.washer_time_seconds)
            : null,
    });

    const message = hasMoreWasherLoads
        ? "Laundry moved. Dryer has started and the next washer load is running."
        : "Laundry moved. Dryer has started for the final load.";

    return {
        ok: true as const,
        session: updatedSession,
        message,
    };
}

export function finishLaundrySession(userId: number) {
    const session = getLaundrySessionByUserId(userId);

    if (!session) {
        return {
            ok: false as const,
            message: "You do not have an active laundry session.",
        };
    }

    if (session.awaiting_finish !== 1) {
        return {
            ok: false as const,
            message: "Laundry is not ready to finish yet. I’ll DM you when the final dryer cycle is done.",
        };
    }

    const completedAt = new Date().toISOString();

    insertLaundry({
        userId,
        dateDone: completedAt,
        loads: session.total_loads,
    });

    updateUser(userId, {
        lastLaundryAt: completedAt,
    });

    deleteLaundrySessionByUserId(userId);

    return {
        ok: true as const,
        message: "Laundry complete. I recorded this session and updated your last laundry date.",
    };
}
