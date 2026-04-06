import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { type User } from "../db/database.js";
import { startLaundrySession } from "../services/laundrySessionService.js";
import { syncLaundrySessionTimers } from "../services/timerService.js";
import { buildLaundryStatusText } from "../utils/formatting.js";
import type { BotCommand } from "./types.js";

export const doLaundryCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName("dolaundry")
        .setDescription("Start a new laundry workflow")
        .addIntegerOption(option =>
            option
                .setName("loads")
                .setDescription("How many loads you are doing")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName("washertime")
                .setDescription("Washer time in seconds for this run")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName("dryertime")
                .setDescription("Dryer time in seconds for this run")
                .setRequired(false)
        ),
    requiresAuth: true,

    async execute(interaction: ChatInputCommandInteraction, user?: User) {
        if (!user) {
            return;
        }

        const loads = interaction.options.getInteger("loads") ?? 1;
        const washerTime = interaction.options.getInteger("washertime") ?? user.washer_time_seconds;
        const dryerTime = interaction.options.getInteger("dryertime") ?? user.dryer_time_seconds;

        if (loads < 1) {
            await interaction.reply("Loads must be at least 1.");
            return;
        }

        if ((washerTime !== null && washerTime <= 0) || (dryerTime !== null && dryerTime <= 0)) {
            await interaction.reply("Washer and dryer times must be positive numbers of seconds.");
            return;
        }

        if (washerTime === null || dryerTime === null) {
            await interaction.reply(
                "Please provide washer and dryer times, or set them first using /setwashertime and /setdryertime."
            );
            return;
        }

        const result = startLaundrySession({
            userId: user.id,
            totalLoads: loads,
            washerTimeSeconds: washerTime,
            dryerTimeSeconds: dryerTime,
        });

        if (!result.ok) {
            await interaction.reply(result.message);
            return;
        }

        syncLaundrySessionTimers(interaction.client, result.session);

        await interaction.reply(
            `Laundry session started for ${loads} load${loads === 1 ? "" : "s"}. ${buildLaundryStatusText(result.session)} I’ll DM you when it is time to move your laundry.`
        );
    },
};
