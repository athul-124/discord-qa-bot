export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    ownerId: process.env.OWNER_DISCORD_ID || '',
    guildId: process.env.DISCORD_GUILD_ID,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  whop: {
    appId: process.env.WHOP_APP_ID || '',
    apiKey: process.env.WHOP_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};
