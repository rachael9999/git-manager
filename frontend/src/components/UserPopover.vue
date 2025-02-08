<template>
  <v-menu
    v-model="show"
    :close-on-content-click="false"
    location="top"
    open-on-hover
    :openDelay="100"
    :closeDelay="100"
    offset="10"
  >
    <template v-slot:activator="{ props }">
      <span v-bind="props" class="user-trigger">
        <slot></slot>
      </span>
    </template>

    <v-card min-width="256" class="user-popover" v-if="userDetails">
      <v-card-text class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-avatar size="48" class="mr-3">
            <v-img :src="userDetails.avatar_url" :alt="userDetails.login"></v-img>
          </v-avatar>
          <div>
            <div class="text-h6">{{ userDetails.login }}</div>
            <div v-if="userDetails.name" class="text-subtitle-1">{{ userDetails.name }}</div>
          </div>
        </div>
        <div v-if="userDetails.location" class="d-flex align-center text-body-2 mb-2">
          <v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
          {{ userDetails.location }}
        </div>
      </v-card-text>
    </v-card>
    <v-card v-else-if="show" min-width="256" class="user-popover">
      <v-card-text class="pa-4">
        <v-progress-circular indeterminate></v-progress-circular>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    username: {
      type: String,
      required: true
    },
    basicInfo: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      show: false,
      userDetails: null,
      loading: false
    }
  },

  // mounted() {
  //   // Prefetch on component mount
  //   setTimeout(() => {
  //     this.prefetchUserDetails();
  //   }, 1000);
  // },

  methods: {
    async prefetchUserDetails() {
      if (!this.userDetails && !this.loading) {
        this.fetchUserDetails();
      }
    },

    async fetchUserDetails() {
      if (this.userDetails || this.loading) return;
      
      this.loading = true;
      try {
        const response = await axios.get(`/api/user/${this.username}`);
        // Handle both cached and fresh responses
        this.userDetails = response.data.data || response.data;
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.user-trigger {
  cursor: pointer;
}

.user-popover {
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}
</style>