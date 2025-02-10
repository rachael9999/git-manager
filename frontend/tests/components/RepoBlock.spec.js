import { shallowMount } from '@vue/test-utils';
import RepoBlock from '../../src/components/RepoBlock.vue';
import { describe, it, expect, beforeEach } from 'vitest';

const mockRepo = {
  id: 1,
  name: 'repo1',
  description: 'A test repository',
  owner: { login: 'user1', avatar_url: 'url', html_url: 'url' },
  stargazers_count: 10,
  forks_count: 5,
  language: 'JavaScript',
  html_url: 'https://github.com/user1/repo1'
};

describe('RepoBlock.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(RepoBlock, {
      props: { repo: mockRepo },
      global: {
        stubs: {
          VCard: {
            template: '<div><slot></slot></div>'
          },
          VCardTitle: {
            template: '<div><slot></slot></div>'
          },
          VCardText: {
            template: '<div><slot></slot></div>'
          },
          VChip: {
            template: '<div><slot></slot><slot name="prepend"></slot></div>'
          },
          VAvatar: {
            template: '<div><slot></slot></div>'
          },
          VImg: {
            template: '<div></div>'
          },
          VIcon: {
            template: '<div></div>'
          },
          VContainer: {
            template: '<div><slot></slot></div>'
          },
          VDivider: {
            template: '<div></div>'
          },
          UserPopover: {
            template: '<div><slot></slot></div>'
          }
        }
      }
    });
  });

  it('renders repository name and description', () => {
    const repoName = wrapper.find('.repo-name');
    const description = wrapper.find('.repo-description');
    expect(repoName.text()).toBe(mockRepo.name);
    expect(description.text()).toBe(mockRepo.description);
  });


  it('renders repository statistics', () => {
    const text = wrapper.text();
    expect(text).toContain(mockRepo.stargazers_count.toString());
    expect(text).toContain(mockRepo.forks_count.toString());
    expect(text).toContain(mockRepo.language);
  });
});
