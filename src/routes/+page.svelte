<script lang="ts">
  import PromptBox from '$lib/components/PromptBox.svelte'
  import { parsePrompt } from '$lib/parsers/prompt'

  // Types
  import type { Parsed } from '$types/genealogy'

  let result: Parsed | null = null

  const handleSubmit = (text: string) => {
    result = parsePrompt(text)
  }
</script>
<section class="max-w-3xl mx-auto p-6 space-y-4">
  <h1 class="text-2xl font-bold">Familjeträd – PoC</h1>

  <PromptBox onSubmit={handleSubmit} />

  {#if result}
    {#if result.errors.length}
      <div class="mt-4 p-3 border rounded bg-yellow-50">
        <strong>Fel:</strong>
        <ul class="list-disc ml-5">
          {#each result.errors as e}<li>{e}</li>{/each}
        </ul>
      </div>
    {/if}

    <div class="mt-4 p-3 border rounded bg-gray-50">
      <h2 class="font-semibold mb-2">Parser-output</h2>
      <pre class="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
    </div>
  {/if}
</section>