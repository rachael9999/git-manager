import { createRouter, createWebHistory } from 'vue-router';
import RepositoryList from '../components/RepositoryList.vue';
import RepoDetail from '../components/RepoDetail.vue';
import Search from '../components/Search.vue';
import UserPage from '../components/UserPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/Home.vue')
  },
  {
    path: '/repositories/full',
    name: 'FullRepositories',
    component: RepositoryList,
    props: (route) => ({
      page: parseInt(route.query.page) || 1
    })
  },
  {
    path: '/repositories/:id',
    name: 'RepositoryDetail',
    component: RepoDetail,
    props: true
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/user/:username',
    name: 'UserPage',
    component: UserPage,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    // create 404 page later
    component: () => import('../components/Home.vue') 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;