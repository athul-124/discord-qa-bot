# Discord Bot Invite Link Setup

Quick guide to generating and managing Discord OAuth2 invite links for the Q&A Bot.

## Required Bot Permissions

The bot needs the following permissions to function properly:

### Message Permissions
- ✅ **Read Messages/View Channels** - To see messages in configured channels
- ✅ **Send Messages** - To respond with answers
- ✅ **Manage Messages** - To delete spam messages
- ✅ **Embed Links** - To send formatted responses
- ✅ **Attach Files** - To send file attachments if needed
- ✅ **Read Message History** - To access message context

### Other Permissions
- ✅ **Use Slash Commands** - For `/config` and other admin commands

## Required Intents (Developer Portal)

**CRITICAL:** These must be enabled in the Discord Developer Portal:

1. Go to https://discord.com/developers/applications
2. Select your application
3. Navigate to "Bot" section
4. Under "Privileged Gateway Intents", enable:
   - ✅ **MESSAGE CONTENT INTENT** (Required!)
   - ✅ Server Members Intent (Recommended)
   - ✅ Presence Intent (Optional)

⚠️ **Without MESSAGE CONTENT INTENT, the bot cannot read message content!**

## Generating Invite Link

### Method 1: Discord Developer Portal (Recommended)

1. Go to https://discord.com/developers/applications
2. Select your application
3. Navigate to "OAuth2" → "URL Generator"
4. Select **Scopes**:
   - ✅ `bot`
   - ✅ `applications.commands`
5. Select **Bot Permissions** (or use permission integer `274878221376`):
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Manage Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Use Slash Commands
6. Copy the generated URL at the bottom

### Method 2: Manual URL Construction

Replace `YOUR_CLIENT_ID` with your actual Discord Application ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878221376&scope=bot%20applications.commands
```

**Permission Integer Breakdown:**
- `274878221376` = Combined permissions for the bot

To calculate your own permission integer:
1. Use Discord Permissions Calculator: https://discordapi.com/permissions.html
2. Select the permissions listed above
3. Copy the permission integer

### Method 3: Admin Permissions (Not Recommended)

For testing only, you can use administrator permissions:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

⚠️ **Warning:** Admin permissions (`8`) give full server control. Only use for testing!

## Inviting the Bot

1. Copy your invite URL
2. Open it in a web browser
3. Select the Discord server you want to add the bot to
4. Click "Authorize"
5. Complete the captcha
6. The bot should now appear in your server's member list

## Verifying Bot Setup

After inviting, verify:

1. **Bot is Online**
   - Check the bot appears in the member list
   - Status should be "Online" (green dot)

2. **Bot Responds to Commands**
   ```
   /config channel:#your-channel keywords:help,support
   ```
   - Bot should respond with configuration confirmation

3. **Bot Can Read Messages**
   - Send a test message with a keyword in the configured channel
   - Bot should respond (after KB is uploaded)

4. **Bot Can Delete Messages**
   - Send a spam message to test moderation
   - Bot should delete it and DM the server owner

## Troubleshooting

### Bot is Offline

**Causes:**
- Bot token not set correctly in Heroku
- Worker dyno not running
- Bot crashed on startup

**Fix:**
```bash
# Check if worker dyno is running
heroku ps

# Check logs
heroku logs --tail --dyno worker

# Restart worker
heroku restart worker
```

### Bot Not Responding to Messages

**Causes:**
- MESSAGE CONTENT INTENT not enabled
- Bot doesn't have Read Messages permission
- Channel not configured with `/config` command

**Fix:**
1. Enable MESSAGE CONTENT INTENT in Developer Portal
2. Kick and re-invite bot to refresh permissions
3. Configure channel: `/config channel:#channel keywords:help`

### Bot Can't Delete Spam

**Causes:**
- Missing "Manage Messages" permission
- Bot role is below the user's role in hierarchy

**Fix:**
1. Verify bot has "Manage Messages" permission
2. Move bot role above other roles in Server Settings → Roles

### Slash Commands Not Appearing

**Causes:**
- `applications.commands` scope not included in invite
- Bot hasn't registered commands yet

**Fix:**
1. Re-invite bot with correct scopes
2. Check worker logs for command registration:
   ```bash
   heroku logs --tail | grep "commands registered"
   ```

## Permission Integer Reference

Common permission combinations:

| Permission Set | Integer | Use Case |
|----------------|---------|----------|
| Read + Send | `3072` | Basic messaging |
| Read + Send + Manage | `11264` | With moderation |
| Full bot permissions | `274878221376` | **Recommended** |
| Administrator | `8` | Testing only |

## Multiple Server Setup

The same invite link can be used for multiple servers:

1. Generate one invite link with your CLIENT_ID
2. Share the link with server owners
3. Each server owner uses the link to invite the bot
4. Each server gets independent configuration via `/config`

## Updating Permissions

If you need to add new permissions later:

1. Generate a new invite link with updated permissions
2. Users who already have the bot must:
   - Kick the bot
   - Re-invite using the new link
3. Alternatively, server admins can manually update bot role permissions

## Security Best Practices

1. **Least Privilege**: Only request permissions you actually need
2. **No Admin**: Avoid administrator permission in production
3. **Review Regularly**: Audit bot permissions periodically
4. **Revoke Access**: If bot token is compromised, reset it in Developer Portal
5. **Monitor Usage**: Check audit logs for unexpected bot actions

## Example Configurations

### Minimal Q&A Bot
```
Scopes: bot, applications.commands
Permissions: 274877906944 (without Manage Messages)
```

### Full-Featured with Moderation
```
Scopes: bot, applications.commands
Permissions: 274878221376 (recommended)
```

### Testing Configuration
```
Scopes: bot, applications.commands
Permissions: 8 (administrator - testing only!)
```

## Quick Links

- **Discord Developer Portal**: https://discord.com/developers/applications
- **Permissions Calculator**: https://discordapi.com/permissions.html
- **Discord.js Guide**: https://discordjs.guide/
- **OAuth2 Documentation**: https://discord.com/developers/docs/topics/oauth2

## Save Your Links

After generating, save these for reference:

```
Production Invite URL:
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878221376&scope=bot%20applications.commands

Developer Portal:
https://discord.com/developers/applications/YOUR_CLIENT_ID

Bot Management:
https://discord.com/developers/applications/YOUR_CLIENT_ID/bot
```

---

**Ready to invite!** Share the invite link with server owners to add the bot to their Discord servers.
