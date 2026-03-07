import { Queue, Worker, type ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const QUEUE_RECURRENCE = "recurrence-expansion";
export const QUEUE_SYNC = "ad-sync";

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export function createWorker(
  name: string,
  processor: ConstructorParameters<typeof Worker>[1],
) {
  return new Worker(name, processor, { connection });
}

export { connection as redisConnection };
