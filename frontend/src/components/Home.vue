<template>
    <div class="home">
      <h1>GitHub Repository Manager</h1>
      <TrendingPreview />
    </div>
</template>

<script>
import TrendingPreview from './TrendingPreview.vue'

export default {
  name: 'Home',
  components: {
    TrendingPreview
  }
}
</script>
  
<style scoped>
.home {
  padding: 20px;
  text-align: center;
}
</style>