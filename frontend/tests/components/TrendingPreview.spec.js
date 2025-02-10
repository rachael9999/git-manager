import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendingPreview from '@/components/TrendingPreview.vue'
import axios from 'axios'

// Mock axios
vi.mock('axios')

function mountComponent(options = {}) {
  return mount(TrendingPreview, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>'
        }
      },
      ...options
    }
  })
}

describe('TrendingPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with empty state', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.trending-header h2').text()).toContain('Trending This Week')
    expect(wrapper.find('.view-all-link').exists()).toBe(true)
  })

  it('fetches and displays trending repositories', async () => {
    const mockRepos = [
      {
        id: 1,
        name: 'repo1',
        owner: {
          login: 'user1',
          avatar_url: 'https://example.com/avatar1.png'
        },
        description: 'Test repo 1',
        stars: 100,
        forks: 50,
        language: 'JavaScript',
        html_url: 'https://github.com/user1/repo1'
      },
      {
        id: 2,
        name: 'repo2',
        owner: {
          login: 'user2',
          avatar_url: 'https://example.com/avatar2.png'
        },
        description: 'Test repo 2',
        stars: 200,
        forks: 75,
        language: 'Python',
        html_url: 'https://github.com/user2/repo2'
      }
    ]

    axios.get.mockResolvedValueOnce({ data: mockRepos })

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    expect(axios.get).toHaveBeenCalledWith('/api/repositories/trending?period=week&page=1')
    expect(wrapper.vm.trendingRepos).toEqual(mockRepos)
    
    // Verify cards are rendered
    const cards = wrapper.findAll('.repo-preview-card')
    expect(cards).toHaveLength(2)
    
    // Check first card content
    const firstCard = cards[0]
    expect(firstCard.find('.v-card-title').text()).toBe('repo1')
    expect(firstCard.find('.description').text()).toBe('Test repo 1')
  })

  it('handles API errors gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.error).toBe('Failed to fetch trending repositories')
    expect(wrapper.find('.v-alert').exists()).toBe(true)
  })

  it('shows loading state while fetching', async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}))  // Never resolves

    const wrapper = mountComponent()
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
  })

  it('returns correct language color', () => {
    const wrapper = mountComponent()
    
    expect(wrapper.vm.getLanguageColor('JavaScript')).toBe('#f1e05a')
    expect(wrapper.vm.getLanguageColor('Python')).toBe('#3572A5')
    expect(wrapper.vm.getLanguageColor('UnknownLanguage')).toBe('#6e7681')
  })

  it('limits display to 6 repositories', async () => {
    const mockRepos = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `repo${i + 1}`,
      owner: {
        login: `user${i + 1}`,
        avatar_url: `https://example.com/avatar${i + 1}.png`
      }
    }))

    axios.get.mockResolvedValueOnce({ data: mockRepos })

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.repo-preview-card')
    expect(cards).toHaveLength(6)
  })
})