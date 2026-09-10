import { seedDatabase } from './seed';

seedDatabase()
  .then(() => {
    console.log('Direct seeding completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Direct seeding failed:', err);
    process.exit(1);
  });
