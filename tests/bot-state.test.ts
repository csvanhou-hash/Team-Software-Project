import { describe, expect, it } from "vitest";

import { disableBotCommand } from "../src/commands/disableBot.js";
import { enableBotCommand } from "../src/commands/enableBot.js";
import {
    canRunCommand,
    isBotEnabled,
    setBotEnabled,
} from "../src/state/botState.js";
import { createMockInteraction } from "./helpers.js";

describe("bot enable and disable state", () => {
    it("bot is enabled by default", () => {
        expect(isBotEnabled()).toBe(true);
    });

    it("disableBot changes the state to disabled", async () => {
        const interaction = createMockInteraction({ isAdmin: true });

        await disableBotCommand.execute(interaction as never);

        expect(isBotEnabled()).toBe(false);
        expect(interaction.reply).toHaveBeenCalledWith(
            "Laundry Bot disabled. Most commands will stop until it is enabled again."
        );
    });

    it("enableBot changes the state back to enabled", async () => {
        setBotEnabled(false);
        const interaction = createMockInteraction({ isAdmin: true });

        await enableBotCommand.execute(interaction as never);

        expect(isBotEnabled()).toBe(true);
        expect(interaction.reply).toHaveBeenCalledWith(
            "Laundry Bot enabled. Regular commands can be used again."
        );
    });

    it("when bot is disabled normal commands should not proceed", () => {
        setBotEnabled(false);

        expect(canRunCommand("ping")).toBe(false);
        expect(canRunCommand("dolaundry")).toBe(false);
    });

    it("enableBot should still be allowed when disabled", () => {
        setBotEnabled(false);

        expect(canRunCommand("enablebot")).toBe(true);
    });
});
