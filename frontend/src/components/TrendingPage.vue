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
      this.updateURLParams({ period: this.selectedPeriod })
    },
    selectedLanguage() {
      this.updateURLParams({ language: this.selectedLanguage })
    },
    '$route.query': {
      handler(newQuery) {
        this.currentPage = parseInt(newQuery.page) || 1
        this.selectedPeriod = newQuery.period || 'week'
        this.selectedLanguage = newQuery.language || ''
        this.fetchTrendingRepos()
      },
      immediate: true
    }
  },
  methods: {
    updateURLParams(params) {
      this.$router.push({
        query: {
          ...this.$route.query,
          ...params,
          page: this.currentPage
        }
      })
    },
    async fetchTrendingRepos() {
      this.loading = true
      this.error = null

      try {
        const { period = this.selectedPeriod, language = this.selectedLanguage, page = this.currentPage } = this.$route.query
        
        let url = `/api/repositories/trending?period=${period}&page=${page}`
        if (language) {
          url += `&language=${language}`
        }

        const response = await fetch(url)
        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 401 || response.status === 403) {
            this.error = 'GitHub API authentication failed. Please check your token.'
          } else if (response.status === 422) {
            this.error = 'Invalid query parameters'
          } else {
            this.error = errorData.error || 'Failed to fetch trending repositories'
          }
          console.error('API Error:', errorData)
          return
        }

        const responseData = await response.json()

        if (responseData.status === 303 || responseData.redirect) {
          console.log('Redirecting to:', responseData.page)
          this.currentPage = responseData.page || 1
          await this.$router.push({
            query: {
              ...this.$route.query,
              page: this.currentPage
            }
          })
          await this.fetchTrendingRepos()
          return
        }

        this.trendingRepos = responseData.data || responseData
        this.totalPages = Math.min(responseData.total_pages || 10, 10)
      } catch (error) {
        this.error = 'Failed to fetch trending repositories'
        console.error('Trending repositories fetch error:', error)
      } finally {
        this.loading = false
      }
    },
    changePage(newPage) {
      // if (newPage < 1 || newPage > Math.min(this.totalPages, 10)) return
      
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