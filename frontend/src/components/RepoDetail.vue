<template>
    <div v-if="repo">
      <h1>{{ repo.name }}</h1>
      <p>{{ repo.description }}</p>
      <p><strong>Owner:</strong> {{ repo.owner.login }}</p>
      <p><strong>Stars:</strong> {{ repo.stargazers_count }}</p>
      <p><strong>Forks:</strong> {{ repo.forks_count }}</p>
      <p><strong>Language:</strong> {{ repo.language }}</p>
      <p><strong>Open Issues:</strong> {{ repo.open_issues_count }}</p>
      <a :href="repo.html_url" target="_blank">View on GitHub</a>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    props: ['id'],
    data() {
      return {
        repo: null,
        loading: true
      };
    },
    async created() {
      try {
        const response = await axios.get(`/api/repositories/details/${this.id}`);
        this.repo = response.data;
      } catch (error) {
        console.error('Failed to fetch repository details:', error);
      } finally {
        this.loading = false;
      }
    }
  };
  </script>
  
  <style scoped>
  .repo-detail {
    border: 1px solid #ccc;
    padding: 16px;
    margin-bottom: 16px;
  }
  </style>