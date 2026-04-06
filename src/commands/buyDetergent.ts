import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { updateUser, type User } from "../db/database.js";
import type { BotCommand } from "./types.js";

export const buyDetergentCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("buydetergent")
        .setDescription("Record that you bought detergent"),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        updateUser(user.id, {
            lastBoughtDetergentAt: new Date().toISOString(),
        });

        await interaction.reply(
            "Detergent purchase recorded. This only saves the purchase date for future reminders and statistics."
        );
    },
};
