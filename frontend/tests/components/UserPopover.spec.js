import { shallowMount } from '@vue/test-utils';
import UserPopover from '../../src/components/UserPopover.vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const mockBasicInfo = {
  login: 'testuser',
  avatar_url: 'http://example.com/avatar.jpg',
  html_url: 'http://github.com/testuser'
};

const mockUserDetails = {
  login: 'testuser',
  name: 'Test User',
  avatar_url: 'http://example.com/avatar.jpg',
  location: 'Test Location',
  html_url: 'http://github.com/testuser'
};

describe('UserPopover.vue', () => {
  let wrapper;

  beforeEach(() => {
    axios.get.mockReset();
    wrapper = shallowMount(UserPopover, {
      props: {
        username: 'testuser',
        basicInfo: mockBasicInfo
      },
      global: {
        stubs: {
          'v-menu': {
            template: '<div><slot name="activator" :props="{}"></slot><slot></slot></div>'
          },
          'v-card': {
            template: '<div class="v-card"><slot></slot></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot></slot></div>'
          },
          'v-avatar': {
            template: '<div class="v-avatar"><slot></slot></div>'
          },
          'v-img': {
            template: '<div class="v-img"></div>'
          },
          'v-icon': {
            template: '<div class="v-icon"><slot></slot></div>'
          },
          'v-progress-circular': {
            template: '<div class="v-progress-circular"></div>'
          }
        }
      }
    });
  });

  it('renders with basic info', () => {
    expect(wrapper.find('.user-trigger').exists()).toBe(true);
  });

  it('shows loading state when fetching user details', async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    wrapper.vm.show = true;
    wrapper.vm.loading = true;
    await wrapper.vm.$nextTick();
    
    await wrapper.find('.user-trigger').trigger('mouseenter');
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
  });

  it('fetches and displays user details on hover', async () => {
    axios.get.mockResolvedValueOnce({ data: mockUserDetails });
    
    await wrapper.find('.user-trigger').trigger('mouseenter');
    await wrapper.vm.$nextTick();
    
    expect(axios.get).toHaveBeenCalledWith('/api/user/testuser');
    expect(wrapper.vm.userDetails).toEqual(mockUserDetails);
  });

  it('handles API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    await wrapper.find('.user-trigger').trigger('mouseenter');
    await wrapper.vm.$nextTick();
    
    expect(consoleError).toHaveBeenCalled();
    expect(wrapper.vm.loading).toBe(false);
    
    consoleError.mockRestore();
  });

  it('does not fetch details if already loaded', async () => {
    wrapper.vm.userDetails = mockUserDetails;
    
    await wrapper.find('.user-trigger').trigger('mouseenter');
    await wrapper.vm.$nextTick();
    
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('displays user details when available', async () => {
    await wrapper.setData({ 
      userDetails: mockUserDetails,
      show: true 
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.v-card-text').exists()).toBe(true);
    expect(wrapper.text()).toContain(mockUserDetails.name);
    expect(wrapper.text()).toContain(mockUserDetails.location);
  });
});