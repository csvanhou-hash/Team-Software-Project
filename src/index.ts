import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    throw new Error("Missing DISCORD_TOKEN in .env");
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
        await interaction.reply("Pong!");
    }

    if (interaction.commandName === "laundry") {
        const seconds = interaction.options.getInteger("seconds", true);

        if (seconds <= 0) {
            await interaction.reply("Time must be greater than 0.");
            return;
        }

        // Immediate response
        await interaction.reply(`🧺 Timer started for ${seconds} seconds.`);

        // Delay
        setTimeout(async () => {
            try {
                await interaction.followUp({
                    content: `⏰ <@${interaction.user.id}> your laundry is done!`,
                });
            } catch (err) {
                console.error("Failed to send follow-up:", err);
            }
        }, seconds * 1000);
    }
});

client.login(token);
