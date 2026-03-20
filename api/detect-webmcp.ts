import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser = null;
  try {
    // Configure Chromium for Vercel Serverless environment
    const executablePath = await chromium.executablePath();
    
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: true,
      defaultViewport: { width: 1920, height: 1080 },
    });

    const page = await browser.newPage();
    
    // Wait until network is idle to ensure React/SPA apps mount and register tools
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

    // Execute script in the context of the loaded page
    const result = await page.evaluate(() => {
      // 1. Check for the standard API
      if (window.navigator && (window.navigator as any).modelContext && typeof (window.navigator as any).modelContext.getRegisteredTools === 'function') {
        return { enabled: true, tools: (window.navigator as any).modelContext.getRegisteredTools() };
      }
      
      // 2. Fallback to the experimental testing API
      if (window.navigator && (window.navigator as any).modelContextTesting && typeof (window.navigator as any).modelContextTesting.listTools === 'function') {
        return { enabled: true, tools: (window.navigator as any).modelContextTesting.listTools() };
      }
      
      // Not found
      return { enabled: false, tools: [] };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Puppeteer Error:', error);
    return res.status(500).json({ error: 'Failed to analyze the page', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
