# 🚀 LeetCode Coach - AI-Powered Coding Interview Preparation

An intelligent coding interview preparation platform that leverages Google's Gemini AI to solve LeetCode problems and explain system design concepts. Get instant solutions, detailed explanations, and complexity analysis for 300+ coding problems and 15+ system design scenarios.

## ✨ Features

### 🧠 AI-Powered Problem Solving
- **300+ LeetCode Problems**: Curated collection of top interview questions from major tech companies
- **Multi-Language Support**: Solutions in Python, Go, and Java
- **Instant Solutions**: Get working code with detailed explanations
- **Complexity Analysis**: Time and space complexity with Big-O notation explanations
- **Smart Caching**: Responses cached for improved performance

### 🏗️ System Design Module
- **15+ System Design Problems**: Real-world architecture challenges including:
  - Social platforms (Twitter/X, WhatsApp, Instagram, Discord, LinkedIn)
  - Video streaming (YouTube, Netflix, Twitch, Zoom)
  - Storage systems (Google Drive, Dropbox)
  - Marketplace platforms (Uber/Lyft, Airbnb)
  - Infrastructure tools (URL Shortener, Rate Limiter, Web Crawler)

### 🎯 Company-Focused Preparation
- Problems tagged by companies (Google, Meta, Amazon, Microsoft, etc.)
- Difficulty levels: Easy, Medium, Hard
- Category-based filtering for targeted practice

## 🛠️ Tech Stack

- **Backend**: Go 1.22+ with embedded data
- **Frontend**: React + Vite
- **AI Model**: Google Gemini API (gemini-1.0-pro)
- **Deployment**: Docker + Render.com
- **Styling**: Tailwind CSS

## 📦 Project Structure

```
leetcode-coach/
├── server/              # Go backend
│   ├── main.go         # API server
│   ├── data/           # Embedded problem data
│   │   └── top300.json # LeetCode problems dataset
│   ├── go.mod
│   └── go.sum
├── web/                 # React frontend
│   ├── src/
│   ├── public/
│   │   └── diagrams/   # System design SVG diagrams
│   ├── package.json
│   └── vite.config.js
├── Dockerfile          # Multi-stage build
├── render.yaml         # Render.com deployment config
└── .env.example        # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Go 1.22 or higher
- Node.js 20+
- Google Gemini API key

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/leetcode-coach.git
cd leetcode-coach
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. **Run the backend**
```bash
cd server
go mod download
go run main.go
```

4. **Run the frontend** (in a new terminal)
```bash
cd web
npm install
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- API: http://localhost:8080

## 🐳 Docker Deployment

### Build and run with Docker

```bash
# Build the image
docker build -t leetcode-coach .

# Run the container
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_api_key \
  -e GEMINI_MODEL=gemini-1.0-pro \
  leetcode-coach
```

### Deploy to Render.com

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Add environment variables in Render dashboard:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `GEMINI_MODEL`: gemini-1.0-pro
4. Deploy using the included `render.yaml` configuration

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/problems` | GET | List all problems (optional: `?difficulty=easy`) |
| `/api/solve` | POST | Get AI solution for a problem |

### Example API Request

```javascript
POST /api/solve
{
  "problemId": 1,
  "userPrompt": "Explain the optimal approach",
  "language": "python"
}
```

### Example Response

```javascript
{
  "solutionCode": "def twoSum(nums, target):\n    ...",
  "explanation": "We use a hash map to store complements...",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)",
  "bigOExplainer": "We iterate through the array once..."
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `GEMINI_MODEL` | Gemini model to use | gemini-1.0-pro |
| `NODE_ENV` | Environment mode | development |

## 📊 Features in Detail

### Problem Categories
- Arrays & Strings
- Trees & Graphs
- Dynamic Programming
- Linked Lists
- Sorting & Searching
- System Design

### Supported Companies
- Google (FAANG)
- Meta (Facebook)
- Amazon
- Microsoft
- Apple
- Netflix
- Uber
- Airbnb
- And many more...

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- LeetCode for problem inspiration
- Google Gemini for AI capabilities
- The open-source community for various tools and libraries

## ⚠️ Disclaimer

This tool is for educational purposes. Always understand the solutions rather than memorizing them. The AI-generated solutions should be used as learning aids, not as direct submissions to coding platforms.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---

**Happy Coding! 🎯** Master your coding interviews with AI-powered assistance.