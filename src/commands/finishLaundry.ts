import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { type User } from "../db/database.js";
import { finishLaundrySession } from "../services/laundrySessionService.js";
import { clearLaundrySessionTimers } from "../services/timerService.js";
import type { BotCommand } from "./types.js";

export const finishLaundryCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("finishlaundry")
        .setDescription("Finish and record your laundry session"),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        const result = finishLaundrySession(user.id);

        if (!result.ok) {
            await interaction.reply(result.message);
            return;
        }

        clearLaundrySessionTimers(user.id);

        await interaction.reply(result.message);
    },
};
