# Teams Webhook Testing Guide

This guide explains how to test the Teams webhook notification fix after implementing the Power Automate webhook support.

## Quick Test Methods

### Method 1: Direct Script Test (Recommended for Quick Testing)

This method tests the webhook service directly without requiring authentication.

1. **Build the project** (if you haven't already):
   ```bash
   cd backend
   npm run build
   ```

2. **Run the test script**:
   ```bash
   node test-webhook-simple.js "YOUR_WEBHOOK_URL" 2024-01-04
   ```

   Example with Power Automate webhook:
   ```bash
   node test-webhook-simple.js "https://defaultad8b165177824309a7738b4fddfeab.9f.environment.api.powerplatform.com/..." 2024-01-04
   ```

3. **Check the output** for:
   - Webhook type detection (Power Automate vs Teams Incoming Webhook)
   - Request payload format
   - HTTP response status and body
   - Success/failure result

### Method 2: API Endpoint Test (Recommended for Integration Testing)

This method tests through the API endpoint with real data from the database.

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Get an authentication token**:
   - Login through the API: `POST http://localhost:3000/api/auth/login`
   - Or use an existing admin token

3. **Call the test endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/teams/test-summary \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "date": "2024-01-04",
       "webhookUrl": "YOUR_WEBHOOK_URL"
     }'
   ```

4. **Check server logs** for detailed output

### Method 3: Wait for Scheduled Cron Job

The cron job runs daily at 8:30 PM IST (15:00 UTC).

1. Ensure `ENABLE_TEAMS_SUMMARY=true` in `.env`
2. Set `TEAMS_WEBHOOK_URL` in `.env` to your webhook URL
3. Wait for the scheduled run or restart the server to trigger it sooner
4. Check server logs for output

## What to Look For in Logs

### Successful Power Automate Webhook

```
Webhook type: Power Automate
Request payload: {
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [...]
}
Webhook request succeeded:
  Status: 200 OK
  Response data: {"status":"success"}
Successfully sent Teams notification for team: MERN
```

**Note**: The message should now appear in your Teams channel!

### Successful Teams Incoming Webhook

```
Webhook type: Teams Incoming Webhook
Request payload: {
  "type": "message",
  "attachments": [...]
}
Webhook request succeeded:
  Status: 200 OK
  Response data: 1
Successfully sent Teams notification for team: MERN
```

### Failed Webhook (Before Fix)

```
Webhook type: Power Automate
Request payload: {
  "type": "message",
  "attachments": [...]
}
Webhook request succeeded:
  Status: 200 OK
  Response data: {"status":"accepted"}
Successfully sent Teams notification for team: MERN
```

**Note**: HTTP 200 returned but message didn't appear because Power Automate couldn't process the wrong format!

## Troubleshooting

### 1. Message Still Not Appearing in Teams

**Check the logs for:**
- Is the webhook type being detected correctly?
  - Look for: `Webhook type: Power Automate` or `Webhook type: Teams Incoming Webhook`

- Is the payload format correct?
  - For Power Automate: Should be just `{ "type": "AdaptiveCard", ... }`
  - For Teams Incoming Webhook: Should be `{ "type": "message", "attachments": [...] }`

- What's the HTTP response?
  - Status code should be 200
  - Check response data for error messages

**Common issues:**
- Power Automate flow is not configured correctly
- Power Automate flow is disabled
- Teams channel permissions are incorrect
- Webhook URL has expired or been regenerated

### 2. HTTP 400 Bad Request

**Possible causes:**
- Invalid Adaptive Card format
- Required fields missing
- Incompatible Adaptive Card version

**Fix:**
- Check the Adaptive Card schema at https://adaptivecards.io/designer/
- Validate the generated card JSON

### 3. HTTP 404 Not Found

**Possible causes:**
- Webhook URL is incorrect or expired
- Power Automate flow has been deleted

**Fix:**
- Regenerate the webhook URL from Teams or Power Automate
- Verify the flow still exists in Power Automate

### 4. HTTP 429 Too Many Requests

**Possible causes:**
- Rate limiting from Microsoft

**Fix:**
- Reduce test frequency
- Implement exponential backoff (already included in retry logic)

## Power Automate Flow Configuration

If you're using Power Automate instead of a Teams Incoming Webhook:

1. **Create a new Flow**:
   - Trigger: "When a HTTP request is received"
   - Get the webhook URL from the trigger

2. **Configure Request Body JSON Schema**:
   ```json
   {
     "type": "object",
     "properties": {
       "type": {
         "type": "string"
       },
       "version": {
         "type": "string"
       },
       "body": {
         "type": "array"
       }
     }
   }
   ```

3. **Add Action**: "Post an Adaptive Card to a Teams channel and wait for a response"
   - Or use: "Post adaptive card in a chat or channel"
   - Team: Select your team
   - Channel: Select your channel
   - Adaptive Card: Use the entire HTTP request body as dynamic content

4. **Save and test** the flow

5. **Copy the webhook URL** and use it in the test

## Verifying the Fix

### Before the Fix
- HTTP 200 response
- "Successfully sent Teams notification" in logs
- **BUT no message appears in Teams**
- Power Automate couldn't process the wrong payload format

### After the Fix
- HTTP 200 response
- "Successfully sent Teams notification" in logs
- **Message APPEARS in Teams channel**
- Power Automate successfully processed the correct payload format
- Logs show: `Webhook type: Power Automate`
- Logs show correct payload format (no `type: "message"` wrapper)

## Additional Notes

### Webhook URL Patterns

**Teams Incoming Webhook:**
- `https://webhook.office.com/webhookb2/...`
- `https://outlook.office.com/webhook/...`
- `https://outlook.office365.com/webhook/...`

**Power Automate (Flow) Webhook:**
- `https://*.powerplatform.com/...`
- `https://*.logic.azure.com/...`
- `https://prod-*.westus.logic.azure.com/...`

The code automatically detects which type based on the hostname.

### Future Improvements

1. **Add webhook validation before saving**:
   - Send a test message when configuring webhook URL
   - Verify the message appears in Teams
   - Only save if successful

2. **Store webhook type in database**:
   - Avoid detection on every request
   - Allow manual override if needed

3. **Add more detailed error responses**:
   - Parse Power Automate error messages
   - Provide actionable troubleshooting steps

4. **Implement webhook health checks**:
   - Periodically test configured webhooks
   - Alert admins if webhooks are failing

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify the webhook URL is correct and not expired
3. Test with the simple script first to isolate the issue
4. Verify Power Automate flow configuration
5. Check Teams channel permissions
