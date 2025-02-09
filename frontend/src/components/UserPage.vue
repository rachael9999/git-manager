<template>
  <v-container>
    <v-row>
      <!-- User Details Column -->
      <v-col cols="12" md="3">
        <div v-if="userDetails" class="user-details">
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
        <div v-if="loading" class="d-flex justify-center">
          <v-progress-circular
            indeterminate
            size="64"
            color="primary"
            :width="6"
          ></v-progress-circular>
        </div>
        <div v-else-if="repositories">
          <h2 class="text-h5 mb-4">Repositories</h2>
          <div v-for="repo in repositories" :key="repo.id" class="mb-4">
            <repo-block :repo="repo" />
          </div>
          
          <v-pagination
            v-if="maxPage > 1"
            v-model="currentPage"
            :length="maxPage"
            @update:modelValue="handlePageChange"
          ></v-pagination>
        </div>
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
      loading: false,
    }
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  methods: {
    async fetchUserDetails() {
      try {
        const response = await fetch(`/api/user/${this.username}`)
        this.userDetails = await response.json()
      } catch (error) {
        console.error('Error fetching user details:', error)
      }
    },
    async fetchUserRepos() {
      this.loading = true
      try {
        // Get max page first
        const maxPageResponse = await fetch(`/api/user/${this.username}/repos_max_page`)
        const maxPageData = await maxPageResponse.json()
        // Handle both cases where maxPageData might be a string or an object with maxPage field
        this.maxPage = parseInt(typeof maxPageData === 'object' ? maxPageData.maxPage : maxPageData) || 1

        // Then fetch repos for current page
        const response = await fetch(`/api/user/${this.username}/repos/${this.currentPage}`)
        const data = await response.json()
        this.repositories = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error fetching repositories:', error)
        this.repositories = []
        this.maxPage = 1
      } finally {
        this.loading = false
      }
    },
    async handlePageChange(page) {
      this.currentPage = page
      await this.fetchUserRepos()
    }
  },
  async created() {
    await this.fetchUserDetails()
    await this.fetchUserRepos()
  },
  watch: {
    username: {
      handler: async function() {
        this.currentPage = 1
        await this.fetchUserDetails()
        await this.fetchUserRepos()
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