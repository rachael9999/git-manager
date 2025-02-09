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

          <span v-if="repo.language" class="ml-2">{{ repo.language }}</span>
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
            <span>{{ repo.stargazers_count || 0 }}</span>
          </v-chip>

          <v-chip
            size="medium"
            class="mr-4 fixed-width-chip"
            variant="flat"
          >
            <template v-slot:prepend>
              <v-icon size="medium" class="mr-1">mdi-source-fork</v-icon>
            </template>
            <span>{{ repo.forks_count || 0 }}</span>
          </v-chip>

          <v-chip
            size="medium"
            variant="flat"
          >
            <template v-slot:prepend>
              <span class="built-by-text">Built by</span>
            </template>
            <UserPopover 
              :username="repo.owner.login"
              :basicInfo="repo.owner"
            >
              <div class="owner-wrapper">
                <a :href="repo.owner.html_url" target="_blank" class="owner-link">
                  <v-avatar size="16">
                    <v-img :src="repo.owner.avatar_url" :alt="repo.owner.login"></v-img>
                  </v-avatar>
                </a>
                <router-link 
                  :to="{ name: 'UserPage', params: { username: repo.owner.login }}" 
                  class="owner-name ml-2"
                >
                  {{ repo.owner.login }}
                </router-link>
              </div>
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
        CSS: '#563d7c',
        HTML: '#e34c26',
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

.owner-wrapper {
  display: inline-flex;
  align-items: center;
}

.owner-name {
  color: #24292f;
  text-decoration: none;
}

.owner-name:hover {
  text-decoration: underline;
}
</style>