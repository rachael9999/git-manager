import { createRouter, createWebHistory } from 'vue-router';
import RepositoryList from '../components/RepositoryList.vue';
import RepoDetail from '../components/RepoDetail.vue';
import Home from '../components/Home.vue';
import Search from '../components/Search.vue';
import UserPage from '../components/UserPage.vue';
import NotFound from '../components/errors/NotFound.vue';
import Forbidden from '../components/errors/Forbidden.vue';
import ServerError from '../components/errors/ServerError.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
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
    component: NotFound
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: Forbidden
  },
  {
    path: '/500',
    name: 'ServerError',
    component: ServerError
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