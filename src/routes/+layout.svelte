<script lang="ts">
	import { goto } from '$app/navigation';
	import 'carbon-components-svelte/css/all.css';
	import { Theme, Grid, Row, Column, Toggle, Tabs, Tab } from 'carbon-components-svelte';

	type CarbonTheme = 'g10' | 'g90';
	let theme: CarbonTheme = 'g90';
	$: themeToggled = theme == 'g90';

	export const themeToggle = async (e: CustomEvent<{ toggled: boolean }>) => {
		if (e.detail.toggled == true) {
			theme = 'g90';
		} else {
			theme = 'g10';
		}
	};
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />

<div class="flexed">
	<div style="display: contents;">
		<Tabs>
			<Tab label="Home" href="/" on:click={() => goto('/')} />
			<Tab label="Kitchen" href="/kitchen" on:click={() => goto('/kitchen')} />
		</Tabs>
	</div>
	<div style="min-width: 6rem;">
		<Toggle
			on:toggle={themeToggle}
			bind:toggled={themeToggled}
			labelA="Bright"
			labelB="Dark"
			size="sm"
		/>
	</div>
</div>
<slot />

<style>
	.flexed {
		display: flex;
		align-content: space-between;
	}
</style>
