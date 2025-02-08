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

axios.get.mockResolvedValue({ data: mockRepositories });

describe('RepositoryList.vue', () => {
  let wrapper;

  beforeEach(async () => {
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
            template: '<div class="v-container"><slot></slot></div>'
          }
        }
      },
      props: {
        page: '1'
      }
    });
  });

  it('renders RepoBlock components for each repository', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.setData({ repositories: mockRepositories, loading: false });
    const repoBlocks = wrapper.findAllComponents(RepoBlock);
    expect(repoBlocks).toHaveLength(mockRepositories.length);
  });

  it('fetches repositories on mount', async () => {
    await wrapper.vm.$nextTick();
    expect(axios.get).toHaveBeenCalledWith('/api/repositories/full?page=1');
  });

  it('displays loading indicator when loading', async () => {
    await wrapper.setData({ loading: true });
    const loadingIndicator = wrapper.find('.v-progress-circular');
    expect(loadingIndicator.exists()).toBe(true);
  });

  it('navigates to the next page', async () => {
    await wrapper.setData({ hasMorePages: true });
    await router.push('/repositories/full?page=1');
    await wrapper.vm.$nextTick();
    await wrapper.vm.nextPage();
    await router.isReady();
    await wrapper.vm.$nextTick();
    // need a delay here to let the router update the query
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(router.currentRoute.value.query.page).toBe('2');
  });

  it('navigates to the previous page', async () => {
    await router.push('/repositories/full?page=2');
    await router.isReady();
    await wrapper.setProps({ page: '2' });
    await wrapper.vm.$nextTick();
    await wrapper.vm.prevPage();
    await router.isReady();
    await wrapper.vm.$nextTick();
    // need a delay here to let the router update the query
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(router.currentRoute.value.query.page).toBe('1');
  });

  it('handles redirect response from API', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 303,
        data: { redirect: true, page: '1' }
      }
    });
    
    await wrapper.vm.fetchRepositories();
    await wrapper.vm.$nextTick();
    
    expect(router.currentRoute.value.fullPath).toBe('/repositories/full?page=1');
  });

  it('handles failed repository fetching', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    await wrapper.vm.fetchRepositories();
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.loading).toBe(false);
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('handles empty response data', async () => {
    axios.get.mockResolvedValueOnce({ data: null });
    
    await wrapper.vm.fetchRepositories();
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.repositories).toEqual([]);
    expect(wrapper.vm.hasMorePages).toBe(null);
  });
});

