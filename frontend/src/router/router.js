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
  // Error routes
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../components/errors/NotFound.vue')
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../components/errors/Forbidden.vue')
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('../components/errors/ServerError.vue')
  },
  // Catch-all redirect to 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Optional: Global error handling
router.onError((error) => {
  if (error.response && error.response.status) {
    const status = error.response.status;
    if (status === 403) {
      router.push('/403');
    } else if (status >= 500) {
      router.push('/500');
    }
  }
});

export default router;