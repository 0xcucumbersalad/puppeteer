/**
 * @file api/v1/scan/js/route.ts
 * @description This file contains the API route handlers for scanning and extracting JavaScript files from a given URL using Puppeteer.
 * 
 * @module api/v1/scan/js/route.ts
 * 
 * @requires puppeteer
 * @requires next/server
 * 
 * @author cucumbersalad
 */


import puppeteer from 'puppeteer';
import { NextRequest } from 'next/server';

export async function GET() {
    return Response.json({ message: 'GET request to /api/v1/scan/js' });
}

export async function POST(req: NextRequest) {
    const { url } = await req.json();

    if(!url) {
        return Response.json({ message: "URL is required" }, { status: 400 });
    }

    if(!url.startsWith("http")) {
        return Response.json({ message: "URL must start with http or https" }, { status: 400 });
    }
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        const jsFiles = new Set();
        page.on("request", (request) => {
            //console.log(request.response());
            const reqUrl = request.url();
            //console.log(reqUrl);
            if (reqUrl.endsWith(".js")) {
                if(reqUrl.includes(url)) {
                    jsFiles.add(reqUrl);
                }
            }
        });

        // Wait for network requests to finish
        await page.goto(url, { waitUntil: "networkidle2" });
        await page.waitForSelector("script[src]", { timeout: 5000 }).catch(() => {});

        await browser.close();

        return Response.json({ files: Array.from(jsFiles) });
    } catch (error) {
        console.error("Error scraping:", error);
        return Response.json({ message: "Scraping failed" }, { status: 500 });
    }

}