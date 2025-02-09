<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        ></v-progress-circular>
        <h2 class="text-h4 mb-2">Too Many Requests</h2>
        <p class="text-subtitle-1">Redirecting to home page in {{ countdown }} seconds</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useRouter } from 'vue-router'
import { setRateLimitState } from '../store/rateLimitStore'

export default {
  name: 'LoadingPage',
  data() {
    return {
      countdown: 5,
      timer: null
    }
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  mounted() {
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        setRateLimitState(false);
        this.router.push('/');
      }
    }, 1000);
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
</script>