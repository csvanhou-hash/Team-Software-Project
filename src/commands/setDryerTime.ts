import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { updateUser, type User } from "../db/database.js";
import type { BotCommand } from "./types.js";

export const setDryerTimeCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("setdryertime")
        .setDescription("Set your default dryer time in seconds")
        .addIntegerOption(option =>
            option
                .setName("time_seconds")
                .setDescription("Your dryer cycle length in seconds")
                .setRequired(true)
        ),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        const timeSeconds = interaction.options.getInteger("time_seconds", true);

        if (timeSeconds <= 0) {
            await interaction.reply("Dryer time must be a positive number of seconds.");
            return;
        }

        updateUser(user.id, {
            dryerTimeSeconds: timeSeconds,
        });

        await interaction.reply(
            `Dryer time set to ${timeSeconds} seconds. This will be used as your default dryer time for future laundry runs.`
        );
    },
};
