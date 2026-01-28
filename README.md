# CineMatch - Movie & Series Recommendation App

A production-grade movie and series recommendation application with support for both Bollywood and Hollywood content, powered by TMDB API.

## ✨ Features

### Core Capabilities
- **Dual Industry Support**: Separate Bollywood and Hollywood catalogs
- **Movies & Series**: Different treatment and scoring for each content type
- **Massive Catalog**: Access to 500,000+ movies and TV shows via TMDB API
- **Smart Recommendations**: AI-powered scoring algorithm based on your unique taste
- **Learning System**: Recommendations improve with every interaction
- **Series-Specific Preferences**: Episode length, binge preference, season commitment

### Key Requirements Met
✅ Industry selection (Bollywood/Hollywood/Both)
✅ Content type selection (Movie/Series/Both)
✅ Large, real catalog from TMDB API
✅ Rich metadata (genres, themes, ratings, years)
✅ Structured preferences (no free text)
✅ Conditional clarification questions
✅ Different scoring for movies vs series
✅ Accurate filtering by industry
✅ Feedback loop for continuous improvement

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm installed
- A free TMDB API key (get one at https://www.themoviedb.org/settings/api)

### Installation Steps

1. **Extract the ZIP file**
   ```bash
   unzip cinematch-app.zip
   cd cinematch-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get your TMDB API key**
   - Go to https://www.themoviedb.org/signup
   - Create a free account
   - Go to Settings > API > Create API Key
   - Choose "Developer" and fill out the form
   - Copy your API key (v3 auth)

4. **Configure API key**
   - Open `src/App.jsx`
   - Find line 5: `const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE';`
   - Replace `'YOUR_TMDB_API_KEY_HERE'` with your actual API key
   - Example: `const TMDB_API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';`

5. **Run the application**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - The app will automatically open at `http://localhost:5173`
   - Or manually visit that URL

## 📖 How to Use

### Step 1: Choose Your Industry
- **Bollywood**: Only Hindi films and series
- **Hollywood**: Only English films and series  
- **Both**: Mixed content from both industries

### Step 2: Select Content Type
- **Movies**: Feature films only
- **Series**: TV shows only
- **Both**: Movies and series together

### Step 3: Pick Your Favorites (3-10)
- Search for titles you love
- Browse popular suggestions (200+ items loaded)
- Select at least 3, up to 10 items
- The app analyzes: genres, themes, ratings, popularity, language

### Step 4: Fine-Tune Preferences
- **Genres**: Multi-select from 11 genres
- **Mood**: Dark ← → Light (slider)
- **Era**: 1980s through 2020s (multi-select)
- **Discovery Style**: Popular / Mixed / Hidden Gems

**Series-Specific Options** (if you selected series):
- **Episode Length**: Short (20-30min) ← → Long (60min+)
- **Watching Style**: Casual ← → Binge-watch
- **Season Commitment**: Mini-series ← → Long-running

### Step 5: Get Recommendations
- Receive 5 personalized recommendations
- Each includes:
  - Full metadata (title, year, rating, type)
  - Poster image
  - Reason for recommendation
  - Overview/synopsis
- **Like** 👍 or **Dislike** 👎 to refine future results
- Click **Refine Results** to generate new recommendations

## 🔧 Technical Architecture

### Data Source: TMDB API
- **Movies Database**: 500,000+ titles
- **TV Database**: 150,000+ series
- **Real-time Search**: Instant results as you type
- **Rich Metadata**: Genres, ratings, cast, crew, languages, production countries

### Recommendation Algorithm

**Scoring Factors (weighted):**
1. **Genre Matching** (highest weight): +15 per match
2. **Theme Alignment**: Based on selected items
3. **Rating Quality**: +5 per vote_average point
4. **Popularity Match**: Compares user's avg popularity
5. **Era Preference**: +10 for matching decade
6. **Series-Specific**: Episode length, commitment level

**Filtering Rules:**
- Bollywood-only users: NEVER see Hollywood content
- Hollywood-only users: NEVER see Bollywood content
- Movie-only users: NEVER see series
- Series-only users: NEVER see movies

### Learning Loop
- Every "Like" increases weight for those genres
- Every "Dislike" decreases genre weights
- Profile persists across refinements
- Clarification questions only trigger when signals are unclear

## 📁 Project Structure

```
cinematch-app/
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles + Tailwind
├── public/               # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
├── postcss.config.js    # PostCSS config
└── README.md            # This file
```

## 🎯 Success Criteria Verification

### ✅ Data Layer
- ❌ No hardcoded movie list
- ✅ TMDB API integration with 650,000+ titles
- ✅ Bollywood detection via language + production country
- ✅ Industry field on every item
- ✅ Type field (movie/series) on every item

### ✅ User Flow
- ✅ Industry selector BEFORE any content
- ✅ Content type selector BEFORE selection
- ✅ Filtered catalog shows only relevant items
- ✅ Search across massive catalog (not 30 items)
- ✅ 200+ popular items loaded per selection

### ✅ Recommendations
- ✅ Bollywood user never sees Hollywood
- ✅ Series-only user never gets movies
- ✅ Can search any mainstream title
- ✅ Accuracy improves with more selections
- ✅ Different scoring for movies vs series

### ✅ Series Features
- ✅ Episode length preference
- ✅ Binge vs casual toggle
- ✅ Season commitment slider
- ✅ Separate series recommendations

## 🐛 Troubleshooting

### "TMDB API Error"
- Verify your API key is correct
- Check you copied the v3 API key (not v4)
- Ensure no extra spaces in the key
- API keys can take 15 minutes to activate

### "No results found"
- Try broader search terms
- Check your industry/type filters
- Some Bollywood content may have limited data

### Port already in use
- Vite will automatically suggest another port
- Or specify: `npm run dev -- --port 3000`

### Slow loading
- Initial catalog load fetches 200+ items
- Searches are instant after first load
- Images load progressively

## 🔑 Environment Variables (Optional)

For production deployment, create a `.env` file:

```env
VITE_TMDB_API_KEY=your_api_key_here
```

Then in `App.jsx`:
```javascript
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
```

## 📝 License

This project uses TMDB API. Ensure compliance with TMDB's terms of service:
https://www.themoviedb.org/terms-of-use

## 🤝 Support

For issues or questions:
1. Check the TMDB API status: https://status.themoviedb.org/
2. Verify your API key at: https://www.themoviedb.org/settings/api
3. Review the troubleshooting section above

## 🎬 Enjoy discovering your next favorite movie or series!
