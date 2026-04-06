import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import type { BotCommand } from "./types.js";

export const pingCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check whether Laundry Bot is responding"),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! Laundry Bot is online.");
    },
};
