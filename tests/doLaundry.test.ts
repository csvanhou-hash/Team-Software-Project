import { beforeEach, describe, expect, it, vi } from "vitest";

import { doLaundryCommand } from "../src/commands/doLaundry.js";
import { createUser, getLaundrySessionByUserId, updateUser } from "../src/db/database.js";
import * as timerService from "../src/services/timerService.js";
import { createMockInteraction } from "./helpers.js";

describe("doLaundry command", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
    });

    it("doLaundry defaults loads to 1", async () => {
        const user = createUser("discord-do-1", "Case");
        updateUser(user.id, {
            washerTimeSeconds: 600,
            dryerTimeSeconds: 900,
        });
        vi.spyOn(timerService, "syncLaundrySessionTimers").mockImplementation(() => {});
        const interaction = createMockInteraction();

        await doLaundryCommand.execute(interaction as never, updateUser(user.id, {}));

        const session = getLaundrySessionByUserId(user.id);

        expect(session?.total_loads).toBe(1);
        expect(session?.washer_time_seconds).toBe(600);
        expect(session?.dryer_time_seconds).toBe(900);
        expect(interaction.reply).toHaveBeenCalledWith(
            "Laundry session started for 1 load. Washer: 10m 0s remaining. I’ll DM you when it is time to move your laundry."
        );
    });

    it("starting laundry with explicit washer and dryer times creates a session", async () => {
        const user = createUser("discord-do-2", "Case");
        vi.spyOn(timerService, "syncLaundrySessionTimers").mockImplementation(() => {});
        const interaction = createMockInteraction({
            options: { loads: 3, washertime: 100, dryertime: 200 },
        });

        await doLaundryCommand.execute(interaction as never, user);

        const session = getLaundrySessionByUserId(user.id);

        expect(session).toMatchObject({
            total_loads: 3,
            washer_time_seconds: 100,
            dryer_time_seconds: 200,
            loads_started_in_washer: 1,
            loads_moved_to_dryer: 0,
            dryer_loads_completed: 0,
            washer_running: 1,
            dryer_running: 0,
            awaiting_move: 0,
            awaiting_finish: 0,
        });
        expect(interaction.reply).toHaveBeenCalledWith(
            "Laundry session started for 3 loads. Washer: 1m 40s remaining. I’ll DM you when it is time to move your laundry."
        );
    });

    it("starting laundry without explicit times uses saved user defaults", async () => {
        const user = createUser("discord-do-3", "Case");
        updateUser(user.id, {
            washerTimeSeconds: 700,
            dryerTimeSeconds: 800,
        });
        vi.spyOn(timerService, "syncLaundrySessionTimers").mockImplementation(() => {});
        const interaction = createMockInteraction({
            options: { loads: 2 },
        });

        await doLaundryCommand.execute(interaction as never, updateUser(user.id, {}));

        const session = getLaundrySessionByUserId(user.id);

        expect(session?.total_loads).toBe(2);
        expect(session?.washer_time_seconds).toBe(700);
        expect(session?.dryer_time_seconds).toBe(800);
    });

    it("starting laundry fails if washer and dryer times are missing", async () => {
        const user = createUser("discord-do-4", "Case");
        const interaction = createMockInteraction();

        await doLaundryCommand.execute(interaction as never, user);

        expect(getLaundrySessionByUserId(user.id)).toBeUndefined();
        expect(interaction.reply).toHaveBeenCalledWith(
            "Please provide washer and dryer times, or set them first using /setwashertime and /setdryertime."
        );
    });

    it("starting laundry fails if loads is less than 1", async () => {
        const user = createUser("discord-do-5", "Case");
        const interaction = createMockInteraction({
            options: { loads: 0, washertime: 100, dryertime: 200 },
        });

        await doLaundryCommand.execute(interaction as never, user);

        expect(interaction.reply).toHaveBeenCalledWith("Loads must be at least 1.");
    });

    it("starting laundry fails if times are not positive", async () => {
        const user = createUser("discord-do-6", "Case");
        const interaction = createMockInteraction({
            options: { loads: 1, washertime: 0, dryertime: -1 },
        });

        await doLaundryCommand.execute(interaction as never, user);

        expect(interaction.reply).toHaveBeenCalledWith(
            "Washer and dryer times must be positive numbers of seconds."
        );
    });

    it("starting laundry fails if the user already has an active session", async () => {
        const user = createUser("discord-do-7", "Case");
        vi.spyOn(timerService, "syncLaundrySessionTimers").mockImplementation(() => {});
        const firstInteraction = createMockInteraction({
            options: { loads: 1, washertime: 100, dryertime: 200 },
        });
        const secondInteraction = createMockInteraction({
            options: { loads: 1, washertime: 100, dryertime: 200 },
        });

        await doLaundryCommand.execute(firstInteraction as never, user);
        await doLaundryCommand.execute(secondInteraction as never, user);

        expect(secondInteraction.reply).toHaveBeenCalledWith(
            "You already have a laundry session in progress."
        );
    });
});
