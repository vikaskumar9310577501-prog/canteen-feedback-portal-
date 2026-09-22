import { Redis } from '@upstash/redis';
import { INITIAL_PLANTS, INITIAL_FEEDBACKS, INITIAL_SETTINGS, DEMO_ADMINS } from './src/lib/mockData.ts';

const redis = new Redis({
  url: 'https://lucky-pigeon-85001.upstash.io',
  token: 'gQAAAAAAAUwJAAIgcDIyOGM3ZjQ5NWM1Njk0YWQ2YmJlYmQ0ZDIzMTUyMmU5Ng',
});

async function main() {
  console.log('Seeding Upstash Redis with native Redis List data...');
  console.log(`Plants count: ${INITIAL_PLANTS.length}`);
  console.log(`Feedbacks count: ${INITIAL_FEEDBACKS.length}`);

  // Clean old keys
  await redis.del('canteen:feedback:list');
  await redis.del('canteen:feedbacks');

  // Push feedbacks into Redis LIST (oldest first so newest is at head)
  const sorted = [...INITIAL_FEEDBACKS].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  for (const fb of sorted) {
    await redis.lpush('canteen:feedback:list', JSON.stringify(fb));
  }

  // Seed plants
  await redis.set('canteen:plants:list', JSON.stringify(INITIAL_PLANTS));
  // Seed settings
  await redis.set('canteen:settings', JSON.stringify(INITIAL_SETTINGS));
  // Seed admins
  await redis.set('canteen:admins', JSON.stringify(DEMO_ADMINS));

  const listLen = await redis.llen('canteen:feedback:list');
  console.log(`Successfully seeded Redis List! Length: ${listLen}`);
}

main().catch(console.error);
