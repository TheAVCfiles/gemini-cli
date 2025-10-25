import { PubSub } from '@google-cloud/pubsub';

let pubSubClient;

function getPubSubClient() {
  if (!pubSubClient) {
    pubSubClient = new PubSub();
  }
  return pubSubClient;
}

/**
 * Publish a job to the configured Pub/Sub topic.
 * @param {object} job - Job payload to publish.
 * @returns {Promise<string|null>} The message ID when published, or null when skipped.
 */
export async function createJob(job) {
  const topicName = process.env.PUBSUB_TOPIC;
  if (!topicName) {
    console.warn('PUBSUB_TOPIC not configured; skipping job publication');
    return null;
  }

  const client = getPubSubClient();
  const dataBuffer = Buffer.from(JSON.stringify(job));

  const messageId = await client.topic(topicName).publishMessage({ data: dataBuffer });
  return messageId;
}
