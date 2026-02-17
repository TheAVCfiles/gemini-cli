# Firebase Hosting Deployment Guide

This guide explains how to deploy the NervösOS product landing pages to Firebase Hosting.

## Overview

The landing pages showcase five key products under the NervösOS umbrella:

- **Bot Gym** (`/bot-gym/`) - AI training and prompt workouts
- **LoopPool** (`/looppool/`) - Feedback loop automation for AI assistants
- **Retriever AG** (`/retriever-ag/`) - RAG-as-a-service with Golden RAG branding
- **Cache Up** (`/cache-up/`) - Glossary conflict detection and synchronization
- **Art Official Intelligence** (`/art-official-intelligence/`) - AI art tools and community

## Project Structure

```
public/
├── index.html                              # Main landing page
├── styles.css                              # Shared styles with product-specific theming
├── robots.txt                              # SEO configuration
├── 404.html                               # Custom 404 page
├── bot-gym/
│   └── index.html                         # Bot Gym landing page
├── looppool/
│   └── index.html                         # LoopPool landing page
├── retriever-ag/
│   └── index.html                         # Retriever AG landing page
├── cache-up/
│   └── index.html                         # Cache Up landing page
└── art-official-intelligence/
    └── index.html                         # Art Official Intelligence landing page
```

## Firebase Configuration

The `firebase.json` file is optimized for hosting with:

- **Clean URLs**: Removes `.html` extensions from URLs
- **Custom Rewrites**: Each product directory serves its `index.html` for any sub-path
- **Caching Headers**: Long-term caching for CSS/JS, shorter caching for HTML
- **404 Handling**: Custom 404 page for better user experience

## Deployment Steps

### Prerequisites

1. **Node.js 18+** - Required for Firebase CLI
2. **Firebase CLI** - Install with `npm install -g firebase-tools`
3. **Firebase Project** - Create or use existing project in Firebase Console
4. **Authentication** - Run `firebase login` to authenticate

### Initial Setup

1. **Initialize Firebase in the project** (if not already done):
   ```bash
   firebase init hosting
   ```
2. **Configure the project**:

   ```bash
   firebase use <your-project-id>
   ```

3. **Set up hosting targets** (optional, for multiple sites):
   ```bash
   firebase target:apply hosting nervosos-products <site-id>
   ```

### Deploy

1. **Build the project** (optional, for dynamic content):

   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting**:

   ```bash
   firebase deploy --only hosting
   ```

   Or for specific targets:

   ```bash
   firebase deploy --only hosting:nervosos-products
   ```

### Testing Locally

Test the hosting configuration locally before deploying:

```bash
firebase serve --only hosting
```

This serves the site at `http://localhost:5000` using the same configuration as production.

## Features

### Product-Specific Branding

Each product has its own color scheme defined in CSS custom properties:

- Bot Gym: Red/Orange (`--primary-color: #dc2626`)
- LoopPool: Blue/Cyan (`--primary-color: #0891b2`)
- Retriever AG: Green/Lime (`--primary-color: #16a34a`)
- Cache Up: Purple/Violet (`--primary-color: #7c3aed`)
- Art Official Intelligence: Pink/Rose (`--primary-color: #db2777`)

### SEO Optimization

- Semantic HTML structure
- Meta descriptions for each page
- Clean URLs and proper routing
- Robots.txt for search engine guidance
- Fast loading with optimized caching

### Lead Generation

Each page includes:

- Primary call-to-action buttons
- Lead magnet email capture forms
- Free trial/starter kit offerings
- Clear value propositions

### NervösOS Branding

All pages include discrete footer attribution to the NervösOS umbrella while maintaining individual product brand identities.

## Content Management

Product copy is based on the content from `docs/product-landing-copy.md` and optimized for:

- Hero messaging and value propositions
- Problem/solution framing
- Social proof and benefits
- Clear calls-to-action
- Lead magnet offers

## Performance

The configuration includes optimizations for:

- **Static Asset Caching**: CSS and JS files cached for 1 year
- **HTML Caching**: HTML files cached for 1 hour to allow updates
- **Clean URLs**: Better SEO and user experience
- **Minimal Dependencies**: Pure HTML/CSS with no heavy frameworks

## Maintenance

To update content:

1. Edit the HTML files in the `public/` directory
2. Test locally with `firebase serve`
3. Deploy with `firebase deploy --only hosting`

The static nature of the site makes updates fast and reliable.
