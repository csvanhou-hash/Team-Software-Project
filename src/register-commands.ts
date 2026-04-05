import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    throw new Error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
}

const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    new SlashCommandBuilder()
        .setName("laundry")
        .setDescription("Start a laundry timer")
        .addIntegerOption(option =>
            option
                .setName("seconds")
                .setDescription("How long until your laundry is done")
                .setRequired(true)
        ),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function main() {
    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
    );

    console.log("Slash commands registered.");
}

main().catch(console.error);
