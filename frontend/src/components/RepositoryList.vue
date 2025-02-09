<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-medium pl-4">Repository List</h1>
    </div>
    <v-divider class="mb-6"></v-divider>

    <div v-if="loading && !repositories.length" class="d-flex justify-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
        :width="6"
      ></v-progress-circular>
    </div>
    <div v-else>
      <RepoBlock 
        v-for="repo in repositories" 
        :key="repo.id" 
        :repo="repo"
        :loading="loadingDetails.includes(repo.id)" 
      />
      
      <v-pagination
        v-if="maxPage > 1"
        v-model="currentPage"
        :length="maxPage"
        @update:modelValue="handlePageChange"
        class="mt-4"
      ></v-pagination>
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
      currentPage: 1,
      maxPage: 10 // Default max page value
    }
  },
  computed: {
    displayedPages() {
      const current = this.currentPage;
      const beforeDelta = 4;
      const afterDelta = 5;
      let start = Math.max(1, current - beforeDelta);
      let end = current + afterDelta;

      // Adjust start and end to always show 10 pages if possible
      const range = end - start + 1;
      if (range < 10) {
        if (start === 1) {
          end = start + 9;
        } else if (end === this.maxPage) {
          start = Math.max(1, end - 9);
        }
      }

      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  },

  methods: {
    async fetchRepositories() {
      this.loading = true;
      this.repositories = [];
      const minLoadingTime = 300;
      const startTime = Date.now();

      try {
        const response = await axios.get(`/api/repositories/full?page=${this.currentPage}`);
        
        const initialElapsedTime = Date.now() - startTime;
        if (initialElapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - initialElapsedTime));
        }

        this.repositories = response.data || [];

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
      } catch (error) {
        if (error.response?.status === 303 && error.response.data.redirect) {
          this.$router.replace({ 
            name: 'FullRepositories', 
            query: { page: error.response.data.page } 
          });
        } else {
          console.error('Failed to fetch repositories:', error);
        }
      } finally {
        this.loading = false;
      }
    },

    async handlePageChange(page) {
      this.currentPage = page;
      this.$router.push({ 
        name: 'FullRepositories', 
        query: { page: page } 
      });
      await this.fetchRepositories();
    }
  },

  watch: {
    page: {
      immediate: true,
      handler(newPage) {
        this.currentPage = parseInt(newPage) || 1;
        this.fetchRepositories();
      }
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