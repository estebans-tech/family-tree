import adapter from '@sveltejs/adapter-netlify'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $types: 'src/types',
      $components: 'src/lib/components',
      $parsers: 'src/lib/parsers',
      $utils: 'src/lib/utils'
    }
  }
}

export default config