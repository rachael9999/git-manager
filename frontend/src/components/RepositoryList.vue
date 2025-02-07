<template>
  <div>
    <h1>Repository List</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <RepoBlock v-for="repo in repositories" :key="repo.id" :repo="repo" />
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
        const response = await axios.get(`/api/repositories/full?page=${this.page}`);
        this.repositories = response.data;
        // for each repo in the response, request detail
        for (let repo of this.repositories) {
          // http://localhost:3000/repositories/detail/1
          const detail = await axios.get(`/api/repositories/detail/${repo.id}`);
          Object.assign(repo, detail.data);
        }
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