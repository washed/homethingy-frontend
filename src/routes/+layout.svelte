<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import 'carbon-components-svelte/css/all.css';
	import { Theme, Tile, Toggle, Tabs, Tab } from 'carbon-components-svelte';

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

	type RouteDef = {
		label: string;
		href: string;
	};

	const TAB_ROUTES: RouteDef[] = [
		{
			label: 'Home',
			href: '/'
		},
		{
			label: 'Kitchen',
			href: '/kitchen'
		},
		{
			label: 'Living Room',
			href: '/living-room'
		},
		{
			label: 'Bathroom',
			href: '/bathroom'
		},
		{
			label: 'Office',
			href: '/office'
		}
	];

	$: selected = TAB_ROUTES.findIndex((value) => value.href == $page.route.id);
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />

<div style="padding: 0.5rem;">
	<Tile>
		<div class="flexed">
			<div style="display: contents;">
				<Tabs {selected} autoWidth>
					{#each TAB_ROUTES as { label, href }, i}
						<Tab {label} {href} on:click={() => goto(href)} />
					{/each}
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
	</Tile>
</div>

<div style="padding: 0 0.5rem 0.5rem 0.5rem;">
	<slot />
</div>

<style>
	.flexed {
		display: flex;
		align-content: space-between;
		column-gap: 1rem;
	}
</style>
