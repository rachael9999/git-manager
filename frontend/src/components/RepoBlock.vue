<template>
  <v-container>
    <v-card class="repo-block" flat>
      <v-card-title class="d-flex pa-0">
        <div class="d-flex flex-column">
          <div class="d-flex align-center">
            <v-icon size="24" class="mr-2">mdi-book</v-icon>
            <a :href="repo.html_url" target="_blank" class="repo-name text-h5">{{ repo.name }}</a>
          </div>
          <p class="repo-description text-body-1">{{ repo.description }}</p>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-0 mt-4">
        <div class="d-flex flex-wrap align-center">
          <v-chip
            size="medium"
            class="mr-4"
            variant="flat"
          >
          <template v-slot:prepend>
            <span 
              class="language-dot"
              v-if="repo.language"
              :style="{ backgroundColor: languageColor }"
            ></span>
            <span v-else class="language-dot-placeholder"></span>
          </template>

          <!-- If language is loading, show the skeleton loader -->
          <v-skeleton-loader v-if="repo.language === undefined" type="text" width="60"></v-skeleton-loader>

          <!-- Once the data has loaded, show either the language or 'undefined' -->
          <span v-else-if="repo.language" class="ml-2">{{ repo.language }}</span>
          <span v-else class="ml-2">Undefined</span>
        </v-chip>

          <v-chip
            size="medium"
            class="mr-4 fixed-width-chip"
            variant="flat"
          >
            <template v-slot:prepend>
              <v-icon size="small" class="mr-1">mdi-star</v-icon>
            </template>
            <span v-if="repo.stargazers_count !== undefined">{{ repo.stargazers_count }}</span>
            <v-skeleton-loader v-else type="text" width="20" class="language-dot-placeholder"></v-skeleton-loader>
          </v-chip>

          <v-chip
            size="medium"
            class="mr-4 fixed-width-chip"
            variant="flat"
          >
            <template v-slot:prepend>
              <v-icon size="medium" class="mr-1">mdi-source-fork</v-icon>
            </template>
            <span v-if="repo.forks_count !== undefined">{{ repo.forks_count }}</span>
            <v-skeleton-loader v-else type="text" width="20" class="language-dot-placeholder"></v-skeleton-loader>
          </v-chip>

          <v-chip
            size="medium"
            class="mr-4 fixed-width-chip"
            variant="flat"
          >
            <template v-slot:prepend>
              <v-icon size="medium" class="mr-1">mdi-account</v-icon>
            </template>
            <span v-if="repo.subscribers_count !== undefined">{{ repo.subscribers_count }}</span>
            <v-skeleton-loader v-else type="text" width="20" class="language-dot-placeholder"></v-skeleton-loader>
          </v-chip>

          <v-chip
            size="medium"
            variant="flat"
          >
            <span class="built-by-text">Built by</span>
            <UserPopover 
              :username="repo.owner.login"
              :basicInfo="repo.owner"
            >
              <a :href="repo.owner.html_url" target="_blank" class="owner-link">
                <v-avatar size="16">
                  <v-img :src="repo.owner.avatar_url" :alt="repo.owner.login"></v-img>
                </v-avatar>
                <span class="ml-2">{{ repo.owner.login }}</span>
              </a>
            </UserPopover>
          </v-chip>

        </div>
      </v-card-text>
    </v-card>
    <v-divider class="my-4"></v-divider>
  </v-container>
</template>

<script>
import UserPopover from './UserPopover.vue';
export default {
  components: {
    UserPopover
  },
  props: {
    repo: {
      type: Object,
      required: true
    }
  },
  computed: {
    languageColor() {
      const colors = {
        Ruby: '#701516',
        JavaScript: '#f1e05a',
        Python: '#3572A5',
        Java: '#b07219',
        TypeScript: '#2b7489',
        Go: '#00ADD8',
        Vue: '#41b883',
        undefined: '#6e7681'
      };
      return colors[this.repo.language] || '#6e7681';
    }
  }
};
</script>

<style scoped>
.v-divider {
  margin: 8px 0 !important;
}

.language-dot, .language-dot-placeholder {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: v-bind(languageColor);
  display: inline-block;
}

.language-dot-placeholder {
  background-color: #e4e1e1;
}

.v-skeleton-loader {
  height: 12px;  
  display: inline-block; 
}

.owner-link {
  display: inline-flex;
  align-items: center;
  color: #24292f;
  text-decoration: none;
}

.owner-link:hover {
  text-decoration: underline;
}

.built-by-text {
  color: #24292f !important;
  margin-right: 4px;
}

.v-chip :deep(.v-chip__content) {
  color: #24292f !important;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.v-chip {
  background-color: transparent;
  box-shadow: none;
  height: auto;
  padding: 0 8px;
  min-width: 100px;
  justify-content: flex-start;
}

.v-chip :deep(.v-icon.mdi-star) {
  color: #e3b341;
}

.v-chip :deep(.v-icon.mdi-source-fork),
.v-chip :deep(.v-icon.mdi-account) {
  color: #24292f;
}

.v-container {
  padding: 8px 16px;
}

.fixed-width-chip {
  min-width: 80px;
}
</style>