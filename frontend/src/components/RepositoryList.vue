<template>
  <div>
    <h1>Repository List</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="repo in repositories" :key="repo.id" class="repo-block">
        <h2>{{ repo.name }}</h2>
        <p>{{ repo.description }}</p>
        <a :href="repo.html_url" target="_blank">View on GitHub</a>
      </div>
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">Previous</button>
        <button v-for="n in totalPages" :key="n" @click="goToPage(n)" :class="{ active: n === page }">{{ n }}</button>
        <button @click="nextPage" :disabled="page === totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['page'],
  data() {
    return {
      repositories: [],
      loading: true,
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
        const response = await axios.get(`/repositories/full?page=${this.page}`);
        this.repositories = response.data;
        console.log('Fetched repositories:', this.repositories);
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
      } finally {
        this.loading = false;
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
.repo-block {
  border: 1px solid #ccc;
  padding: 16px;
  margin-bottom: 16px;
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