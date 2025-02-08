<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-medium pl-4">Repository List</h1>
    </div>
    <v-divider class="mb-6"></v-divider>

    <div v-if="loading && !repositories.length" class="loading-container">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
        :width="6"
      ></v-progress-circular>
      <div class="text-h6 mt-4 text-medium-emphasis"></div>
    </div>
    <div v-else>
      <RepoBlock 
        v-for="repo in repositories" 
        :key="repo.id" 
        :repo="repo"
        :loading="loadingDetails.includes(repo.id)" 
      />
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">Previous</button>
        <button 
          v-for="n in displayedPages" 
          :key="n" 
          @click="goToPage(n)" 
          :class="{ active: n === page }"
        >
          {{ n }}
        </button>
        <button @click="nextPage" :disabled="!hasMorePages">Next</button>
      </div>
    </div>
  </v-container>
</template>

<script>
import axios from 'axios';
import RepoBlock from './RepoBlock.vue';

export default {
  components: {
    RepoBlock
  },
  props: ['page'],
  data() {
    return {
      repositories: [],
      loading: true,
      loadingDetails: [],
      currentPageSet: 1, 
      hasMorePages: true, 
      pageSize: 10, 
      pagesPerSet: 10 
    };
  },

  computed: {
    displayedPages() {
      const current = parseInt(this.page);
      const beforeDelta = 4; 
      const afterDelta = 5;
      // const totalPages = Math.max(this.currentPageSet * this.pagesPerSet, current);
      
      let start = Math.max(1, current - beforeDelta);
      // let end = Math.min(totalPages, current + afterDelta);
      let end = current + afterDelta;
      
      // Adjust start and end to always show 10 pages if possible
      const range = end - start + 1;
      if (range < 10) {
        if (start === 1) {
          // end = Math.min(totalPages, start + 9);
          end = start + 9;
        } else if (end === totalPages) {
          start = Math.max(1, end - 9);
        }
      }
      
      return Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
    }
  },

  methods: {
    async fetchRepositories() {
    this.loading = true;
    this.repositories = [];
    const minLoadingTime = 300; // 1 second minimum loading time
    const startTime = Date.now();

    try {
      const response = await axios.get(`/api/repositories/full?page=${this.page}`);
      
      const initialElapsedTime = Date.now() - startTime;
      if (initialElapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - initialElapsedTime));
      }

      this.hasMorePages = response.data && response.data.length === this.pageSize;
      this.repositories = response.data || [];
      this.currentPageSet = Math.ceil(this.page / this.pagesPerSet);

      const detailPromises = this.repositories.map(async (repo) => {
        this.loadingDetails.push(repo.id);
        try {
          const detail = await axios.get(`/api/repositories/detail/${repo.id}`);
          const index = this.repositories.findIndex(r => r.id === repo.id);
          if (index !== -1) {
            this.repositories[index] = { ...this.repositories[index], ...detail.data };
          }
        } finally {
          this.loadingDetails = this.loadingDetails.filter(id => id !== repo.id);
        }
      });

      await Promise.all(detailPromises);
      this.loading = false;

    } catch (error) {
      if (error.response && error.response.status === 303 && error.response.data.redirect) {
        this.$router.replace({ path: '/repositories/full', query: { page: error.response.data.page } });
      } else {
        console.error('Failed to fetch repositories:', error);
      }
      this.loading = false;
    }
  },

    nextPage() {
      if (this.hasMorePages) {
        this.$router.push({ 
          name: 'FullRepositories', 
          query: { page: parseInt(this.page) + 1 } 
        });
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.$router.push({ 
          name: 'FullRepositories', 
          query: { page: parseInt(this.page) - 1 } 
        });
      }
    },

    goToPage(page) {
      this.$router.push({ 
        name: 'FullRepositories', 
        query: { page } 
      });
    }
  },

  watch: {
    page: {
      immediate: true,
      handler: 'fetchRepositories'
    }
  }
};
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.pagination button {
  padding: 8px 16px;
  cursor: pointer;
}
.pagination button.active {
  font-weight: bold;
  background-color: #007bff;
  color: white;
}
</style>