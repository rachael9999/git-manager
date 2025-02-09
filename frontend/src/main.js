import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router';
import axios from 'axios';
import vuetify from './plugins/vuetify';
import { setRateLimitState, getRateLimitState } from './store/rateLimitStore';

// Add axios interceptor for rate limit handling
let navigationInProgress = false;

function resetState() {
  setRateLimitState(false);
  navigationInProgress = false;
}

axios.interceptors.response.use(
  response => {
    // Check rate limit headers from GitHub API responses
    const remaining = parseInt(response.headers['x-ratelimit-remaining']);
    if (remaining === 0 && !getRateLimitState() && !navigationInProgress) {
      navigationInProgress = true;
      setRateLimitState(true);
      router.push({ name: 'Loading' }).finally(() => {
        setTimeout(resetState, 5000);
      });
    }
    return response;
  },
  async error => {
    if (error.response && (error.response.status === 429 || error.response.status === 403) && !getRateLimitState() && !navigationInProgress) {
      navigationInProgress = true;
      setRateLimitState(true);
      
      try {
        await router.push({ name: 'Loading' });
        setTimeout(resetState, 5000);
      } catch (navError) {
        resetState();
      }
    }
    return Promise.reject(error);
  }
);

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app');