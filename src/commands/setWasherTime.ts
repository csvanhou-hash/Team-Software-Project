import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { updateUser, type User } from "../db/database.js";
import type { BotCommand } from "./types.js";

export const setWasherTimeCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("setwashertime")
        .setDescription("Set your default washer time in seconds")
        .addIntegerOption(option =>
            option
                .setName("time_seconds")
                .setDescription("Your washer cycle length in seconds")
                .setRequired(true)
        ),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        const timeSeconds = interaction.options.getInteger("time_seconds", true);

        if (timeSeconds <= 0) {
            await interaction.reply("Washer time must be a positive number of seconds.");
            return;
        }

        updateUser(user.id, {
            washerTimeSeconds: timeSeconds,
        });

        await interaction.reply(
            `Washer time set to ${timeSeconds} seconds. This will be used as your default washer time for future laundry runs.`
        );
    },
};
