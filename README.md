# Rick & Share-ah 💕

A brutalist-cute expense splitting app for couples. Track who paid for what, split expenses by percentage or shares, and settle up when needed.

![Brutalist Design](https://img.shields.io/badge/Design-Brutalist%20Cute-FF6B6B)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38B2AC)

## Features

- 🏠 **Dashboard** - See your running balance at a glance
- ➕ **Add Expenses** - Quick entry with categories and split options
- 📋 **History** - Filter and search through past expenses
- 💰 **Settle Up** - Record payments between partners
- ⚖️ **Flexible Splitting** - 50/50, percentage, or exact amounts
- 🎨 **Brutalist Design** - Bold, playful, and modern UI

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 with custom brutalist theme
- **Routing**: React Router 7
- **Storage**: localStorage (AWS DynamoDB ready)
- **Hosting**: AWS Amplify compatible

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Design System

### Color Palette - "Cozy Brutalist"

| Color | Hex | Usage |
|-------|-----|-------|
| Cream | `#FFF8F0` | Background |
| Coral | `#FF6B6B` | Primary action, Partner 1 |
| Sage | `#95D5B2` | Secondary, Partner 2, Success |
| Plum | `#5C374C` | Text, borders |
| Sunshine | `#FFE66D` | Highlights, active states |

### Typography

- **Display**: Outfit (headings, UI text)
- **Mono**: Space Mono (numbers, labels, data)

### Components

All components follow the brutalist aesthetic:
- Thick 3-4px borders
- Offset box shadows for "sticker" effect
- Bold uppercase labels
- Playful hover animations

## Deploying to AWS Amplify

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. Click "New app" → "Host web app"
4. Connect your repository
5. Amplify will auto-detect the build settings from `amplify.yml`
6. Deploy!

**Free Tier Coverage:**
- Amplify Hosting: 1000 build mins/mo, 15GB served
- Perfect for a couples app with 2 users!

## Future Enhancements

- [ ] AWS Cognito authentication
- [ ] DynamoDB backend for cloud sync
- [ ] Real-time updates between partners
- [ ] Monthly spending reports
- [ ] Export to CSV
- [ ] PWA support

## License

MIT - Made with 💕 for couples who share everything
