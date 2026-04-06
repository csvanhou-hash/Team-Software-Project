import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { createUser, getUserByDiscordId } from "../db/database.js";
import type { BotCommand } from "./types.js";

export const registerCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register yourself with Laundry Bot"),
    requiresAuth: false,

    async execute(interaction: ChatInputCommandInteraction) {
        const existingUser = getUserByDiscordId(interaction.user.id);

        if (existingUser) {
            await interaction.reply("You are already registered");
            return;
        }

        createUser(interaction.user.id, interaction.user.username);
        await interaction.reply(
            "You are now registered. Laundry Bot can now save your settings and laundry history."
        );
    },
};
