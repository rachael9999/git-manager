import { shallowMount } from '@vue/test-utils';
import RepositoryList from '../../src/components/RepositoryList.vue';
import RepoBlock from '../../src/components/RepoBlock.vue';
import axios from 'axios';
import { createRouter, createMemoryHistory } from 'vue-router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('axios');

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { 
      path: '/repositories/full',
      name: 'FullRepositories',
      component: RepositoryList,
      props: route => ({ page: route.query.page || '1' })
    }
  ]
});

const mockRepositories = [
  { id: 1, name: 'repo1', owner: { login: 'user1', id: 1, avatar_url: 'url', html_url: 'url' } },
  { id: 2, name: 'repo2', owner: { login: 'user2', id: 2, avatar_url: 'url', html_url: 'url' } }
];

describe('RepositoryList.vue', () => {
  let wrapper;

  beforeEach(async () => {
    vi.clearAllMocks();
    axios.get.mockReset();
    axios.get.mockResolvedValue({ data: mockRepositories });
    
    await router.push('/repositories/full?page=1');
    await router.isReady();
    
    wrapper = shallowMount(RepositoryList, {
      global: {
        plugins: [router],
        stubs: {
          RepoBlock: true,
          VProgressCircular: {
            template: '<div class="v-progress-circular"></div>'
          },
          VDivider: true,
          VContainer: {
            template: '<div class="v-container"><slot /></div>'
          },
          VPagination: {
            template: '<div class="v-pagination"></div>',
            props: ['modelValue', 'length'],
            emits: ['update:modelValue']
          }
        }
      },
      props: {
        page: '1'
      }
    });
    
    await wrapper.vm.$nextTick();
  });

  it('renders RepoBlock components for each repository', async () => {
    await wrapper.setData({ repositories: mockRepositories, loading: false });
    const repoBlocks = wrapper.findAllComponents(RepoBlock);
    expect(repoBlocks).toHaveLength(mockRepositories.length);
  });

  it('fetches repositories on mount', async () => {
    expect(axios.get).toHaveBeenCalledWith('/api/repositories/full?page=1');
  });

  it('displays loading indicator when loading', async () => {
    await wrapper.setData({ loading: true, repositories: [] });
    await wrapper.vm.$nextTick();
    
    const loadingIndicator = wrapper.find('.v-progress-circular');
    expect(loadingIndicator.exists()).toBe(true);
  });

  it('navigates to the next page', async () => {
    await wrapper.setData({ maxPage: 2 });
    await wrapper.vm.$nextTick();
    
    await wrapper.vm.handlePageChange(2);
    await router.isReady();
    await wrapper.vm.$nextTick();
    
    expect(router.currentRoute.value.query.page).toBe('1');
  });

  it('navigates to the previous page', async () => {
    await wrapper.setData({ maxPage: 2, currentPage: 2 });
    await router.push('/repositories/full?page=2');
    await router.isReady();
    
    await wrapper.vm.handlePageChange(1);
    await router.isReady();
    await wrapper.vm.$nextTick();
    
    expect(router.currentRoute.value.query.page).toBe('2');
  });

  it('handles redirect response from API', async () => {
    const redirectData = { redirect: true, page: '1' };
    axios.get.mockResolvedValueOnce({ status: 303, data: redirectData });
    
    await wrapper.vm.fetchRepositories();
    expect(wrapper.vm.currentPage).toBe(1);
  });

  it('handles failed repository fetching', async () => {
    const error = new Error('Failed to fetch');
    axios.get.mockRejectedValueOnce(error);
    
    await wrapper.vm.fetchRepositories();
    expect(wrapper.vm.repositories).toEqual([]);
  });

  it('handles empty response data', async () => {
    axios.get.mockResolvedValueOnce({ data: undefined });
    
    await wrapper.vm.fetchRepositories();
    expect(wrapper.vm.repositories).toEqual([]);
    expect(wrapper.vm.hasMorePages).toBe(undefined);
  });
});

