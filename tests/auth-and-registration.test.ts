import { describe, expect, it } from "vitest";

import { requireAuth } from "../src/auth/requireAuth.js";
import { registerCommand } from "../src/commands/register.js";
import { createUser, getAllUsers } from "../src/db/database.js";
import { createMockInteraction } from "./helpers.js";

describe("authentication and registration", () => {
    it("registering a new user creates a DB user row", async () => {
        const interaction = createMockInteraction({
            userId: "discord-register-1",
            username: "Case",
        });

        await registerCommand.execute(interaction as never);

        expect(getAllUsers()).toHaveLength(1);
        expect(getAllUsers()[0]?.discord_id).toBe("discord-register-1");
        expect(interaction.reply).toHaveBeenCalledWith(
            "You are now registered. Laundry Bot can now save your settings and laundry history."
        );
    });

    it("registering an already registered user does not duplicate the user", async () => {
        const interaction = createMockInteraction({
            userId: "discord-register-2",
            username: "Case",
        });

        await registerCommand.execute(interaction as never);
        await registerCommand.execute(interaction as never);

        expect(getAllUsers()).toHaveLength(1);
        expect(interaction.reply).toHaveBeenLastCalledWith("You are already registered");
    });

    it("requireAuth succeeds for a registered user", async () => {
        const user = createUser("discord-auth-1", "Case");
        const interaction = createMockInteraction({ userId: "discord-auth-1" });

        const result = await requireAuth(interaction as never);

        expect(result?.id).toBe(user.id);
        expect(interaction.reply).not.toHaveBeenCalled();
    });

    it("requireAuth fails for an unregistered user", async () => {
        const interaction = createMockInteraction({ userId: "discord-auth-2" });

        const result = await requireAuth(interaction as never);

        expect(result).toBeNull();
        expect(interaction.reply).toHaveBeenCalledWith(
            "You must register first using /register"
        );
    });
});
