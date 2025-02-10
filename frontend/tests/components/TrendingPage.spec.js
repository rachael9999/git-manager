import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendingPage from '@/components/TrendingPage.vue'
import RepoBlock from '@/components/RepoBlock.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

// Mock fetch globally
global.fetch = vi.fn()

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ 
    path: '/trending', 
    name: 'TrendingPage', 
    component: TrendingPage,
    props: route => ({ 
      page: route.query.page || '1',
      period: route.query.period || 'week',
      language: route.query.language || ''
    })
  }]
})

function mountComponent(options = {}) {
  return mount(TrendingPage, {
    global: {
      plugins: [router],
      stubs: {
        RepoBlock: true,
        'v-pagination': {
          template: '<div class="v-pagination" @click="$emit(\'update:modelValue\', value)"></div>',
          props: ['modelValue'],
          emits: ['update:modelValue']
        },
        'v-select': {
          template: '<select @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
          props: ['modelValue'],
          emits: ['update:modelValue']
        },
        'v-progress-circular': true,
        'v-alert': true
      },
      ...options
    }
  })
}

describe('TrendingPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetch.mockReset()
    await router.push('/')
    await router.isReady()
  })

  it('renders correctly with default values', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('h1').text()).toBe('Trending Repositories')
    expect(wrapper.vm.selectedPeriod).toBe('week')
    expect(wrapper.vm.selectedLanguage).toBe('')
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('initializes with query parameters', async () => {
    await router.push('/trending?page=2&period=month&language=JavaScript')
    await router.isReady()
    
    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentPage).toBe(2)
    expect(wrapper.vm.selectedPeriod).toBe('month')
    expect(wrapper.vm.selectedLanguage).toBe('JavaScript')
  })

  it('fetches repositories on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    })

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick() // Wait for fetch to complete

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/repositories/trending')
    )
  })


  it('handles fetch errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountComponent()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.error).toBeTruthy()
    expect(wrapper.vm.loading).toBe(false)
  })

})