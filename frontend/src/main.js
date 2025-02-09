import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router';
import axios from 'axios';
import vuetify from './plugins/vuetify';
import { setRateLimitState, getRateLimitState } from './store/rateLimitStore';

// Create global axios CancelToken source
window.axiosSource = axios.CancelToken.source();

// Add axios interceptor for rate limit handling
let navigationInProgress = false;

function resetState() {
  setRateLimitState(false);
  navigationInProgress = false;
}

axios.interceptors.request.use(config => {
  // Ensure there's always a cancel token
  if (!config.cancelToken && window.axiosSource) {
    config.cancelToken = window.axiosSource.token;
  }
  return config;
});

axios.interceptors.response.use(
  response => {
    // Check rate limit headers from GitHub API responses
    const remaining = parseInt(response.headers['x-ratelimit-remaining']);
    if (remaining === 0 && !getRateLimitState() && !navigationInProgress) {
      navigationInProgress = true;
      setRateLimitState(true);
      
      // Cancel any pending requests before navigating
      if (window.axiosSource) {
        window.axiosSource.cancel('Operation canceled due to rate limit');
        window.axiosSource = axios.CancelToken.source();
      }

      router.push({ name: 'Loading' })
        .finally(() => {
          if (navigationInProgress) {
            setTimeout(resetState, 5000);
          }
        });
    }
    return response;
  },
  async error => {
    // Don't handle cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response && (error.response.status === 429 || error.response.status === 403) && !getRateLimitState() && !navigationInProgress) {
      navigationInProgress = true;
      setRateLimitState(true);
      
      // Cancel any pending requests before navigating
      if (window.axiosSource) {
        window.axiosSource.cancel('Operation canceled due to rate limit');
        window.axiosSource = axios.CancelToken.source();
      }

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

// Reset axios CancelToken on route change
router.beforeEach((to, from, next) => {
  if (window.axiosSource) {
    window.axiosSource.cancel('Operation canceled by navigation');
    window.axiosSource = axios.CancelToken.source();
  }
  next();
});

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app');