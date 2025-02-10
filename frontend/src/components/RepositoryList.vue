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
        :total-visible="10"
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
    RepoBlock,
  },
  props: ['page'],
  data() {
    return {
      repositories: [],
      loading: true,
      loadingDetails: [],
      currentPage: 1,
      maxPage: 10,
      pageBlockSize: 10,
abortController: null
    }
  },
  beforeUnmount() {
    // Cancel any pending requests when component unmounts
    if (this.abortController) {
      this.abortController.abort();
    }
  },
  computed: {
    shouldExtendPagination() {
      return this.currentPage >= this.maxPage - 3;
    },

    shouldFetchNextSet() {
      // Check if we're at a page that would need the next set
      const currentSet = Math.floor((this.currentPage - 1) / 10);
      const maxSet = Math.floor((this.maxPage - 1) / 10);
      return currentSet >= maxSet - 1;
    },
  },

  methods: {
    extendPagination() {
              const newMax = this.currentPage + 4;
        if (this.shouldExtendPagination && newMax > this.maxPage) {
          this.maxPage = newMax;
          
          if (this.shouldFetchNextSet) {
            const nextSetStart = Math.ceil((this.currentPage) / 10) * 10 + 1;
                          this.fetchRepositories(nextSetStart);
            }
          }
            },

    async handlePageChange(page) {
              this.currentPage = page;
        this.extendPagination();
        this.$router.push({ 
          name: 'FullRepositories', 
          query: { page: page.toString() } 
        });
        await this.fetchRepositories(page);
          },

    async fetchRepositories(page = this.currentPage) {
      this.loading = true;
      this.repositories = [];
      const minLoadingTime = 300;
      const startTime = Date.now();

      try {
        const response = await axios.get(`/api/repositories/full?page=${page}`);
        
        // Handle the response which can be either an array directly or nested under data
        let repos;
        if (Array.isArray(response.data)) {
          repos = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          repos = response.data.data;
        } else if (response.data?.redirect) {
          this.$router.replace({ 
            name: 'FullRepositories', 
            query: { page: response.data.page || '1' }
          });
          return;
        } else {
          console.error('Unexpected response format:', response.data);
          this.repositories = [];
          return;
        }

        if (repos.length > 0) {
          this.extendPagination();
        }
        
        const initialElapsedTime = Date.now() - startTime;
        if (initialElapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - initialElapsedTime));
        }

        // Make sure each repo is a valid object before setting
        this.repositories = repos.filter(repo => repo && typeof repo === 'object');

        // Fetch additional details for each repository
        const detailPromises = this.repositories.map(async (repo) => {
          this.loadingDetails.push(repo.id);
          try {
            const detail = await axios.get(`/api/repositories/detail/${repo.id}`);
            const detailData = detail.data?.data || detail.data;
            
            // Only update if we got a valid object back
            if (detailData && typeof detailData === 'object') {
              const index = this.repositories.findIndex(r => r.id === repo.id);
              if (index !== -1) {
                const updatedRepo = { ...this.repositories[index], ...detailData };
                // Verify the update keeps it as a valid object
                if (typeof updatedRepo === 'object' && updatedRepo.id) {
                  this.repositories[index] = updatedRepo;
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching details for repo ${repo.id}:`, error);
          } finally {
            this.loadingDetails = this.loadingDetails.filter(id => id !== repo.id);
          }
        });

        await Promise.all(detailPromises);
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
        if (error.response?.status === 303 || error.response?.data?.redirect) {
          this.$router.replace({ 
            name: 'FullRepositories', 
            query: { page: error.response?.data?.page || '1' }
          });
        }
      } finally {
        this.loading = false;
      }
    },
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