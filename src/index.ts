import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
const mode = args.find((arg) => arg === '--web' || arg === '--worker');

if (mode === '--web') {
  import('./server');
} else if (mode === '--worker') {
  import('./bot');
} else {
  import('./bot');
}
