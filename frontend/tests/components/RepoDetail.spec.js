import { shallowMount } from '@vue/test-utils';
import RepoDetail from '../../src/components/RepoDetail.vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const mockRepo = {
  id: 1,
  name: 'repo1',
  description: 'A test repository',
  owner: { login: 'user1' },
  stargazers_count: 10,
  forks_count: 5,
  language: 'JavaScript',
  open_issues_count: 2,
  html_url: 'https://github.com/user1/repo1'
};

axios.get.mockResolvedValue({ data: mockRepo });

describe('RepoDetail.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(RepoDetail, {
      props: { id: 1 },
      global: {
        stubs: {
          VCard: true,
          VCardTitle: true,
          VCardText: true,
          VSkeletonLoader: true,
          VDivider: true,
          VIcon: true,
          VChip: true
        }
      }
    });
  });

  it('fetches repository details on mount', async () => {
    await wrapper.vm.$nextTick();
    expect(axios.get).toHaveBeenCalledWith('/api/repositories/details/1');
    expect(wrapper.vm.repo).toEqual(mockRepo);
  });

  it('displays repository details', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.setData({ repo: mockRepo, loading: false });
    expect(wrapper.text()).toContain(mockRepo.name);
    expect(wrapper.text()).toContain(mockRepo.description);
  });

  it('displays loading text when loading', async () => {
    await wrapper.setData({ loading: true, repo: null });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Loading...');
  });
});
