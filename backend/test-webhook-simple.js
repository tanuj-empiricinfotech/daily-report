#!/usr/bin/env node

/**
 * Simple test script to test Teams webhook directly
 * This bypasses the API and tests the webhook service directly
 *
 * Usage:
 *   node test-webhook-simple.js <WEBHOOK_URL> [DATE]
 *
 * Examples:
 *   node test-webhook-simple.js "https://webhook.office.com/..." 2024-01-04
 *   node test-webhook-simple.js "https://...powerplatform.com/..." 2024-01-04
 */

const { TeamsNotificationService } = require('./dist/services/teams-notification.service');
const { formatTeamsSummaryCard } = require('./dist/utils/teams-card-formatter.util');

// Parse command line arguments
const webhookUrl = process.argv[2];
const date = process.argv[3] || new Date().toISOString().split('T')[0];

if (!webhookUrl) {
  console.error('\nError: Webhook URL is required\n');
  console.log('Usage: node test-webhook-simple.js <WEBHOOK_URL> [DATE]\n');
  console.log('Examples:');
  console.log('  node test-webhook-simple.js "https://webhook.office.com/..." 2024-01-04');
  console.log('  node test-webhook-simple.js "https://...powerplatform.com/..." 2024-01-04\n');
  process.exit(1);
}

// Create a sample team summary
const sampleSummary = {
  teamId: 1,
  teamName: 'MERN',
  date: date,
  totalTeamActualTime: 12.5,
  totalTeamTrackedTime: 11.8,
  userSummaries: [
    {
      userId: 1,
      userName: 'John Doe',
      totalActualTime: 6.5,
      totalTrackedTime: 6.2,
      tasks: [
        {
          projectId: 1,
          projectName: 'Daily Report System',
          taskDescription: 'Implement Teams notification fix',
          actualTime: 4.0,
          trackedTime: 3.8,
        },
        {
          projectId: 1,
          projectName: 'Daily Report System',
          taskDescription: 'Debug webhook integration',
          actualTime: 2.5,
          trackedTime: 2.4,
        },
      ],
    },
    {
      userId: 2,
      userName: 'Jane Smith',
      totalActualTime: 6.0,
      totalTrackedTime: 5.6,
      tasks: [
        {
          projectId: 2,
          projectName: 'E-commerce Platform',
          taskDescription: 'Frontend development',
          actualTime: 4.0,
          trackedTime: 3.8,
        },
        {
          projectId: 2,
          projectName: 'E-commerce Platform',
          taskDescription: 'Code review',
          actualTime: 2.0,
          trackedTime: 1.8,
        },
      ],
    },
  ],
};

async function testWebhook() {
  console.log('='.repeat(60));
  console.log('Teams Webhook Direct Test');
  console.log('='.repeat(60));
  console.log('Date:', date);
  console.log('Webhook URL:', webhookUrl);
  console.log('='.repeat(60));
  console.log('\nSending test notification...\n');

  try {
    const service = new TeamsNotificationService();
    const result = await service.sendDailySummary(sampleSummary, webhookUrl);

    console.log('\n' + '='.repeat(60));
    console.log('Test Result:');
    console.log('='.repeat(60));
    console.log('Success:', result.success);
    console.log('Team:', result.teamName);
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('='.repeat(60));

    if (result.success) {
      console.log('\n✓ Notification sent successfully!');
      console.log('Check your Teams channel for the message.');
    } else {
      console.log('\n✗ Notification failed!');
      console.log('Error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testWebhook();
