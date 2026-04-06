import {
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from "discord.js";

import { setBotEnabled } from "../state/botState.js";
import type { BotCommand } from "./types.js";

export const disableBotCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("disablebot")
        .setDescription("Disable Laundry Bot")
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

        setBotEnabled(false);
        await interaction.reply("Laundry Bot disabled. Most commands will stop until it is enabled again.");
    },
};
