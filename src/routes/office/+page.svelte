<script lang="ts">
	import { Loading, Button } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	interface HeatingStatus {
		windowOpen: boolean;
		targetTemperature: number;
		temperature: number;
	}

	let heatingStatus: HeatingStatus | null = null;

	export const heatingUrl = (url: string) => `/api-proxy/${env.PUBLIC_HEATING_CTL_BASE_URL}${url}`;

	function subscribe() {
		const sse = new EventSource(heatingUrl('/office/stream'));
		sse.onerror = async (e: Event) => {
			console.log('error connecting to heating-ctl backend, retrying...');
			sse.close();

			const timeout = setTimeout(async () => {
				console.log('Retrying heating-ctl backend connection');
				// await invalidateAll(); this might work if we somehow use a load fn
				// Not pretty, but for now it works
				window.location.reload();
			}, 3000);
			console.log('maybe did the thing!');
		};
		sse.onmessage = (e: MessageEvent) => {
			heatingStatus = JSON.parse(e.data);
		};
		return () => {
			sse.close();
		};
	}

	onMount(() => {
		const unsub = subscribe();
		return unsub;
	});

	export const forceOpen = async () => {};
	export const forceClose = async () => {};
</script>

<div class="flex-row centered">
	<div class="flex-col">
		{#if heatingStatus == null}
			<div><Loading withOverlay={false} /></div>
		{:else}
			<div class="flex-row" style="width: 100%;">
				<div class="flex-item">Temperatur</div>
				<div style="text-align: right;">{heatingStatus.temperature}&nbsp;°C</div>
			</div>
			<div class="flex-row" style="width: 100%;">
				<div class="flex-item">Zieltemperatur</div>
				<div style="text-align: right;">{heatingStatus.targetTemperature}&nbsp;°C</div>
			</div>
			<div class="flex-row" style="width: 100%;">
				<div class="flex-item">Fenster</div>
				<div style="text-align: right;">
					{#if heatingStatus.windowOpen}
						offen
					{:else}
						geschlossen
					{/if}
				</div>
			</div>
			<div class="flex-item">
				<div style="margin: auto;">
					<p>Fenster override</p>
				</div>
			</div>
			<div class="flex-item">
				<Button on:click={forceOpen}>auf</Button>
				<Button on:click={forceClose}>zu</Button>
			</div>
		{/if}
	</div>
</div>

<style>
	.flex-col {
		display: flex;
		align-content: center;
		flex-direction: column;
		row-gap: 1rem;
		align-items: center;
		justify-content: center;
	}

	.flex-row {
		display: flex;
		align-content: space-between;
		row-gap: 0.75rem;
	}

	.centered {
		align-items: center;
		justify-content: center;
	}

	.flex-item {
		display: flex;
		width: 100%;
		column-gap: 0.75rem;
		justify-content: stretch;
		align-items: center;
		align-content: center;
	}
</style>
