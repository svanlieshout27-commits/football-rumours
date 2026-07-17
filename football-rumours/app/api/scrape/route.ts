import { runAllScrapers } from '@/lib/scrapers/all-scrapers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Scraper triggered at', new Date().toISOString());
    const results = await runAllScrapers();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}