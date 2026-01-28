import React, { useState, useEffect } from 'react';
import { Search, Star, ThumbsUp, ThumbsDown, RefreshCw, Film, Sparkles, X, Tv, Globe } from 'lucide-react';


const TMDB_API_KEY = 'cbf6753bbe89f1a852f43a7c69767016'; // Users need to get their own free key from themoviedb.org
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const DEMO_MODE = !TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE';

export default function MovieRecommender() {
  const [step, setStep] = useState('welcome');
  const [industry, setIndustry] = useState(null); // 'bollywood', 'hollywood', 'both'
  const [contentType, setContentType] = useState(null); // 'movie', 'series', 'both'
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    genres: [],
    mood: 50,
    pace: 50,
    era: ['2010s', '2020s'],
    languageOpen: true,
    popularity: 'mixed',
    violence: 50,
    horror: true,
    adultThemes: true,
    // Series-specific
    episodeLength: 50, // 0 = short, 100 = long
    bingePreference: 50, // 0 = casual, 100 = binge
    seasonCommitment: 50, // 0 = mini-series, 100 = long-running
  });
  const [clarification, setClarification] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [apiError, setApiError] = useState(false);
  const [shownRecommendations, setShownRecommendations] = useState([]); // Track all shown items

  // Genre mapping
  const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  };

  // Detect Bollywood from language and production
  const isBollywood = (item) => {
    const originalLang = item.original_language;
    const productionCountries = item.production_countries || [];
    return originalLang === 'hi' || 
           productionCountries.some(c => c.iso_3166_1 === 'IN') ||
           (item.origin_country && item.origin_country.includes('IN'));
  };

  // Fetch popular items based on industry and type
  const fetchPopularItems = async () => {
    if (DEMO_MODE) {
      setApiError(true);
      return;
    }

    setLoading(true);
    try {
      let allItems = [];

      // Fetch based on content type
      if (contentType === 'movie' || contentType === 'both') {
        // Hollywood movies
        if (industry === 'hollywood' || industry === 'both') {
          const movieRes = await fetch(
            `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
          );
          const movieData = await movieRes.json();
          allItems.push(...movieData.results.map(m => ({ ...m, type: 'movie', industry: 'hollywood' })));

          // Get more pages for variety
          for (let page = 2; page <= 5; page++) {
            const moreRes = await fetch(
              `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
            );
            const moreData = await moreRes.json();
            allItems.push(...moreData.results.map(m => ({ ...m, type: 'movie', industry: 'hollywood' })));
          }
        }

        // Bollywood movies (Hindi language)
        if (industry === 'bollywood' || industry === 'both') {
          for (let page = 1; page <= 5; page++) {
            const bollyRes = await fetch(
              `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`
            );
            const bollyData = await bollyRes.json();
            allItems.push(...bollyData.results.map(m => ({ ...m, type: 'movie', industry: 'bollywood' })));
          }
        }
      }

      if (contentType === 'series' || contentType === 'both') {
        // Hollywood series
        if (industry === 'hollywood' || industry === 'both') {
          const tvRes = await fetch(
            `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
          );
          const tvData = await tvRes.json();
          allItems.push(...tvData.results.map(t => ({ ...t, type: 'series', industry: 'hollywood' })));

          for (let page = 2; page <= 5; page++) {
            const moreRes = await fetch(
              `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
            );
            const moreData = await moreRes.json();
            allItems.push(...moreData.results.map(t => ({ ...t, type: 'series', industry: 'hollywood' })));
          }
        }

        // Bollywood series
        if (industry === 'bollywood' || industry === 'both') {
          for (let page = 1; page <= 5; page++) {
            const bollyTvRes = await fetch(
              `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`
            );
            const bollyTvData = await bollyTvRes.json();
            allItems.push(...bollyTvData.results.map(t => ({ ...t, type: 'series', industry: 'bollywood' })));
          }
        }
      }

      // Remove duplicates and sort by popularity
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.id + item.type, item])).values());
      const sorted = uniqueItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      
      setPopularItems(sorted.slice(0, 200)); // Keep top 200
      setLoading(false);
    } catch (error) {
      console.error('Error fetching popular items:', error);
      setApiError(true);
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (query) => {
    if (!query.trim() || DEMO_MODE) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      let results = [];

      if (contentType === 'movie' || contentType === 'both') {
        const movieRes = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`
        );
        const movieData = await movieRes.json();
        results.push(...movieData.results.map(m => ({ ...m, type: 'movie' })));
      }

      if (contentType === 'series' || contentType === 'both') {
        const tvRes = await fetch(
          `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`
        );
        const tvData = await tvRes.json();
        results.push(...tvData.results.map(t => ({ ...t, type: 'series' })));
      }

      // Filter by industry if specified
      if (industry !== 'both') {
        results = results.filter(item => {
          const itemIsBollywood = isBollywood(item);
          return industry === 'bollywood' ? itemIsBollywood : !itemIsBollywood;
        });
      }

      setSearchResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error searching:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'selection' && industry && contentType) {
      fetchPopularItems();
    }
  }, [step, industry, contentType]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id && i.type === item.type)) {
      setSelectedItems(selectedItems.filter(i => !(i.id === item.id && i.type === item.type)));
    } else if (selectedItems.length < 10) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const getItemTitle = (item) => {
    return item.title || item.name;
  };

  const getItemYear = (item) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : 'N/A';
  };

  const getItemGenres = (item) => {
    return (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean);
  };

  const buildUserProfile = () => {
    const genreCounts = {};
    const languageCounts = {};
    let totalPopularity = 0;
    let movieCount = 0;
    let seriesCount = 0;

    selectedItems.forEach(item => {
      const genres = getItemGenres(item);
      genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });

      const lang = item.original_language || 'en';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      totalPopularity += item.popularity || 0;

      if (item.type === 'movie') movieCount++;
      else seriesCount++;
    });

    const profile = {
      genres: genreCounts,
      languages: languageCounts,
      avgPopularity: totalPopularity / selectedItems.length,
      movieCount,
      seriesCount,
      selectedIds: selectedItems.map(i => ({ id: i.id, type: i.type })),
      industry,
      contentType
    };

    setUserProfile(profile);
    return profile;
  };

  const needsClarification = (profile) => {
    const genreCount = Object.keys(profile.genres).length;
    
    if (genreCount >= 6) {
      return 'context';
    }
    
    if (profile.movieCount > 0 && profile.seriesCount > 0 && contentType === 'both') {
      return 'type_preference';
    }
    
    return null;
  };

  const generateRecommendations = async (profile, prefs, clarificationAnswer = null) => {
    if (DEMO_MODE) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    try {
      let allCandidates = [];

      // Fetch candidates based on top genres
      const topGenres = Object.entries(profile.genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);

      const genreIds = Object.entries(GENRE_MAP)
        .filter(([id, name]) => topGenres.includes(name))
        .map(([id]) => id);

      // Fetch MORE pages to ensure we have enough unique recommendations
      const pagesToFetch = 10; // Increased from implicit 1 to 10

      // Fetch movies
      if (profile.contentType === 'movie' || profile.contentType === 'both') {
        for (const genreId of genreIds) {
          for (let page = 1; page <= pagesToFetch; page++) {
            const res = await fetch(
              `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}${
                profile.industry === 'bollywood' ? '&with_original_language=hi' : 
                profile.industry === 'hollywood' ? '&with_original_language=en' : ''
              }`
            );
            const data = await res.json();
            allCandidates.push(...data.results.map(m => ({ ...m, type: 'movie' })));
          }
        }

        // Also fetch by popularity for variety
        for (let page = 1; page <= 3; page++) {
          const res = await fetch(
            `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&vote_count.gte=100&page=${page}${
              profile.industry === 'bollywood' ? '&with_original_language=hi' : 
              profile.industry === 'hollywood' ? '&with_original_language=en' : ''
            }`
          );
          const data = await res.json();
          allCandidates.push(...data.results.map(m => ({ ...m, type: 'movie' })));
        }
      }

      // Fetch series
      if (profile.contentType === 'series' || profile.contentType === 'both') {
        for (const genreId of genreIds) {
          for (let page = 1; page <= pagesToFetch; page++) {
            const res = await fetch(
              `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=50&page=${page}${
                profile.industry === 'bollywood' ? '&with_original_language=hi' : 
                profile.industry === 'hollywood' ? '&with_original_language=en' : ''
              }`
            );
            const data = await res.json();
            allCandidates.push(...data.results.map(t => ({ ...t, type: 'series' })));
          }
        }

        // Also fetch by popularity for variety
        for (let page = 1; page <= 3; page++) {
          const res = await fetch(
            `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&vote_count.gte=50&page=${page}${
              profile.industry === 'bollywood' ? '&with_original_language=hi' : 
              profile.industry === 'hollywood' ? '&with_original_language=en' : ''
            }`
          );
          const data = await res.json();
          allCandidates.push(...data.results.map(t => ({ ...t, type: 'series' })));
        }
      }

      // Score and filter
      let scores = allCandidates.map(item => {
        // Exclude items that user selected
        if (profile.selectedIds.some(s => s.id === item.id && s.type === item.type)) {
          return { item, score: -1000 };
        }

        // CRITICAL: Exclude items already shown in any previous recommendation set
        if (shownRecommendations.some(s => s.id === item.id && s.type === item.type)) {
          return { item, score: -1000 };
        }

        let score = 0;

        // Genre matching (highest weight)
        const itemGenres = getItemGenres(item);
        itemGenres.forEach(g => {
          if (profile.genres[g]) score += profile.genres[g] * 15;
          if (prefs.genres.includes(g)) score += 20;
        });

        // Popularity matching
        const popularityDiff = Math.abs(item.popularity - profile.avgPopularity);
        score += Math.max(0, 50 - popularityDiff / 10);

        // Vote average bonus
        score += (item.vote_average || 0) * 5;

        // Era preference
        const year = getItemYear(item);
        const decade = Math.floor(year / 10) * 10;
        const eraStr = `${decade}s`;
        if (prefs.era.includes(eraStr)) score += 10;

        // Series-specific scoring
        if (item.type === 'series') {
          // Episode length (estimate from vote_count as proxy)
          const episodeLengthScore = 50 - Math.abs(prefs.episodeLength - 50);
          score += episodeLengthScore / 10;

          // Number of seasons preference
          // This would need additional API call, simplified here
        }

        // Apply clarification
        if (clarificationAnswer === 'alone' && item.type === 'movie') score += 15;
        if (clarificationAnswer === 'group' && item.type === 'movie') score += 15;
        if (clarificationAnswer === 'prefer_movies' && item.type === 'movie') score += 20;
        if (clarificationAnswer === 'prefer_series' && item.type === 'series') score += 20;

        return { item, score };
      });

      // Remove duplicates
      const uniqueScores = Array.from(
        new Map(scores.map(s => [s.item.id + s.item.type, s])).values()
      );

      // Sort and get top 5
      uniqueScores.sort((a, b) => b.score - a.score);
      const topRecs = uniqueScores.slice(0, 5).map(s => s.item);

      // Add these recommendations to the shown list
      setShownRecommendations(prev => [...prev, ...topRecs]);
      
      setRecommendations(topRecs);
      setLoading(false);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setLoading(false);
    }
  };

  const getRecommendationReason = (item, profile) => {
    const reasons = [];
    const itemGenres = getItemGenres(item);
    
    const genreMatches = selectedItems.filter(si => {
      const siGenres = getItemGenres(si);
      return siGenres.some(g => itemGenres.includes(g));
    });
    
    if (genreMatches.length > 0) {
      const matchedGenre = itemGenres.find(g => 
        getItemGenres(genreMatches[0]).includes(g)
      );
      reasons.push(`shares ${matchedGenre} with ${getItemTitle(genreMatches[0])}`);
    }
    
    if (item.vote_average >= 7.5) {
      reasons.push(`highly rated (${item.vote_average.toFixed(1)}/10)`);
    }
    
    return reasons.slice(0, 2).join(' and ') || 'matches your taste profile';
  };

  const handleFeedback = (itemId, itemType, type) => {
    const key = `${itemId}-${itemType}`;
    setFeedback({ ...feedback, [key]: type });
    
    const item = recommendations.find(r => r.id === itemId && r.type === itemType);
    if (type === 'like' && item) {
      setUserProfile(prev => {
        const updated = { ...prev };
        const genres = getItemGenres(item);
        genres.forEach(g => {
          updated.genres[g] = (updated.genres[g] || 0) + 1;
        });
        return updated;
      });
    }
  };

  const handleRefine = () => {
    generateRecommendations(userProfile, preferences, clarification);
    setFeedback({});
  };

  const startPreferences = () => {
    if (selectedItems.length < 3) {
      alert('Please select at least 3 items');
      return;
    }
    const profile = buildUserProfile();
    const needsClarity = needsClarification(profile);
    
    if (needsClarity) {
      setClarification(needsClarity);
      setStep('clarification');
    } else {
      setStep('preferences');
    }
  };

  const finishPreferences = () => {
    generateRecommendations(userProfile, preferences, clarification);
    setStep('recommendations');
  };

  const handleClarificationAnswer = (answer) => {
    setClarification(answer);
    if (needsClarification(userProfile) === 'context') {
      setStep('preferences');
    } else {
      setStep('preferences');
    }
  };

  const displayItems = searchQuery ? searchResults : popularItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-['Inconsolata',monospace]">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      
      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-[fadeIn_0.6s_ease-out]">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Film className="w-12 h-12 text-purple-400" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              CineMatch
            </h1>
          </div>
          <p className="text-purple-300 text-lg tracking-wide">
            Bollywood • Hollywood • Movies • Series
          </p>
        </div>

        {/* API Error Warning */}
        {apiError && (
          <div className="max-w-2xl mx-auto mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">⚠️ API Setup Required</h3>
            <p className="text-yellow-200 mb-4">
              To use this app, you need a free TMDB API key. Get one at{' '}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="underline">
                themoviedb.org/settings/api
              </a>
            </p>
            <p className="text-yellow-200 text-sm">
              Then update the TMDB_API_KEY constant in the code.
            </p>
          </div>
        )}

        {/* Welcome Screen */}
        {step === 'welcome' && (
          <div className="max-w-2xl mx-auto text-center animate-[fadeIn_0.8s_ease-out]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12 shadow-2xl">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                Find Your Perfect Watch
              </h2>
              <p className="text-xl text-purple-200 mb-8 leading-relaxed">
                Whether you love Bollywood blockbusters, Hollywood classics, binge-worthy series, or all of the above - we'll find exactly what you'll love next.
              </p>
              <button
                onClick={() => setStep('industry')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-12 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Start Discovering
              </button>
              <p className="text-purple-400 text-sm mt-6">Takes under 3 minutes</p>
            </div>
          </div>
        )}

        {/* Industry Selection */}
        {step === 'industry' && (
          <div className="max-w-4xl mx-auto animate-[fadeIn_0.6s_ease-out]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Which industry do you prefer?</h2>
              <p className="text-purple-300">This helps us show you the right content</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                  setIndustry('bollywood');
                  setStep('contentType');
                }}
                className="bg-white/5 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-5xl mb-4">🎬</div>
                <div className="text-2xl font-bold mb-2">Bollywood</div>
                <p className="text-purple-300">Hindi films & series</p>
              </button>
              
              <button
                onClick={() => {
                  setIndustry('hollywood');
                  setStep('contentType');
                }}
                className="bg-white/5 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-5xl mb-4">🎥</div>
                <div className="text-2xl font-bold mb-2">Hollywood</div>
                <p className="text-purple-300">English films & series</p>
              </button>
              
              <button
                onClick={() => {
                  setIndustry('both');
                  setStep('contentType');
                }}
                className="bg-white/5 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-5xl mb-4">🌍</div>
                <div className="text-2xl font-bold mb-2">Both</div>
                <p className="text-purple-300">Everything!</p>
              </button>
            </div>
          </div>
        )}

        {/* Content Type Selection */}
        {step === 'contentType' && (
          <div className="max-w-4xl mx-auto animate-[fadeIn_0.6s_ease-out]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">What are you looking for?</h2>
              <p className="text-purple-300">Movies, series, or both?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                  setContentType('movie');
                  setStep('selection');
                }}
                className="bg-white/5 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Film className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <div className="text-2xl font-bold mb-2">Movies</div>
                <p className="text-purple-300">Feature films only</p>
              </button>
              
              <button
                onClick={() => {
                  setContentType('series');
                  setStep('selection');
                }}
                className="bg-white/5 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Tv className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <div className="text-2xl font-bold mb-2">Series</div>
                <p className="text-purple-300">TV shows only</p>
              </button>
              
              <button
                onClick={() => {
                  setContentType('both');
                  setStep('selection');
                }}
                className="bg-white/5 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Globe className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <div className="text-2xl font-bold mb-2">Both</div>
                <p className="text-purple-300">Movies & Series</p>
              </button>
            </div>
          </div>
        )}

        {/* Selection Screen */}
        {step === 'selection' && (
          <div className="animate-[fadeIn_0.6s_ease-out]">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Select 3-10 Favorites</h2>
              <p className="text-purple-300">
                Choose {contentType === 'both' ? 'movies & series' : contentType === 'movie' ? 'movies' : 'series'} you love from {industry === 'both' ? 'any industry' : industry}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded-full transition-all duration-300 ${
                        i < selectedItems.length ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-purple-300">{selectedItems.length}/10</span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search for ${contentType === 'both' ? 'movies or series' : contentType === 'movie' ? 'movies' : 'series'}...`}
                  className="w-full bg-white/10 backdrop-blur-sm border border-purple-500/30 rounded-xl px-12 py-4 text-lg focus:outline-none focus:border-purple-500 transition-all"
                  disabled={DEMO_MODE}
                />
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <p className="text-purple-300 mt-4">Loading...</p>
              </div>
            )}

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-purple-300">Your Selection</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedItems.map(item => (
                    <div
                      key={`${item.id}-${item.type}`}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-[fadeIn_0.3s_ease-out]"
                    >
                      <span className="text-sm">
                        {item.type === 'series' ? '📺' : '🎬'}
                      </span>
                      <span className="font-semibold">{getItemTitle(item)}</span>
                      <button
                        onClick={() => toggleItem(item)}
                        className="ml-2 hover:bg-white/20 rounded-full p-1 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Grid */}
            {!loading && displayItems.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-purple-300">
                  {searchQuery ? 'Search Results' : 'Popular Picks'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {displayItems.slice(0, 50).map(item => {
                    const isSelected = selectedItems.find(i => i.id === item.id && i.type === item.type);
                    const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null;
                    
                    return (
                      <button
                        key={`${item.id}-${item.type}`}
                        onClick={() => toggleItem(item)}
                        disabled={!isSelected && selectedItems.length >= 10}
                        className={`relative rounded-xl text-left transition-all duration-300 transform hover:scale-105 overflow-hidden ${
                          isSelected
                            ? 'ring-4 ring-purple-500 shadow-lg shadow-purple-500/50'
                            : 'hover:ring-2 hover:ring-purple-500/50'
                        } ${!isSelected && selectedItems.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {posterPath ? (
                          <img 
                            src={posterPath} 
                            alt={getItemTitle(item)}
                            className="w-full aspect-[2/3] object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-white/10 flex items-center justify-center">
                            <Film className="w-12 h-12 text-purple-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                          <div className="font-bold text-sm line-clamp-2">{getItemTitle(item)}</div>
                          <div className="text-xs text-purple-300 flex items-center gap-2 mt-1">
                            <span>{getItemYear(item)}</span>
                            <span>•</span>
                            <span>{item.type === 'series' ? '📺' : '🎬'}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Continue Button */}
            {selectedItems.length >= 3 && (
              <div className="text-center animate-[fadeIn_0.5s_ease-out]">
                <button
                  onClick={startPreferences}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-12 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Continue to Preferences
                </button>
              </div>
            )}
          </div>
        )}

        {/* Clarification Step */}
        {step === 'clarification' && (
          <div className="max-w-3xl mx-auto animate-[fadeIn_0.6s_ease-out]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6">Quick Clarification</h2>
              
              {clarification === 'context' && (
                <div>
                  <p className="text-xl text-purple-200 mb-8">
                    You have diverse taste! Are you usually watching:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleClarificationAnswer('alone')}
                      className="bg-white/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-6 rounded-xl transition-all duration-300 text-left"
                    >
                      <div className="text-2xl mb-2">🧘</div>
                      <div className="font-bold mb-2">Alone or with close friends</div>
                      <div className="text-sm text-purple-300">Looking for depth and personal connection</div>
                    </button>
                    <button
                      onClick={() => handleClarificationAnswer('group')}
                      className="bg-white/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-6 rounded-xl transition-all duration-300 text-left"
                    >
                      <div className="text-2xl mb-2">👥</div>
                      <div className="font-bold mb-2">With groups or family</div>
                      <div className="text-sm text-purple-300">Looking for shared entertainment</div>
                    </button>
                  </div>
                </div>
              )}

              {clarification === 'type_preference' && (
                <div>
                  <p className="text-xl text-purple-200 mb-8">
                    You picked both movies and series. Which do you prefer right now?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleClarificationAnswer('prefer_movies')}
                      className="bg-white/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-6 rounded-xl transition-all duration-300 text-left"
                    >
                      <div className="text-2xl mb-2">🎬</div>
                      <div className="font-bold mb-2">Movies</div>
                      <div className="text-sm text-purple-300">2-3 hour complete stories</div>
                    </button>
                    <button
                      onClick={() => handleClarificationAnswer('prefer_series')}
                      className="bg-white/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 p-6 rounded-xl transition-all duration-300 text-left"
                    >
                      <div className="text-2xl mb-2">📺</div>
                      <div className="font-bold mb-2">Series</div>
                      <div className="text-sm text-purple-300">Extended storytelling</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences */}
        {step === 'preferences' && (
          <div className="max-w-4xl mx-auto animate-[fadeIn_0.6s_ease-out]">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Fine-Tune Your Preferences</h2>
              <p className="text-purple-300">We've analyzed your selections. Adjust these to perfect your recommendations.</p>
            </div>

            <div className="space-y-6">
              {/* Genres */}
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Favorite Genres</h3>
                <div className="flex flex-wrap gap-3">
                  {['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Animation', 'Crime', 'Fantasy', 'Mystery'].map(genre => (
                    <button
                      key={genre}
                      onClick={() => {
                        if (preferences.genres.includes(genre)) {
                          setPreferences({ ...preferences, genres: preferences.genres.filter(g => g !== genre) });
                        } else {
                          setPreferences({ ...preferences, genres: [...preferences.genres, genre] });
                        }
                      }}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        preferences.genres.includes(genre)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Slider */}
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Mood Preference</h3>
                <div className="flex items-center gap-4">
                  <span className="text-purple-300">Dark</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.mood}
                    onChange={(e) => setPreferences({ ...preferences, mood: parseInt(e.target.value) })}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-purple-300">Light</span>
                </div>
              </div>

              {/* Era */}
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Era Preferences</h3>
                <div className="flex flex-wrap gap-3">
                  {['1980s', '1990s', '2000s', '2010s', '2020s'].map(era => (
                    <button
                      key={era}
                      onClick={() => {
                        if (preferences.era.includes(era)) {
                          setPreferences({ ...preferences, era: preferences.era.filter(e => e !== era) });
                        } else {
                          setPreferences({ ...preferences, era: [...preferences.era, era] });
                        }
                      }}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        preferences.era.includes(era)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {era}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series-Specific Preferences */}
              {(contentType === 'series' || contentType === 'both') && (
                <>
                  <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Episode Length Preference</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-purple-300">Short (20-30min)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={preferences.episodeLength}
                        onChange={(e) => setPreferences({ ...preferences, episodeLength: parseInt(e.target.value) })}
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-purple-300">Long (60min+)</span>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Watching Style</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-purple-300">Casual (1-2 ep/week)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={preferences.bingePreference}
                        onChange={(e) => setPreferences({ ...preferences, bingePreference: parseInt(e.target.value) })}
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-purple-300">Binge-watch</span>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Season Commitment</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-purple-300">Mini-series (1-2 seasons)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={preferences.seasonCommitment}
                        onChange={(e) => setPreferences({ ...preferences, seasonCommitment: parseInt(e.target.value) })}
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-purple-300">Long-running (5+ seasons)</span>
                    </div>
                  </div>
                </>
              )}

              {/* Popularity */}
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Discovery Style</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'popular', label: 'Popular', icon: '🎬' },
                    { value: 'mixed', label: 'Mixed', icon: '🎲' },
                    { value: 'hidden', label: 'Hidden Gems', icon: '💎' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences({ ...preferences, popularity: option.value })}
                      className={`p-6 rounded-xl transition-all duration-300 ${
                        preferences.popularity === option.value
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="font-semibold">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center mt-8">
              <button
                onClick={finishPreferences}
                disabled={DEMO_MODE}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-12 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get My Recommendations
              </button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {step === 'recommendations' && (
          <div className="animate-[fadeIn_0.6s_ease-out]">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Your Perfect Matches
              </h2>
              <p className="text-purple-300 text-lg">Personalized recommendations based on your unique taste</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <p className="text-purple-300 mt-4">Generating recommendations...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl">
                <p className="text-purple-300 text-xl">No recommendations available. Please try adjusting your preferences.</p>
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {recommendations.map((item, idx) => {
                  const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null;
                  const itemGenres = getItemGenres(item);
                  const feedbackKey = `${item.id}-${item.type}`;
                  
                  return (
                    <div
                      key={feedbackKey}
                      className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/30 transition-all duration-300 animate-[fadeIn_0.5s_ease-out]"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-start gap-6">
                        {posterPath ? (
                          <img 
                            src={posterPath} 
                            alt={getItemTitle(item)}
                            className="w-32 rounded-lg shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-48 bg-white/10 rounded-lg flex items-center justify-center">
                            <Film className="w-12 h-12 text-purple-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{getItemTitle(item)}</h3>
                              <p className="text-purple-300 flex items-center gap-2">
                                <span>{getItemYear(item)}</span>
                                <span>•</span>
                                <span>{item.type === 'series' ? '📺 Series' : '🎬 Movie'}</span>
                                {item.vote_average && (
                                  <>
                                    <span>•</span>
                                    <span>⭐ {item.vote_average.toFixed(1)}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {feedback[feedbackKey] !== 'like' && (
                                <button
                                  onClick={() => handleFeedback(item.id, item.type, 'like')}
                                  className={`p-3 rounded-lg transition-all duration-300 ${
                                    feedback[feedbackKey] === 'dislike'
                                      ? 'bg-white/5'
                                      : 'bg-green-600 hover:bg-green-500'
                                  }`}
                                >
                                  <ThumbsUp className="w-5 h-5" />
                                </button>
                              )}
                              {feedback[feedbackKey] !== 'dislike' && (
                                <button
                                  onClick={() => handleFeedback(item.id, item.type, 'dislike')}
                                  className={`p-3 rounded-lg transition-all duration-300 ${
                                    feedback[feedbackKey] === 'like'
                                      ? 'bg-white/5'
                                      : 'bg-red-600 hover:bg-red-500'
                                  }`}
                                >
                                  <ThumbsDown className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-purple-900/30 rounded-lg p-4 mb-4">
                            <p className="text-purple-200">
                              <span className="font-semibold text-purple-400">Recommended because:</span> {getRecommendationReason(item, userProfile)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {itemGenres.slice(0, 3).map(genre => (
                              <span key={genre} className="px-3 py-1 bg-purple-600/30 rounded-full text-sm">{genre}</span>
                            ))}
                          </div>
                          {item.overview && (
                            <p className="text-purple-200 text-sm mt-4 line-clamp-3">{item.overview}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-purple-300 text-sm">
                {shownRecommendations.length > 5 && (
                  <span>You've seen {shownRecommendations.length} recommendations so far</span>
                )}
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleRefine}
                  disabled={DEMO_MODE}
                  className="flex items-center gap-2 bg-white/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 px-8 py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refine Results
                </button>
                {shownRecommendations.length > 10 && (
                  <button
                    onClick={() => {
                      setShownRecommendations([]);
                      handleRefine();
                    }}
                    disabled={DEMO_MODE}
                    className="flex items-center gap-2 bg-white/10 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-500 px-8 py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" />
                    Reset Pool
                  </button>
                )}
                <button
                  onClick={() => {
                    setStep('welcome');
                    setIndustry(null);
                    setContentType(null);
                    setSelectedItems([]);
                    setRecommendations([]);
                    setFeedback({});
                    setClarification(null);
                    setUserProfile(null);
                    setShownRecommendations([]); // Reset shown recommendations
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input[type="range"] {
          background: linear-gradient(to right, #9333ea 0%, #ec4899 100%);
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.3);
          transition: all 0.2s;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 6px rgba(147, 51, 234, 0.4);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.3);
          transition: all 0.2s;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 6px rgba(147, 51, 234, 0.4);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}