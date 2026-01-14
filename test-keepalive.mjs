#!/usr/bin/env node

/**
 * Test script for keepalive endpoint
 * Usage:
 *   node test-keepalive.mjs                    # Test local dev server
 *   node test-keepalive.mjs https://your-app.vercel.app  # Test production
 */

const baseUrl = process.argv[2] || 'http://localhost:3000';
const url = `${baseUrl}/api/keepalive`;

console.log(`Testing keepalive endpoint: ${url}\n`);

try {
  const response = await fetch(url, {
    headers: {
      // Simulate Vercel cron header (only needed for production)
      'x-vercel-cron': 'true',
    },
  });

  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  if (response.status === 204) {
    console.log('\n✅ SUCCESS: Keepalive endpoint is working!');
    console.log('   Database connection is healthy.');
  } else {
    const text = await response.text();
    console.log('\nResponse body:', text);
    
    if (response.status === 403) {
      console.log('\n⚠️  403 Forbidden - This is expected in production without the cron header.');
      console.log('   The cron job will work fine, but manual tests are blocked.');
    } else if (response.status === 500) {
      console.log('\n❌ ERROR: Database connection failed!');
      console.log('   Check your environment variables:');
      console.log('   - NEXT_PUBLIC_SUPABASE_URL');
      console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    }
  }
} catch (error) {
  console.error('\n❌ NETWORK ERROR:', error.message);
  console.error('   Make sure your server is running (npm run dev)');
  process.exit(1);
}
