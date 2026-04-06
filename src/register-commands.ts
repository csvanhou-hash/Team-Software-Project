import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

import { commands } from "./commands/index.js";

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    throw new Error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
}

const requiredToken = token;
const requiredClientId = clientId;
const requiredGuildId = guildId;

const rest = new REST({ version: "10" }).setToken(requiredToken);

async function main() {
    await rest.put(
        Routes.applicationGuildCommands(requiredClientId, requiredGuildId),
        { body: commands.map(command => command.data.toJSON()) }
    );

    console.log("Slash commands registered.");
}

main().catch(console.error);
