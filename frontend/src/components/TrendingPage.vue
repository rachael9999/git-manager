<template>
  <div class="trending-page">
    <h1>Trending Repositories</h1>
    
    <div class="filters">
      <v-select
        v-model="selectedPeriod"
        :items="[
          { title: 'Today', value: 'day' },
          { title: 'This Week', value: 'week' },
          { title: 'This Month', value: 'month' }
        ]"
        item-title="title"
        item-value="value"
        label="Time Period"
        variant="outlined"
        density="comfortable"
        class="filter-select"
      ></v-select>

      <v-select
        v-model="selectedLanguage"
        :items="[{ title: 'All Languages', value: '' }, ...commonLanguages.map(lang => ({ title: lang, value: lang }))]"
        item-title="title"
        item-value="value"
        label="Language"
        variant="outlined"
        density="comfortable"
        class="filter-select"
      ></v-select>
    </div>

    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="repo-list">
        <RepoBlock 
          v-for="repo in trendingRepos" 
          :key="repo.id" 
          :repo="{
            ...repo,
            stargazers_count: repo.stars,
            forks_count: repo.forks
          }"
        />
      </div>

      <div class="pagination-container">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          rounded="circle"
          @update:model-value="changePage"
        ></v-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import RepoBlock from './RepoBlock.vue'

export default {
  name: 'TrendingPage',
  components: {
    RepoBlock
  },
  data() {
    return {
      trendingRepos: [],
      selectedPeriod: 'week',
      selectedLanguage: '',
      currentPage: 1,
      totalPages: 0,
      loading: false,
      error: null,
      commonLanguages: [
        'JavaScript',
        'Python',
        'Java',
        'TypeScript',
        'C++',
        'PHP',
        'Ruby',
        'Go',
        'Rust',
        'C#'
      ]
    }
  },
  watch: {
    selectedPeriod() {
      this.currentPage = 1
      this.fetchTrendingRepos()
    },
    selectedLanguage() {
      this.currentPage = 1
      this.fetchTrendingRepos()
    }
  },
  created() {
    // Get query params if they exist
    const { page, period, language } = this.$route.query
    if (page) this.currentPage = parseInt(page)
    if (period) this.selectedPeriod = period
    if (language) this.selectedLanguage = language
    
    this.fetchTrendingRepos()
  },
  methods: {
    async fetchTrendingRepos() {
      this.loading = true
      this.error = null

      try {
        let url = `http://localhost:3000/repositories/trending?period=${this.selectedPeriod}&page=${this.currentPage}`
        if (this.selectedLanguage) {
          url += `&language=${this.selectedLanguage}`
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const responseData = await response.json()
        
        // Handle both possible response formats
        const data = responseData.data || responseData
        if (data.redirect) {
          this.currentPage = 1
          await this.fetchTrendingRepos()
          return
        }

        // Validate the data is an array
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format')
        }

        this.trendingRepos = data
        this.totalPages = Math.min(responseData.total_pages || 10, 10) // Limit to 10 pages
      } catch (error) {
        this.error = 'Failed to fetch trending repositories'
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    changePage(newPage) {
      if (newPage < 1 || newPage > Math.min(this.totalPages, 10)) return
      
      // Update URL with new query params
      this.$router.push({
        query: {
          ...this.$route.query,
          page: newPage
        }
      })
      this.fetchTrendingRepos()
    }
  }
}
</script>

<style scoped>
.trending-page {
  padding: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.filter-select {
  width: 200px;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #cb2431;
  text-align: center;
  padding: 1rem;
}

.repo-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  margin-bottom: 2rem;
}
</style>