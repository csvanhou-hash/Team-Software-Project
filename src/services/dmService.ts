import type { Client } from "discord.js";

export async function sendDirectMessage(
    client: Client,
    discordUserId: string,
    content: string
) {
    try {
        const user = await client.users.fetch(discordUserId);
        await user.send(content);
    } catch (error) {
        console.error(`Failed to DM user ${discordUserId}:`, error);
    }
}
