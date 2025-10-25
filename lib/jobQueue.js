import { PubSub } from '@google-cloud/pubsub';

const topicName = process.env.PUBSUB_TOPIC;
const projectId = process.env.PUBSUB_PROJECT_ID;

let pubsub;

function getPubSubClient() {
  if (!pubsub) {
    const options = {};
    if (projectId) {
      options.projectId = projectId;
    }
    pubsub = new PubSub(options);
  }
  return pubsub;
}

export async function createJob(job) {
  if (!topicName) {
    throw new Error('PUBSUB_TOPIC environment variable is required');
  }

  const client = getPubSubClient();
  const dataBuffer = Buffer.from(JSON.stringify(job));
  const messageId = await client.topic(topicName).publishMessage({ data: dataBuffer });
  return messageId;
}
