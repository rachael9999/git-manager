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
    }
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  methods: {
    async fetchUserData() {
      this.isLoading = true
      try {
        // First fetch repos (which validates user existence) and max page
        const [maxPageResponse, reposResponse] = await Promise.all([
          fetch(`/api/user/${this.username}/repos_max_page`),
          fetch(`/api/user/${this.username}/repos/${this.currentPage}`)
        ]);

        if (!reposResponse.ok) {
          this.userDetails = null;
          return;
        }

        const [maxPageData, reposData] = await Promise.all([
          maxPageResponse.json(),
          reposResponse.json()
        ]);

        // Then fetch user details only if repos request succeeded
        const userResponse = await fetch(`/api/user/${this.username}`);
        const userData = await userResponse.json();

        this.userDetails = userData;
        this.maxPage = parseInt(typeof maxPageData === 'object' ? maxPageData.maxPage : maxPageData) || 1;
        this.repositories = Array.isArray(reposData) ? reposData : [];
      } catch (error) {
        console.error('Error fetching data:', error)
        this.userDetails = null
        this.repositories = []
        this.maxPage = 1
      } finally {
        this.isLoading = false
      }
    },
    async handlePageChange(page) {
      this.currentPage = page
      this.isLoading = true
      try {
        const response = await fetch(`/api/user/${this.username}/repos/${this.currentPage}`)
        const data = await response.json()
        this.repositories = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error fetching repositories:', error)
        this.repositories = []
      } finally {
        this.isLoading = false
      }
    }
  },
  async created() {
    await this.fetchUserData()
  },
  watch: {
    username: {
      handler: async function() {
        this.currentPage = 1
        await this.fetchUserData()
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
.user-details {
  position: sticky;
  top: 20px;
}
</style>