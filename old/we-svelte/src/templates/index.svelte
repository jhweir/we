<script lang="ts">
	import '@we/elements/svelte/Badge';
	import '@we/elements/themes/dark';
	import '@we/elements/variables';

	interface TestProps {
		title: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
	}

	const { title }: TestProps = $props();
</script>

<div>
	<we-row bg="ui-300" ax="i"> Test </we-row>
	<we-badge variant="successs">{title}</we-badge>
</div>

<!-- 
  @component
  ## Props:
  - `title`: string -->
