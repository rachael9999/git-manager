<template>
  <v-container>
    <div v-if="isLoading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
        :width="6"
      ></v-progress-circular>
    </div>

    <div v-else-if="!userDetails" class="d-flex flex-column align-center justify-center" style="min-height: 400px;">
      <v-icon size="64" color="grey" class="mb-4">mdi-account-off</v-icon>
      <h2 class="text-h4 mb-2">User Not Found</h2>
      <p class="text-subtitle-1 text-grey mb-6">The GitHub user "{{ username }}" could not be found.</p>
      <v-btn
        color="primary"
        @click="$router.push('/')"
        prepend-icon="mdi-home"
      >
        Return to Home
      </v-btn>
    </div>

    <v-row v-else>
      <!-- User Details Column -->
      <v-col cols="12" md="3">
        <div class="user-details">
          <v-avatar size="250" class="mb-4">
            <v-img :src="userDetails.avatar_url" :alt="userDetails.name"/>
          </v-avatar>
          
          <h2 class="text-h4 mb-1">{{ userDetails.name }}</h2>
          <p class="text-subtitle-1 text-grey">{{ userDetails.login }}</p>
          
          <div class="mt-4">
            <v-row v-if="userDetails.followers || userDetails.following" class="mb-4">
              <v-col>
                <span class="font-weight-bold">{{ userDetails.followers }}</span> followers ·
                <span class="font-weight-bold">{{ userDetails.following }}</span> following
              </v-col>
            </v-row>
            
            <template v-if="userDetails.company">
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-office-building</v-icon>
                {{ userDetails.company }}
              </div>
            </template>
            
            <template v-if="userDetails.location">
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-map-marker</v-icon>
                {{ userDetails.location }}
              </div>
            </template>
            
            <template v-if="userDetails.email">
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-email</v-icon>
                <a :href="'mailto:' + userDetails.email">{{ userDetails.email }}</a>
              </div>
            </template>
            
            <template v-if="userDetails.blog">
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-link</v-icon>
                <a :href="userDetails.blog" target="_blank">{{ userDetails.blog }}</a>
              </div>
            </template>
          </div>
        </div>
      </v-col>

      <!-- Repositories Column -->
      <v-col cols="12" md="9">
        <h2 class="text-h5 mb-4">Repositories</h2>
        <div v-if="repositories.length === 0" class="text-center pa-4">
          <p class="text-subtitle-1 text-grey">No repositories found</p>
        </div>
        <template v-else>
          <div v-for="repo in repositories" :key="repo.id" class="mb-4">
            <repo-block :repo="repo" :is-loading="isLoading" />
          </div>
          
          <v-pagination
            v-if="maxPage > 1"
            v-model="currentPage"
            :length="maxPage"
            @update:modelValue="handlePageChange"
          ></v-pagination>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import RepoBlock from './RepoBlock.vue'
import axios from 'axios'
import { getRateLimitState } from '../store/rateLimitStore'

export default {
  name: 'UserPage',
  components: {
    RepoBlock
  },
  data() {
    return {
      userDetails: null,
      repositories: [],
      currentPage: 1,
      maxPage: 1,
      isLoading: false,
      abortController: null,
      axiosSource: null
    }
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  methods: {
    cancelPendingRequests() {
      // Cancel AbortController requests
      if (this.abortController) {
        this.abortController.abort();
      }
      // Cancel axios requests
      if (this.axiosSource) {
        this.axiosSource.cancel('Operation canceled by navigation');
      }
      // Create new cancellation tokens
      this.abortController = new AbortController();
      this.axiosSource = axios.CancelToken.source();
    },
    async fetchUserData() {
      if (getRateLimitState()) {
        return;
      }

      this.isLoading = true;
      this.cancelPendingRequests();
      
      try {
        const [maxPageResponse, reposResponse] = await Promise.all([
          axios.get(`/api/user/${this.username}/repos_max_page`, {
            signal: this.abortController.signal,
            cancelToken: this.axiosSource.token
          }),
          axios.get(`/api/user/${this.username}/repos/${this.currentPage}`, {
            signal: this.abortController.signal,
            cancelToken: this.axiosSource.token
          })
        ]);

        if (!this.abortController.signal.aborted) {
          const reposData = reposResponse.data;
          const maxPageData = maxPageResponse.data;

          const userResponse = await axios.get(`/api/user/${this.username}`, {
            signal: this.abortController.signal,
            cancelToken: this.axiosSource.token
          });
          
          if (!this.abortController.signal.aborted) {
            const userData = userResponse.data;
            this.userDetails = userData;
            this.maxPage = parseInt(typeof maxPageData === 'object' ? maxPageData.maxPage : maxPageData) || 1;
            this.repositories = Array.isArray(reposData) ? reposData : [];
          }
        }
      } catch (error) {
        if (axios.isCancel(error) || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        
        if (!error.response || (error.response.status !== 403 && error.response.status !== 429)) {
          console.error('Error fetching data:', error);
          this.userDetails = null;
          this.repositories = [];
          this.maxPage = 1;
        }
      } finally {
        if (!this.abortController.signal.aborted) {
          this.isLoading = false;
        }
      }
    },
    async handlePageChange(page) {
      if (getRateLimitState()) {
        return;
      }

      this.currentPage = page;
      this.isLoading = true;
      this.cancelPendingRequests();
      
      try {
        const response = await axios.get(`/api/user/${this.username}/repos/${this.currentPage}`, {
          signal: this.abortController.signal,
          cancelToken: this.axiosSource.token
        });
        
        if (!this.abortController.signal.aborted) {
          this.repositories = Array.isArray(response.data) ? response.data : [];
        }
      } catch (error) {
        if (axios.isCancel(error) || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        
        if (!error.response || (error.response.status !== 403 && error.response.status !== 429)) {
          console.error('Error fetching repositories:', error);
          this.repositories = [];
        }
      } finally {
        if (!this.abortController.signal.aborted) {
          this.isLoading = false;
        }
      }
    }
  },
  watch: {
    username: {
      handler: async function() {
        this.currentPage = 1;
        await this.fetchUserData();
      },
      immediate: true
    },
    async $route(to, from) {
      // If we're coming from the loading page and have data to fetch
      if (from.name === 'Loading' && !getRateLimitState()) {
        await this.fetchUserData();
      }
    }
  },
  async created() {
    if (!getRateLimitState()) {
      await this.fetchUserData();
    }
  },
  beforeRouteLeave(to, from, next) {
    this.cancelPendingRequests();
    next();
  },
  beforeUnmount() {
    this.cancelPendingRequests();
  }
}
</script>

<style scoped>
.user-details {
  position: sticky;
  top: 20px;
}
</style>