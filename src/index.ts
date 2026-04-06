import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

import { requireAuth } from "./auth/requireAuth.js";
import { commands } from "./commands/index.js";
import { initializeDatabase } from "./db/database.js";
import { startReminderService } from "./services/reminderService.js";
import { initializeTimerService } from "./services/timerService.js";
import { canRunCommand } from "./state/botState.js";

dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    throw new Error("Missing DISCORD_TOKEN in .env");
}

initializeDatabase();

const commandMap = new Map(commands.map(command => [command.data.name, command]));

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    initializeTimerService(client);
    startReminderService(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (!canRunCommand(interaction.commandName)) {
        await interaction.reply("Laundry Bot is currently disabled");
        return;
    }

    const command = commandMap.get(interaction.commandName);

    if (!command) {
        await interaction.reply("Unknown command");
        return;
    }

    const authenticatedUser = command.requiresAuth
        ? (await requireAuth(interaction)) ?? undefined
        : undefined;

    if (command.requiresAuth && !authenticatedUser) {
        return;
    }

    await command.execute(interaction, authenticatedUser);
});

client.login(token);
