import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendingPage from '@/components/TrendingPage.vue'
import RepoBlock from '@/components/RepoBlock.vue'

// Mock fetch globally
global.fetch = vi.fn()

function mountComponent(options = {}) {
  return mount(TrendingPage, {
    global: {
      stubs: {
        RepoBlock: true,
        'v-pagination': {
          template: '<div class="v-pagination" @click="$emit(\'update:modelValue\', value)"></div>',
          props: ['modelValue'],
          emits: ['update:modelValue']
        }
      },
      mocks: {
        $route: {
          query: {}
        },
        $router: {
          push: vi.fn()
        }
      },
      ...options
    }
  })
}

describe('TrendingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    fetch.mockReset()
  })

  it('renders correctly with default values', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('h1').text()).toBe('Trending Repositories')
    expect(wrapper.vm.selectedPeriod).toBe('week')
    expect(wrapper.vm.selectedLanguage).toBe('')
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('initializes with query parameters', async () => {
    const wrapper = mountComponent({
      global: {
        mocks: {
          $route: {
            query: {
              page: '1',
              period: 'week',
            }
          },
          $router: {
            push: vi.fn()
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.selectedPeriod).toBe('week')
  })

  it('fetches repositories on mount', async () => {
    const mockData = {
      status: 200,
      data: [
        { id: 1, name: 'repo1', stars: 100, forks: 50 },
        { id: 2, name: 'repo2', stars: 200, forks: 75 }
      ],
      total_pages: 5
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('repositories/trending?period=week&page=1')
    )
    expect(wrapper.vm.trendingRepos).toEqual(mockData.data)
    expect(wrapper.vm.totalPages).toBe(5)
  })

  it('updates filters and refetches data', async () => {
    const wrapper = mountComponent()
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 200,
        data: [],
        total_pages: 1
      })
    })

    await wrapper.setData({ selectedPeriod: 'month' })
    await wrapper.vm.$nextTick()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('period=month')
    )
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('handles fetch errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.error).toBe('Failed to fetch trending repositories')
    expect(wrapper.find('.error').exists()).toBe(true)
  })

  it('handles redirect responses', async () => {
    const redirectResponse = {
      status: 303,
      redirect: true,
      page: 2
    }

    const finalResponse = {
      status: 200,
      data: [],
      total_pages: 5
    }

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(redirectResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(finalResponse)
      })

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentPage).toBe(2)
    expect(wrapper.vm.$router.push).toHaveBeenCalled()
  })
})