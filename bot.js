require("dotenv").config();
const { Telegraf } = require("telegraf");
const ytdl = require("@distube/ytdl-core"); // Use updated package
const fetch = require("node-fetch");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("🎵 Welcome! Send me a song name or YouTube link.");
});

// Function to get the first YouTube search result
async function getYouTubeUrl(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl);
  const text = await res.text();

  const videoIdMatch = text.match(/"videoId":"(.*?)"/);
  return videoIdMatch ? `https://www.youtube.com/watch?v=${videoIdMatch[1]}` : null;
}

// Download and send audio
bot.on("text", async (ctx) => {
  let url = ctx.message.text;

  if (!ytdl.validateURL(url)) {
    ctx.reply("🔍 Searching for song...");
    url = await getYouTubeUrl(url);
    if (!url) return ctx.reply("❌ No results found.");
  }

  ctx.reply("🎶 Downloading...");

  try {
    const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
    const filePath = `temp_${Date.now()}.mp3`;
    const file = fs.createWriteStream(filePath);

    stream.pipe(file);
    file.on("finish", async () => {
      await ctx.replyWithAudio({ source: filePath });
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    ctx.reply("❌ Error downloading song.");
    console.error(error);
  }
});

bot.launch();
console.log("🎵 Telegram Music Bot Started!");
