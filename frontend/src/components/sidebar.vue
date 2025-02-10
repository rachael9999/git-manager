<template>
  <v-app>
    <v-layout>
      <v-navigation-drawer permanent>
        <v-list>
          <v-list-item
            prepend-icon="mdi-home"
            title="Home"
            :to="{ name: 'Home' }"
          />
          <v-list-item
            prepend-icon="mdi-source-repository"
            title="Repositories"
            :to="{ name: 'FullRepositories', query: { page: 1 }}"
          />
          <v-list-item
            prepend-icon="mdi-trending-up"
            title="Trending"
            :to="{ name: 'TrendingPage' }"
          />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
.v-navigation-drawer {
  padding-top: 1rem;
}
</style>