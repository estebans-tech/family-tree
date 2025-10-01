<script lang="ts">
  export let label = 'Prompt'
  export let placeholder = 'Ex: Anna(1985)+Bo(1983)->Lisa(2012),Max(2015)'
  export let value = ''
  export let onSubmit: ((text: string) => void) | undefined

  let text = value
  const submit = () => onSubmit?.(text)
</script>

<form class="space-y-3" on:submit|preventDefault={submit}>
  <label for="prompt" class="block text-sm font-medium">{label}</label>
  <textarea
    id="prompt"
    class="w-full h-40 p-3 border rounded"
    bind:value={text}
    placeholder={placeholder}
  ></textarea>
  <button type="submit" class="px-4 py-2 rounded bg-green-700 text-white">
    Generera
  </button>
</form>
