import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { getLaundryStatisticsByUserId, type User } from "../db/database.js";
import { formatDateTime, formatSeconds } from "../utils/formatting.js";
import type { BotCommand } from "./types.js";

export const laundryStatisticsCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("laundrystatistics")
        .setDescription("View your saved laundry statistics"),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        const stats = getLaundryStatisticsByUserId(user.id);

        await interaction.reply(
            [
                "Here is your laundry summary:",
                `Laundry records: ${stats.totalRecords}`,
                `Total loads completed: ${stats.totalLoads}`,
                `Most recent laundry: ${formatDateTime(stats.mostRecentLaundryDate)}`,
                `Stored washer time: ${formatSeconds(user.washer_time_seconds)}`,
                `Stored dryer time: ${formatSeconds(user.dryer_time_seconds)}`,
                `Last detergent purchase: ${formatDateTime(user.last_bought_detergent_at)}`,
            ].join("\n")
        );
    },
};
