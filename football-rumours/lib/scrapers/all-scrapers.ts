/**
 * FOOTBALL RUMOURS SCRAPER - ALL 7 SOURCES
 *
 * Scrapes from:
 * 1. Transfermarkt
 * 2. ESPN
 * 3. Sky Sports
 * 4. Voetbalprimeur.nl (Dutch football)
 * 5. FlashScore
 * 6. Goal.com
 * 7. Nitter (Free Twitter alternative)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========== 1. TRANSFERMARKT ==========
async function scrapeTransfermarkt() {
  const rumours: any[] = [];
  try {
    console.log('[Transfermarkt] Starting...');
    const teams = [
      { name: 'Glasgow Rangers', id: 26 },
      { name: 'Feyenoord', id: 25 }
    ];

    for (const team of teams) {
      const { data } = await axios.get(
        `https://www.transfermarkt.com/glasgow-rangers/transfers/verein/${team.id}`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
      );
      const $ = cheerio.load(data);
      $('table.items tbody tr').each((_, el) => {
        const playerName = $(el).find('td:nth-child(2) a').text().trim();
        const fromTeam = $(el).find('td:nth-child(3)').text().trim();
        const fee = $(el).find('td:nth-child(5)').text().trim();
        const link = $(el).find('td:nth-child(2) a').attr('href');
        if (playerName && fee) {
          rumours.push({
            player_name: playerName,
            current_team: fromTeam || null,
            target_team: team.name,
            rumour_text: `Transfer: ${playerName} - Fee: ${fee}`,
            source: 'Transfermarkt',
            source_url: link ? `https://www.transfermarkt.com${link}` : null,
            published_at: new Date().toISOString(),
            credibility_score: 90
          });
        }
      });
    }
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[Transfermarkt] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[Transfermarkt] Error:', error);
    return 0;
  }
}

// ========== 2. ESPN ==========
async function scrapeESPN() {
  const rumours: any[] = [];
  try {
    console.log('[ESPN] Starting...');
    const { data } = await axios.get('https://www.espn.com/soccer/transfers', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    $('div.Table__TR').each((_, el) => {
      const text = $(el).text();
      const link = $(el).find('a').attr('href');
      if ((text.includes('Rangers') || text.includes('Feyenoord')) && text.length > 10) {
        const playerName = extractPlayerName(text);
        if (playerName !== 'Unknown Player') {
          rumours.push({
            player_name: playerName,
            target_team: text.includes('Rangers') ? 'Glasgow Rangers' : 'Feyenoord',
            rumour_text: text.substring(0, 300),
            source: 'ESPN',
            source_url: link,
            published_at: new Date().toISOString(),
            credibility_score: 85
          });
        }
      }
    });
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[ESPN] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[ESPN] Error:', error);
    return 0;
  }
}

// ========== 3. SKY SPORTS ==========
async function scrapeSkySports() {
  const rumours: any[] = [];
  try {
    console.log('[Sky Sports] Starting...');
    const { data } = await axios.get('https://www.skysports.com/football/transfer-news', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    $('article, div[data-component="MatchArticleTeaser"]').each((_, el) => {
      const title = $(el).find('h3, h2, .sdc-article-header').text().trim();
      const link = $(el).find('a').attr('href');
      if ((title.includes('Rangers') || title.includes('Feyenoord')) && title.length > 5) {
        const playerName = extractPlayerName(title);
        if (playerName !== 'Unknown Player') {
          rumours.push({
            player_name: playerName,
            target_team: title.includes('Rangers') ? 'Glasgow Rangers' : 'Feyenoord',
            rumour_text: title,
            source: 'Sky Sports',
            source_url: link ? `https://www.skysports.com${link}` : null,
            published_at: new Date().toISOString(),
            credibility_score: 85
          });
        }
      }
    });
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[Sky Sports] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[Sky Sports] Error:', error);
    return 0;
  }
}

// ========== 4. VOETBALPRIMEUR.NL ==========
async function scrapeVoetbalprimeur() {
  const rumours: any[] = [];
  try {
    console.log('[Voetbalprimeur] Starting...');
    const { data } = await axios.get('https://www.voetbalprimeur.nl/transfers.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    $('div.transfer-item, article.news-item, div[class*="transfer"]').each((_, el) => {
      const title = $(el).find('h3, h2, .title, a').text().trim();
      const link = $(el).find('a').attr('href');
      if ((title.includes('Rangers') || title.includes('Feyenoord')) && title.length > 5) {
        const playerName = extractPlayerName(title);
        if (playerName !== 'Unknown Player') {
          rumours.push({
            player_name: playerName,
            target_team: title.includes('Rangers') ? 'Glasgow Rangers' : 'Feyenoord',
            rumour_text: title,
            source: 'Voetbalprimeur',
            source_url: link ? (link.startsWith('http') ? link : `https://www.voetbalprimeur.nl${link}`) : null,
            published_at: new Date().toISOString(),
            credibility_score: 82
          });
        }
      }
    });
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[Voetbalprimeur] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[Voetbalprimeur] Error:', error);
    return 0;
  }
}

// ========== 5. FLASHSCORE ==========
async function scrapeFlashScore() {
  const rumours: any[] = [];
  try {
    console.log('[FlashScore] Starting...');
    const { data } = await axios.get('https://www.flashscore.com/football/transfers/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    $('div[class*="transfer"], tr[class*="transfer"]').each((_, el) => {
      const playerName = $(el).find('[class*="player"], td').eq(0).text().trim();
      const from = $(el).find('[class*="from"], td').eq(1).text().trim();
      const to = $(el).find('[class*="to"], td').eq(2).text().trim();
      if ((to.includes('Rangers') || to.includes('Feyenoord')) && playerName.length > 2) {
        rumours.push({
          player_name: playerName,
          current_team: from || null,
          target_team: to.includes('Rangers') ? 'Glasgow Rangers' : 'Feyenoord',
          rumour_text: `Transfer: ${playerName} from ${from} to ${to}`,
          source: 'FlashScore',
          source_url: 'https://www.flashscore.com/football/transfers/',
          published_at: new Date().toISOString(),
          credibility_score: 75
        });
      }
    });
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[FlashScore] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[FlashScore] Error:', error);
    return 0;
  }
}

// ========== 6. GOAL.COM ==========
async function scrapeGoal() {
  const rumours: any[] = [];
  try {
    console.log('[Goal.com] Starting...');
    const teams = [
      { name: 'Glasgow Rangers', id: 'glasgow-rangers' },
      { name: 'Feyenoord', id: 'feyenoord' }
    ];
    for (const team of teams) {
      const { data } = await axios.get(`https://www.goal.com/en/teams/${team.id}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const $ = cheerio.load(data);
      $('article, div[class*="article"], div[class*="news"]').each((_, el) => {
        const title = $(el).find('h3, h2, a[class*="headline"]').text().trim();
        const link = $(el).find('a').attr('href');
        if (title.toLowerCase().includes('transfer') || title.toLowerCase().includes('sign')) {
          const playerName = extractPlayerName(title);
          if (playerName !== 'Unknown Player') {
            rumours.push({
              player_name: playerName,
              target_team: team.name,
              rumour_text: title,
              source: 'Goal.com',
              source_url: link,
              published_at: new Date().toISOString(),
              credibility_score: 78
            });
          }
        }
      });
    }
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[Goal.com] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[Goal.com] Error:', error);
    return 0;
  }
}

// ========== 7. NITTER (FREE TWITTER) ==========
async function scrapeNitter() {
  const rumours: any[] = [];
  const instances = ['https://nitter.net', 'https://nitter.poast.org'];
  const accounts = ['FabrizioRomano', 'jonathanveal11', 'kieranmaguire'];
  let workingInstance = instances[0];

  try {
    console.log('[Nitter] Starting...');
    for (const instance of instances) {
      try {
        await axios.get(instance, { timeout: 5000 });
        workingInstance = instance;
        break;
      } catch {}
    }

    for (const account of accounts) {
      try {
        const { data } = await axios.get(
          `${workingInstance}/${account}/search?q=Rangers%20OR%20Feyenoord%20transfer`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 }
        );
        const $ = cheerio.load(data);
        $('div.tweet, article').each((_, el) => {
          const text = $(el).find('.tweet-text, .post-text, p').text().trim();
          const tweetPath = $(el).find(`a[href*="/${account}/status/"]`).attr('href');
          if (text && (text.includes('Rangers') || text.includes('Feyenoord'))) {
            const playerName = extractPlayerName(text);
            if (playerName !== 'Unknown Player' && text.length > 10) {
              rumours.push({
                player_name: playerName,
                target_team: text.includes('Rangers') ? 'Glasgow Rangers' : 'Feyenoord',
                rumour_text: text.substring(0, 500),
                source: 'Twitter/Nitter',
                source_url: tweetPath ? `${workingInstance}${tweetPath}` : null,
                published_at: new Date().toISOString(),
                credibility_score: account === 'FabrizioRomano' ? 85 : 70
              });
            }
          }
        });
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        console.warn(`[Nitter] Failed to scrape ${account}`);
      }
    }
    if (rumours.length > 0) {
      await supabase.from('rumours').insert(rumours);
    }
    console.log(`[Nitter] ✓ Found ${rumours.length}`);
    return rumours.length;
  } catch (error) {
    console.error('[Nitter] Error:', error);
    return 0;
  }
}

// ========== HELPERS ==========
function extractPlayerName(text: string): string {
  const patterns = [
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:to|from|transfer|sign)/i,
    /(?:Rangers|Feyenoord|signs?|transfers?)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return 'Unknown Player';
}

// ========== MAIN FUNCTION ==========
export async function runAllScrapers() {
  console.log('\n=== STARTING SCRAPE ===\n');
  const results = { success: 0, failed: 0 };
  const scrapers = [
    { name: 'Transfermarkt', fn: scrapeTransfermarkt },
    { name: 'ESPN', fn: scrapeESPN },
    { name: 'Sky Sports', fn: scrapeSkySports },
    { name: 'Voetbalprimeur', fn: scrapeVoetbalprimeur },
    { name: 'FlashScore', fn: scrapeFlashScore },
    { name: 'Goal.com', fn: scrapeGoal },
    { name: 'Nitter', fn: scrapeNitter }
  ];

  for (const scraper of scrapers) {
    try {
      await scraper.fn();
      results.success++;
    } catch (error) {
      results.failed++;
    }
  }

  console.log('\n=== SCRAPE COMPLETE ===');
  console.log(`Success: ${results.success}, Failed: ${results.failed}\n`);
  return results;
}