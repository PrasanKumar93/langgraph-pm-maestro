# Slack App Setup Guide

## Initial Setup

- Sign in at [`https://api.slack.com/apps`](https://api.slack.com/apps)
- Create a new app using the manifest provided below

### Sample App Manifest

```json
// sample manifest.json
{
  "display_information": {
    "name": "pm-maestro",
    "description": "A Product Manager Assistant Bot",
    "background_color": "#2c2d30",
    "long_description": "- Showcase the LangGraph agent’s capability to automate a simple `Product Management` workflow.\r\n\r\n- Workflow includes:\r\n  - `Customer Demand Analysis`: Gather and synthesize data from systems like Salesforce, JIRA, Zendesk, etc.\r\n  - `Market Research`: Scrape competitor data, summarize features, and create matrices.\r\n  - `Effort Estimation`: Estimate work required and produce breakdowns.\r\n  - `Mini-PRD Generation`: Generate a multi-page product requirements document.\r\n\r\nNote : PRD - Product Requirements Document"
  },
  "features": {
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": false,
      "messages_tab_read_only_enabled": false
    },
    "bot_user": {
      "display_name": "pm-maestro",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "user": ["channels:history", "im:history", "groups:history"],
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "reactions:read",
        "reactions:write",
        "users:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "groups:write"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "user_events": ["message.channels", "message.groups", "message.im"],
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

### Enable Direct Messages

- Navigate to `App Home` in the left sidebar
- Under the `Show Tabs` section:
  - Enable the `Messages Tab`
  - Toggle `Allow users to send Slash commands and messages`

## Required Environment Variables

```sh
# From Basic Information page
SLACK_APP_ID=           # Your App ID
SLACK_CLIENT_ID=        # Your Client ID
SLACK_CLIENT_SECRET=    # Your Client Secret
SLACK_SIGNING_SECRET=   # Your Signing Secret

# App-Level Token (starts with xapp-)
# Generate from Basic Information page > App-Level Tokens
# Required scopes: connections:write, authorizations:read
SLACK_APP_TOKEN=

# Bot User OAuth Token (starts with xoxb-)
# Found in OAuth & Permissions page after workspace installation
SLACK_BOT_TOKEN=
```

### Installation

- Go to `OAuth & Permissions`
- Click `Install to Workspace`
- After modifying any OAuth scopes, click `Reinstall to Workspace`

## API Testing

- Send a message to a channel

```sh
curl -X POST "https://slack.com/api/chat.postMessage" \
     -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{
       "channel": "CHANNEL_ID",
       "text": "Hello from API!"
     }'
```

- Retrieve Channel History

```sh
curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -X GET "https://slack.com/api/conversations.history?channel=CHANNEL_ID"
```

## Socket Mode Logic

Socket Mode establishes a secure WebSocket connection between your app and Slack’s servers. Here’s how it works:

1. Initial Connection:

   - Your local app uses the App-Level Token (xapp-) to initiate a WebSocket connection with Slack
   - This connection remains open and enables real-time, bidirectional communication

2. Message Flow:

   ```mermaid
   sequenceDiagram
       participant User
       participant Slack Client
       participant Slack Server
       participant Your App

       User->>Slack Client: Sends message/action
       Slack Client->>Slack Server: Forwards event
       Slack Server->>Your App: Pushes event via WebSocket
       Your App->>Your App: Processes event
       Your App->>Slack Server: Sends response via WebSocket
       Slack Server->>Slack Client: Updates UI
   ```

3. Key Benefits:

   - No public URLs needed
   - Real-time event delivery
   - Secure WebSocket connection using app-level tokens
   - Works behind firewalls
   - Lower latency than HTTP-based webhooks

4. Common Events:
   - Message events (new messages, edits, deletions)
   - App mentions
   - Reactions
   - File uploads
   - Interactive components (buttons, modals)

Note: Socket Mode is especially useful for local development and testing.
