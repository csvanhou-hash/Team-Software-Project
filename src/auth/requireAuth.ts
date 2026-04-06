import type { ChatInputCommandInteraction } from "discord.js";

import { getUserByDiscordId, type User } from "../db/database.js";

export async function requireAuth(
    interaction: ChatInputCommandInteraction
): Promise<User | null> {
    const user = getUserByDiscordId(interaction.user.id);

    if (!user) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp("You must register first using /register");
        } else {
            await interaction.reply("You must register first using /register");
        }

        return null;
    }

    return user;
}
