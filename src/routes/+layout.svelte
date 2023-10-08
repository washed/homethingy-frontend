<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import 'carbon-components-svelte/css/all.css';
	import {
		Theme,
		Tile,
		Toggle,
		Tabs,
		Tab,
		ProgressBar,
		InlineLoading
	} from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { env } from '$env/dynamic/public';
	import '$lib/style.css';

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
				}
			});
		}
	});

	let ReloadPrompt;
	onMount(async () => {
		pwaInfo && (ReloadPrompt = (await import('$lib/ReloadPrompt.svelte')).default);
	});

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';

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
			label: 'Anywhere',
			href: '/anywhere'
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
		},
		{
			label: 'Garden',
			href: '/garden'
		}
	];

	$: selected = TAB_ROUTES.findIndex((value) => value.href == $page.route.id);

	// quick and dirty PV stuff down here
	interface PVStatus {
		timestamp: string;
		device_id: string;
		grid_voltage: number;
		grid_current: number;
		grid_power: number;
		grid_frequency: number;
		pv_power_1: number;
		pv_power_2: number;
		feedin_power: number;
		battery_charge_power: number;
		battery_soc: number;
		radiator_temperature: number;
		battery_temperature: number;
	}

	let pvStatus: PVStatus | null = null;

	$: batterySoc = pvStatus ? pvStatus.battery_soc : null;
	$: chargePower = pvStatus ? pvStatus.battery_charge_power : null;
	$: charging = chargePower !== null ? chargePower > 0.0 : null;
	$: chargingStatus = (() => {
		if (chargePower !== null && charging !== null) {
			return chargePower != 0.0
				? `${batterySoc}% | ${charging ? 'charging' : 'discharging'} (${chargePower} W)`
				: `${batterySoc}%`;
		} else {
			return null;
		}
	})();

	export const pvUrl = (url: string) => `/api-proxy/${env.PUBLIC_PV_CTL_BASE_URL}${url}`;

	function subscribe() {
		const sse = new EventSource(pvUrl('/stream'));
		sse.onerror = async (e: Event) => {
			console.log('error connecting to pv-ctl backend, retrying...');
			sse.close();

			const timeout = setTimeout(async () => {
				console.log('Retrying pv-ctl backend connection');
				// await invalidateAll(); this might work if we somehow use a load fn
				// Not pretty, but for now it works
				window.location.reload();
			}, 3000);
			console.log('maybe did the thing!');
		};
		sse.onmessage = (e: MessageEvent) => {
			pvStatus = JSON.parse(e.data);
		};
		return () => {
			sse.close();
		};
	}

	onMount(() => {
		const unsub = subscribe();
		return unsub;
	});
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<Theme bind:theme persist persistKey="__carbon-theme" />

<div style="padding: 0.5rem;">
	<Tile>
		<div class="flex-row centered">
			<div class="flex-col main-col">
				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">
						<Tabs {selected} autoWidth>
							{#each TAB_ROUTES as { label, href }, i}
								<Tab {label} {href} on:click={() => goto(href)} />
							{/each}
						</Tabs>
					</div>
					<div class="flex-item" style="text-align: right; padding: 0 2.5rem 0 0;">
						<Toggle
							on:toggle={themeToggle}
							bind:toggled={themeToggled}
							labelA="Bright"
							labelB="Dark"
							size="sm"
						/>
					</div>
				</div>

				<div class="flex-row">
					{#if batterySoc !== null && chargingStatus !== null}
						<div class="flex-item">
							<div class="flex-item">
								<ProgressBar
									value={batterySoc}
									labelText="Battery SoC"
									helperText={chargingStatus}
								/>
							</div>
						</div>
					{:else}
						<div class="flex-item">
							<InlineLoading description="Loading PV metrics" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Tile>
</div>

<div style="padding: 0 0.5rem 0.5rem 0.5rem;">
	<slot />
</div>
