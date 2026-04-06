import { describe, expect, it } from "vitest";

import { buyDetergentCommand } from "../src/commands/buyDetergent.js";
import { laundryStatisticsCommand } from "../src/commands/laundryStatistics.js";
import { setDryerTimeCommand } from "../src/commands/setDryerTime.js";
import { setWasherTimeCommand } from "../src/commands/setWasherTime.js";
import {
    createUser,
    getUserByDiscordId,
    insertLaundry,
    updateUser,
} from "../src/db/database.js";
import { createMockInteraction } from "./helpers.js";

describe("user settings and statistics", () => {
    it("setWasherTime stores washer time correctly", async () => {
        const user = createUser("discord-settings-1", "Case");
        const interaction = createMockInteraction({
            options: { time_seconds: 1800 },
        });

        await setWasherTimeCommand.execute(interaction as never, user);

        expect(getUserByDiscordId("discord-settings-1")?.washer_time_seconds).toBe(1800);
    });

    it("setDryerTime stores dryer time correctly", async () => {
        const user = createUser("discord-settings-2", "Case");
        const interaction = createMockInteraction({
            options: { time_seconds: 2400 },
        });

        await setDryerTimeCommand.execute(interaction as never, user);

        expect(getUserByDiscordId("discord-settings-2")?.dryer_time_seconds).toBe(2400);
    });

    it("washer and dryer times must be positive integers", async () => {
        const user = createUser("discord-settings-3", "Case");
        const washerInteraction = createMockInteraction({
            options: { time_seconds: 0 },
        });
        const dryerInteraction = createMockInteraction({
            options: { time_seconds: -1 },
        });

        await setWasherTimeCommand.execute(washerInteraction as never, user);
        await setDryerTimeCommand.execute(dryerInteraction as never, user);

        expect(washerInteraction.reply).toHaveBeenCalledWith(
            "Washer time must be a positive number of seconds."
        );
        expect(dryerInteraction.reply).toHaveBeenCalledWith(
            "Dryer time must be a positive number of seconds."
        );
    });

    it("buyDetergent updates last_bought_detergent_at", async () => {
        const user = createUser("discord-settings-4", "Case");
        const interaction = createMockInteraction();

        await buyDetergentCommand.execute(interaction as never, user);

        expect(getUserByDiscordId("discord-settings-4")?.last_bought_detergent_at).not.toBeNull();
    });

    it("laundryStatistics returns correct values for no laundry history", async () => {
        const user = createUser("discord-stats-1", "Case");
        const interaction = createMockInteraction();

        await laundryStatisticsCommand.execute(interaction as never, user);

        const message = interaction.reply.mock.calls[0]?.[0];

        expect(message).toContain("Laundry records: 0");
        expect(message).toContain("Total loads completed: 0");
        expect(message).toContain("Most recent laundry: Not recorded");
        expect(message).toContain("Stored washer time: Not set");
        expect(message).toContain("Stored dryer time: Not set");
        expect(message).toContain("Last detergent purchase: Not recorded");
    });

    it("laundryStatistics returns correct values for existing history and saved settings", async () => {
        const user = createUser("discord-stats-2", "Case");
        updateUser(user.id, {
            washerTimeSeconds: 1200,
            dryerTimeSeconds: 1800,
            lastBoughtDetergentAt: "2026-02-01T00:00:00.000Z",
        });
        insertLaundry({
            userId: user.id,
            dateDone: "2026-02-02T00:00:00.000Z",
            loads: 2,
        });
        insertLaundry({
            userId: user.id,
            dateDone: "2026-02-03T00:00:00.000Z",
            loads: 3,
        });
        const interaction = createMockInteraction();

        await laundryStatisticsCommand.execute(
            interaction as never,
            getUserByDiscordId("discord-stats-2")
        );

        const message = interaction.reply.mock.calls[0]?.[0];

        expect(message).toContain("Laundry records: 2");
        expect(message).toContain("Total loads completed: 5");
        expect(message).toContain("Stored washer time: 1200 seconds");
        expect(message).toContain("Stored dryer time: 1800 seconds");
        expect(message).toContain("Last detergent purchase:");
        expect(message).not.toContain("Most recent laundry: Not recorded");
    });
});
