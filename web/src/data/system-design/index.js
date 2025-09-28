// Metadata for all 30 system design questions
// Full content is lazy-loaded from individual question files

export const systemDesignQuestions = [
  // Social Media & Communication
  {
    id: 'twitter',
    title: 'Design Twitter/X',
    companies: ['Meta', 'Microsoft', 'Amazon'],
    difficulty: 'Hard',
    category: 'Social Media & Communication'
  },
  {
    id: 'whatsapp',
    title: 'Design WhatsApp',
    companies: ['Meta', 'Microsoft', 'Amazon'],
    difficulty: 'Medium',
    category: 'Social Media & Communication'
  },
  {
    id: 'instagram',
    title: 'Design Instagram',
    companies: ['Meta', 'Google', 'Snapchat'],
    difficulty: 'Medium',
    category: 'Social Media & Communication'
  },
  {
    id: 'discord',
    title: 'Design Discord',
    companies: ['Microsoft', 'Amazon', 'Meta'],
    difficulty: 'Medium',
    category: 'Social Media & Communication'
  },
  {
    id: 'facebook-newsfeed',
    title: 'Design Facebook Newsfeed',
    companies: ['Meta', 'Twitter', 'LinkedIn'],
    difficulty: 'Hard',
    category: 'Social Media & Communication'
  },
  {
    id: 'linkedin',
    title: 'Design LinkedIn',
    companies: ['Microsoft', 'Meta', 'Google'],
    difficulty: 'Medium',
    category: 'Social Media & Communication'
  },
  {
    id: 'telegram',
    title: 'Design Telegram',
    companies: ['Meta', 'Signal', 'Discord'],
    difficulty: 'Medium',
    category: 'Social Media & Communication'
  },
  // {
  //   id: 'reddit',
  //   title: 'Design Reddit',
  //   companies: ['Meta', 'Twitter', 'Google'],
  //   difficulty: 'Medium',
  //   category: 'Social Media & Communication'
  // },
  
  // Video & Streaming
  {
    id: 'youtube',
    title: 'Design YouTube',
    companies: ['Google', 'Meta', 'Netflix'],
    difficulty: 'Hard',
    category: 'Video & Streaming'
  },
  {
    id: 'netflix',
    title: 'Design Netflix',
    companies: ['Netflix', 'Amazon', 'Google'],
    difficulty: 'Hard',
    category: 'Video & Streaming'
  },
  {
    id: 'twitch',
    title: 'Design Twitch',
    companies: ['Amazon', 'YouTube', 'Meta'],
    difficulty: 'Hard',
    category: 'Video & Streaming'
  },
  {
    id: 'zoom',
    title: 'Design Zoom',
    companies: ['Microsoft', 'Google', 'Meta'],
    difficulty: 'Hard',
    category: 'Video & Streaming'
  },
  
  // Storage & Files
  {
    id: 'google-drive',
    title: 'Design Google Drive',
    companies: ['Google', 'Microsoft', 'Dropbox'],
    difficulty: 'Medium',
    category: 'Storage & Files'
  },
  {
    id: 'dropbox',
    title: 'Design Dropbox',
    companies: ['Dropbox', 'Google', 'Microsoft'],
    difficulty: 'Medium',
    category: 'Storage & Files'
  },
  // {
  //   id: 'google-photos',
  //   title: 'Design Google Photos',
  //   companies: ['Google', 'Apple', 'Amazon'],
  //   difficulty: 'Medium',
  //   category: 'Storage & Files'
  // },
  
  // E-commerce & Marketplace
  // {
  //   id: 'amazon',
  //   title: 'Design Amazon E-commerce',
  //   companies: ['Amazon', 'Walmart', 'Alibaba'],
  //   difficulty: 'Hard',
  //   category: 'E-commerce & Marketplace'
  // },
  {
    id: 'uber',
    title: 'Design Uber/Lyft',
    companies: ['Uber', 'Lyft', 'Google'],
    difficulty: 'Hard',
    category: 'E-commerce & Marketplace'
  },
  {
    id: 'airbnb',
    title: 'Design Airbnb',
    companies: ['Airbnb', 'Booking', 'Expedia'],
    difficulty: 'Medium',
    category: 'E-commerce & Marketplace'
  },
  // {
  //   id: 'ticketmaster',
  //   title: 'Design Ticketmaster',
  //   companies: ['Ticketmaster', 'StubHub', 'Amazon'],
  //   difficulty: 'Hard',
  //   category: 'E-commerce & Marketplace'
  // },
  
  // Infrastructure & Tools
  {
    id: 'url-shortener',
    title: 'Design URL Shortener',
    companies: ['Google', 'Amazon', 'Microsoft'],
    difficulty: 'Easy',
    category: 'Infrastructure & Tools'
  },
  // {
  //   id: 'pastebin',
  //   title: 'Design Pastebin',
  //   companies: ['Amazon', 'Microsoft', 'Google'],
  //   difficulty: 'Easy',
  //   category: 'Infrastructure & Tools'
  // },
  {
    id: 'rate-limiter',
    title: 'Design Rate Limiter',
    companies: ['Stripe', 'Amazon', 'Google'],
    difficulty: 'Easy',
    category: 'Infrastructure & Tools'
  },
  // {
  //   id: 'distributed-cache',
  //   title: 'Design Distributed Cache',
  //   companies: ['Redis', 'Amazon', 'Google'],
  //   difficulty: 'Medium',
  //   category: 'Infrastructure & Tools'
  // },
  // {
  //   id: 'search-autocomplete',
  //   title: 'Design Search Autocomplete',
  //   companies: ['Google', 'Amazon', 'Microsoft'],
  //   difficulty: 'Easy',
  //   category: 'Infrastructure & Tools'
  // },
  {
    id: 'web-crawler',
    title: 'Design Web Crawler',
    companies: ['Google', 'Microsoft', 'Amazon'],
    difficulty: 'Medium',
    category: 'Infrastructure & Tools'
  },
  
  // Financial & Payments
  // {
  //   id: 'payment-system',
  //   title: 'Design Payment System (Stripe)',
  //   companies: ['Stripe', 'PayPal', 'Square'],
  //   difficulty: 'Medium',
  //   category: 'Financial & Payments'
  // },
  // {
  //   id: 'stock-trading',
  //   title: 'Design Stock Trading System',
  //   companies: ['Robinhood', 'Goldman Sachs', 'Morgan Stanley'],
  //   difficulty: 'Medium',
  //   category: 'Financial & Payments'
  // },
  
  // Gaming & Real-time
  // {
  //   id: 'multiplayer-game',
  //   title: 'Design Online Multiplayer Game',
  //   companies: ['Riot', 'Epic Games', 'Microsoft'],
  //   difficulty: 'Hard',
  //   category: 'Gaming & Real-time'
  // },
  // {
  //   id: 'leaderboard',
  //   title: 'Design Leaderboard System',
  //   companies: ['Gaming Companies', 'Meta', 'Google'],
  //   difficulty: 'Easy',
  //   category: 'Gaming & Real-time'
  // },
  // {
  //   id: 'notification-system',
  //   title: 'Design Notification System',
  //   companies: ['Apple', 'Google', 'Meta'],
  //   difficulty: 'Medium',
  //   category: 'Gaming & Real-time'
  // }
]

// Categories for filtering
export const categories = [
  'All',
  'Social Media & Communication',
  'Video & Streaming',
  'Storage & Files',
  'E-commerce & Marketplace',
  'Infrastructure & Tools',
  'Financial & Payments',
  'Gaming & Real-time'
]

// Difficulty levels
export const difficulties = ['All', 'Easy', 'Medium', 'Hard']