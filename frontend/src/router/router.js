import { createRouter, createWebHistory } from 'vue-router';
import RepositoryList from '../components/RepositoryList.vue';
import RepoDetail from '../components/RepoDetail.vue';
import Search from '../components/Search.vue';
import UserPage from '../components/UserPage.vue';
import LoadingPage from '../components/LoadingPage.vue';
import { getRateLimitState } from '../store/rateLimitStore';

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
    path: '/loading',
    name: 'Loading',
    component: LoadingPage
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../components/Home.vue') 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (getRateLimitState() && to.name !== 'Loading') {
    next({ name: 'Loading' });
  } else {
    next();
  }
});

export default router;