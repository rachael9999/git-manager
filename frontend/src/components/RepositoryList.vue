<template>
  <v-container>
    <!-- Styled header with divider -->
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
          v-for="n in totalPages" 
          :key="n" 
          @click="goToPage(n)" 
          :class="{ active: n === page }"
        >
          {{ n }}
        </button>
        <button @click="nextPage" :disabled="page === totalPages">Next</button>
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
      totalPages: 10 
    };
  },
  watch: {
    page: 'fetchRepositories'
  },
  methods: {
    async fetchRepositories() {
      this.loading = true;
      try {
        // Get initial list with basic details
        const response = await axios.get(`/api/repositories/full?page=${this.page}`);
        this.repositories = response.data;
        this.loading = false;

        // Fetch details in parallel
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

        // Wait for all details to load in the background
        await Promise.all(detailPromises);

      } catch (error) {
        console.error('Failed to fetch repositories:', error);
      }
    },
    nextPage() {
      if (this.page < this.totalPages) {
        this.$router.push({ name: 'RepositoryList', params: { page: parseInt(this.page) + 1 } });
      }
    },
    prevPage() {
      if (this.page > 1) {
        this.$router.push({ name: 'RepositoryList', params: { page: parseInt(this.page) - 1 } });
      }
    },
    goToPage(page) {
      this.$router.push({ name: 'RepositoryList', params: { page } });
    }
  },
  mounted() {
    this.fetchRepositories();
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