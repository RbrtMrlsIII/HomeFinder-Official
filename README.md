# HomeFinder Official

Find Your Perfect Space - A property rental platform for the Philippines.

## Features

- Property search and listings
- Interactive map view
- User authentication
- Vercel Speed Insights integration for performance monitoring

## Development

### Prerequisites

- Node.js and npm installed

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the Speed Insights bundle:
   ```bash
   npm run build
   ```

3. Open `index.html` in your browser or deploy to a web server.

## Scripts

- `npm run build` - Bundles the Vercel Speed Insights integration

## Speed Insights

This project uses [Vercel Speed Insights](https://vercel.com/docs/speed-insights) to monitor web performance metrics. The Speed Insights script is automatically loaded on each page.

To view Speed Insights data:
1. Deploy your project to Vercel
2. Enable Speed Insights in the Vercel Dashboard
3. Monitor performance metrics in the Speed Insights dashboard

## Deployment

This project is designed to be deployed to Vercel. Simply connect your repository to Vercel and it will automatically deploy.

The build command is already configured in `package.json` to bundle the necessary files.
