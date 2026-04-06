import fs from "node:fs";
import path from "node:path";

import { afterEach, beforeAll, beforeEach } from "vitest";

const testDatabasePath = path.resolve(process.cwd(), "tmp", "laundry-bot.test.sqlite");

process.env.LAUNDRY_BOT_DB_PATH = testDatabasePath;

fs.mkdirSync(path.dirname(testDatabasePath), { recursive: true });

const { initializeDatabase, resetDatabase } = await import("../src/db/database.js");
const { resetBotState } = await import("../src/state/botState.js");
const { resetTimerService } = await import("../src/services/timerService.js");
const { stopReminderService } = await import("../src/services/reminderService.js");

beforeAll(() => {
    initializeDatabase();
});

beforeEach(() => {
    resetDatabase();
    resetBotState();
    resetTimerService();
    stopReminderService();
});

afterEach(() => {
    resetTimerService();
    stopReminderService();
});
