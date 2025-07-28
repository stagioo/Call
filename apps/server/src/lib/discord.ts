import type { Session } from "@call/auth/auth";

type Event = "thoughts" | "bug" | "feature" | "improvment" | "other";

export async function sendToDiscordWebhook(
  event: Event,
  description: string,
  user: Session["user"],

  webhookUrl: string
) {
  let embed = {
    title: "Call Activity",
    description: description,
    color: 0x0099ff,
    url: "",
    fields: [] as { name: string; value: string; inline?: boolean }[],
    timestamp: new Date().toISOString(),

    author: {
      name: `${user.name} - #${event}`,
      icon_url: user.image,
    },
  };

  switch (event) {
    case "thoughts":
      embed.title = `💭 Thoughts`;
      embed.color = 0x008000;
      break;

    case "bug":
      embed.title = `🐛 Bug`;
      embed.color = 0xff4500;
      break;

    case "feature":
      embed.title = `🚀 Feature`;
      embed.color = 0x008000;
      break;

    case "improvment":
      embed.title = `🔧 Improvment`;
      embed.color = 0x0000ff;
      break;

    case "other":
      embed.title = `🔀 Other`;
      embed.color = 0x000000;
      break;

    default:
      embed.title = `🔀 Other`;
      embed.color = 0x000000;
      break;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log("Sent webhook to Discord");
  } catch (error) {
    console.error("Error sending webhook:", error);
  }
}
