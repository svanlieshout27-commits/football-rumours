import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function scrapeWebsite(url: string, source: string) {
  try {
    console.log(`[${source}] Fetching ${url}...`);
    
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });

    const html = response.data;
    console.log(`[${source}] Got ${html.length} bytes`);

    // Look for ANY mention of the teams
    const hasRangers = html.toLowerCase().includes('rangers');
    const hasFeyenoord = html.toLowerCase().includes('feyenoord');

    console.log(`[${source}] Rangers: ${hasRangers}, Feyenoord: ${hasFeyenoord}`);

    // If we find the team name, save a record
    if (hasRangers || hasFeyenoord) {
      const rumour = {
        player_name: 'Transfer News',
        target_team: hasFeyenoord ? 'Feyenoord' : 'Glasgow Rangers',
        rumour_text: `Found on ${source}`,
        source: source,
        source_url: url,
        published_at: new Date().toISOString(),
        credibility_score: 60
      };

      await supabase.from('rumours').insert([rumour]);
      console.log(`[${source}] ✓ Saved!`);
      return 1;
    }

    console.log(`[${source}] No match found`);
    return 0;
  } catch (error: any) {
    console.error(`[${source}] Error: ${error.message}`);
    return 0;
  }
}

export async function runAllScrapers() {
  console.log('\n=== DEBUG SCRAPE ===\n');

  const sites = [
    { url: 'https://www.rangersfc.co.uk', source: 'Rangers Official' },
    { url: 'https://www.feyenoord.nl', source: 'Feyenoord Official' },
    { url: 'https://www.transfermarkt.com', source: 'Transfermarkt' },
    { url: 'https://www.espn.com/soccer', source: 'ESPN' },
  ];

  let total = 0;
  for (const site of sites) {
    const found = await scrapeWebsite(site.url, site.source);
    total += found;
    // Wait between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== COMPLETE: Found ${total} ===\n`);
  return total;
}