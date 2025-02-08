import { createRouter, createWebHistory } from 'vue-router';
import RepositoryList from '../components/RepositoryList.vue';
import RepoDetail from '../components/RepoDetail.vue';
import Search from '../components/Search.vue';

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
      page: parseInt(route.query.page) || 1,
      mode: 'full'
    })
  },
  {
    path: '/repositories/full/page/:page',
    name: 'RepositoryList',
    component: RepositoryList,
    props: (route) => ({
      page: parseInt(route.params.page) || 1,
      mode: 'full'
    }),
    redirect: to => {
      return { path: '/repositories/full', query: { page: to.params.page } }
    }
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