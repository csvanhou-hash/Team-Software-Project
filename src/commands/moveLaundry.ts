import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { type User } from "../db/database.js";
import { moveLaundrySession } from "../services/laundrySessionService.js";
import { syncLaundrySessionTimers } from "../services/timerService.js";
import { buildLaundryStatusText } from "../utils/formatting.js";
import type { BotCommand } from "./types.js";

export const moveLaundryCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("movelaundry")
        .setDescription("Move laundry when the bot tells you it is time"),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        const result = moveLaundrySession(user.id);

        if (!result.ok) {
            await interaction.reply(result.message);
            return;
        }

        syncLaundrySessionTimers(interaction.client, result.session);

        const statusText = buildLaundryStatusText(result.session);

        await interaction.reply(statusText ? `${result.message} ${statusText}` : result.message);
    },
};
