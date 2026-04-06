import type { Client } from "discord.js";

import { getAllUsers } from "../db/database.js";
import { sendDirectMessage } from "./dmService.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const LAUNDRY_REMINDER_DAYS = 14;
const DETERGENT_REMINDER_DAYS = 30;

let reminderInterval: NodeJS.Timeout | null = null;

function isOlderThanDays(value: string | null, days: number) {
    if (!value) {
        return true;
    }

    const ageMs = Date.now() - new Date(value).getTime();
    return ageMs >= days * ONE_DAY_MS;
}

async function runReminders(client: Client) {
    const users = getAllUsers();

    for (const user of users) {
        const messages: string[] = [];

        if (isOlderThanDays(user.last_laundry_at, LAUNDRY_REMINDER_DAYS)) {
            messages.push("Laundry reminder: it has been a while since your last laundry day.");
        }

        if (isOlderThanDays(user.last_bought_detergent_at, DETERGENT_REMINDER_DAYS)) {
            messages.push("Detergent reminder: you may want to buy detergent soon.");
        }

        if (messages.length > 0) {
            await sendDirectMessage(client, user.discord_id, messages.join("\n"));
        }
    }
}

export async function runReminderCheck(client: Client) {
    await runReminders(client);
}

export function startReminderService(client: Client) {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }

    void runReminders(client);

    reminderInterval = setInterval(() => {
        void runReminders(client);
    }, ONE_DAY_MS);
}

export function stopReminderService() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
}
