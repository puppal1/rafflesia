# created: 2026-11-23T12:11:00-08:00
# Google Sites embed — simple steps

Google Sites cannot run a whole app from a giant paste of React code.
It only wants a small Embed box that shows a web page.

## What we made
- rafflesia.html = the whole app in ONE file (logo + signup/login)
- PASTE-IN-GOOGLE-SITES.txt = the tiny iframe code for Sites

## What you do
1. Put rafflesia.html on a free host (Cloudflare Pages / GitHub Pages) so it has an https:// link
2. Open PASTE-IN-GOOGLE-SITES.txt
3. Replace YOUR_PUBLIC_HTTPS_LINK with that https link
4. Google Sites -> Insert -> Embed -> Embed code -> paste -> Publish

## Easier option (no embed code)
Google Sites -> Insert -> Embed -> By URL -> paste the https link