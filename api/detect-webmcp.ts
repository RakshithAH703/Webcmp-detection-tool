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
    
    // Use networkidle2 (more forgiving for sites with analytics/websockets)
    // Set timeout to 8000ms to ensure we catch it before Vercel's 10s function limit
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });
    } catch (navError: any) {
      console.warn(`Navigation warning for ${url}:`, navError.message);
      // Continue execution: the DOM is likely loaded enough to extract elements
    }

    // Execute script in the context of the loaded page
    const result = await page.evaluate(() => {
      let enabled = false;
      let registeredTools: any[] = [];

      // 1. Check for the standard API
      if (window.navigator && (window.navigator as any).modelContext && typeof (window.navigator as any).modelContext.getRegisteredTools === 'function') {
        enabled = true;
        registeredTools = (window.navigator as any).modelContext.getRegisteredTools();
      }
      // 2. Fallback to the experimental testing API
      else if (window.navigator && (window.navigator as any).modelContextTesting && typeof (window.navigator as any).modelContextTesting.listTools === 'function') {
        enabled = true;
        registeredTools = (window.navigator as any).modelContextTesting.listTools();
      }
      
      // Extract interactive elements
      const interactiveElements = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const labels = new Set<string>();
      
      interactiveElements.forEach(el => {
        const text = (el.textContent || '').trim();
        // Ignore empty or overly long strings
        if (text && text.length > 0 && text.length <= 50) {
          labels.add(text);
        }
      });

      // Filter out registered tools
      const registeredToolNames = new Set(registeredTools.map(t => (t.name || t.title || '').toLowerCase()));
      
      const actualNonTools: string[] = [];
      labels.forEach(label => {
        if (!registeredToolNames.has(label.toLowerCase())) {
          actualNonTools.push(label);
        }
      });

      return { enabled, registeredTools, actualNonTools };
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