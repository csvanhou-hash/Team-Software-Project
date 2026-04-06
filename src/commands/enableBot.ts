import {
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from "discord.js";

import { setBotEnabled } from "../state/botState.js";
import type { BotCommand } from "./types.js";

export const enableBotCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("enablebot")
        .setDescription("Enable Laundry Bot")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    requiresAuth: false,

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: "Only server administrators can use this command",
                ephemeral: true,
            });
            return;
        }

        setBotEnabled(true);
        await interaction.reply("Laundry Bot enabled. Regular commands can be used again.");
    },
};
