<template>
  <v-container class="trending-preview">
    <div class="trending-header">
      <div class="header-content">
        <h2><v-icon color="warning" size="large" class="pulse-icon">mdi-trending-up</v-icon> Trending This Week</h2>
        <router-link :to="{ name: 'TrendingPage' }" class="view-all-link">
          View All <v-icon size="small">mdi-chevron-right</v-icon>
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-alert
      v-if="error"
      type="error"
      class="my-4"
    >{{ error }}</v-alert>

    <v-row v-else class="trending-grid">
      <v-col
        v-for="repo in trendingRepos.slice(0, 6)"
        :key="repo.id"
        cols="12"
        sm="12"
        md="6"
        lg="4"
        class="d-flex"
      >
        <v-card class="repo-preview-card flex-grow-1" variant="outlined" :href="repo.html_url" target="_blank" @contextmenu.prevent>
          <v-card-title class="text-subtitle-1 text-truncate">{{ repo.name }}</v-card-title>
          <v-card-subtitle>
            <router-link 
              :to="{ name: 'UserPage', params: { username: repo.owner?.login }}" 
              class="user-link d-flex align-center text-decoration-none"
              @click.stop
            >
              <v-avatar size="20" class="mr-2">
                <v-img :src="repo.owner?.avatar_url" :alt="repo.owner?.login"></v-img>
              </v-avatar>
              <span>{{ repo.owner?.login }}</span>
            </router-link>
          </v-card-subtitle>
          <v-card-text>
            <p class="description">{{ repo.description || 'No description available' }}</p>
            <div class="stats mt-2">
              <v-chip size="small" class="mr-2">
                <template v-slot:prepend>
                  <v-icon size="small" color="warning">mdi-star</v-icon>
                </template>
                {{ repo.stars }}
              </v-chip>
              <v-chip size="small" class="mr-2">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-source-fork</v-icon>
                </template>
                {{ repo.forks }}
              </v-chip>
              <v-chip v-if="repo.language" size="small">
                <template v-slot:prepend>
                  <span 
                    class="language-dot"
                    :style="{ backgroundColor: getLanguageColor(repo.language) }"
                  ></span>
                </template>
                {{ repo.language }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TrendingPreview',
  data() {
    return {
      trendingRepos: [],
      loading: false,
      error: null
    }
  },
  created() {
    this.fetchTrendingRepos()
  },
  methods: {
    async fetchTrendingRepos() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/repositories/trending?period=week&page=1')
        const data = response.data
        this.trendingRepos = Array.isArray(data) ? data.slice(0, 6) : 
                            Array.isArray(data.data) ? data.data.slice(0, 6) : []
      } catch (error) {
        this.error = 'Failed to fetch trending repositories'
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    getLanguageColor(language) {
      const colors = {
        JavaScript: '#f1e05a',
        Python: '#3572A5',
        Java: '#b07219',
        TypeScript: '#2b7489',
        'C++': '#f34b7d',
        PHP: '#4F5D95',
        Ruby: '#701516',
        Go: '#00ADD8',
        Rust: '#dea584',
        'C#': '#178600',
        Vue: '#41b883',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Shell: '#89e051',
        Dart: '#00B4AB',
        Swift: '#ffac45',
        Kotlin: '#F18E33',
        C: '#555555'
      };
      return colors[language] || '#6e7681';
    }
  }
}
</script>

<style scoped>
.trending-preview {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.trending-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-weight: 600;
  background: linear-gradient(45deg, #2196F3, #1976d2);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.trending-description {
  color: rgba(0, 0, 0, 0.6);
  font-size: 1.1rem;
  margin-top: 0.5rem;
  font-weight: 300;
}

.description {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
  margin: 8px 0;
  min-height: 3em;
  max-height: 3em;
  word-break: break-word;
  position: relative;
  padding-right: 4px;
}

.description::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 1.5em;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%);
  pointer-events: none;
}

.view-all-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  color: #1976d2;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  background: rgba(25, 118, 210, 0.1);
  transition: all 0.3s ease;
}

.view-all-link:hover {
  background: rgba(25, 118, 210, 0.15);
  transform: translateX(5px);
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.pulse-icon {
  animation: pulse 2.5s ease-in-out infinite;
}

.repo-preview-card {
  border-radius: 1rem;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

.repo-preview-card::selection {
  background: transparent;
}

.repo-preview-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.v-card-title {
  font-size: 1.1rem !important;
  line-height: 1.4 !important;
  min-height: 40px;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  padding: 16px 16px 8px 16px !important;
  margin: 0 !important;
}

.v-card-subtitle {
  padding-top: 8px !important;
  min-height: 44px;
}

.v-card-text {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 16px 16px !important;
  overflow: hidden;
}

.stats {
  margin-top: auto;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.v-chip {
  transition: transform 0.2s ease;
}

.v-chip:hover {
  transform: scale(1.05);
}

.user-link {
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.user-link:hover {
  opacity: 1;
}

.language-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>