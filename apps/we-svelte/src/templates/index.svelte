<script lang="ts">
	/**
	 * A test component that displays a title
	 *
	 * @component
	 * @example
	 * <Test title="My Title" />
	 */
	import '@we/elements/svelte';
	import '@we/elements/themes/dark';
	import '@we/elements/variables';

	/**
	 * The title to display in the component
	 * @default "Default Title"
	 */
	export let title: string = 'Default Title';
</script>

<div>
	<we-row bg="ui-300" ax="i"> Test </we-row>
	<we-badge variant="successs">{title}</we-badge>
</div>
