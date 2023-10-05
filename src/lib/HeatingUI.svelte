<script lang="ts">
	export let controllerName: string;

	import {
		Loading,
		Tile,
		Toggle,
		Accordion,
		AccordionItem,
		OutboundLink
	} from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	interface TRVStatus {
		targetTemperature: number;
		targetActive: boolean;
		valvePosition: number;
		temperature: number;
	}

	interface DW2Status {
		windowOpen: boolean;
	}

	interface WindowOverride {
		open: boolean;
		active: boolean;
	}

	interface HeatingStatus {
		dw2StatusAgg: DW2Status;
		trvStatusAgg: TRVStatus;
		windowOverride: WindowOverride;
		trvStatus: Record<string, TRVStatus>;
		trvInfo: Record<string, Object>;
		dw2Status: Record<string, DW2Status>;
	}

	let heatingStatus: HeatingStatus | null = null;

	export const heatingUrl = (url: string) => `/api-proxy/${env.PUBLIC_HEATING_CTL_BASE_URL}${url}`;

	function subscribe() {
		const sse = new EventSource(heatingUrl(`/${controllerName}/stream`));
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

	const setOverride = async (active: boolean, open: boolean) => {
		await fetch(heatingUrl(`/${controllerName}/window`), {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(<WindowOverride>{ active: active, open: open })
		});
	};

	export const overrideActivateToggleClick = async (e: MouseEvent) => {
		e.preventDefault();
		if (heatingStatus!.windowOverride.active == true) {
			await setOverride(false, heatingStatus!.windowOverride.open);
		} else {
			await setOverride(true, heatingStatus!.windowOverride.open);
		}
	};

	export const overrideOpenClosedToggleClick = async (e: MouseEvent) => {
		e.preventDefault();
		if (heatingStatus!.windowOverride.open == true) {
			await setOverride(heatingStatus!.windowOverride.active, false);
		} else {
			await setOverride(heatingStatus!.windowOverride.active, true);
		}
	};
</script>

<Tile>
	<div class="flex-row centered">
		<div class="flex-col main-col">
			{#if heatingStatus == null}
				<div><Loading withOverlay={false} /></div>
			{:else}
				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">Temperatur</div>
					<div style="text-align: right;">{heatingStatus.trvStatusAgg.temperature}&nbsp;°C</div>
				</div>
				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">Zieltemperatur</div>
					<div style="text-align: right;">
						{#if heatingStatus.trvStatusAgg.targetActive}
							{heatingStatus.trvStatusAgg.targetTemperature}&nbsp;°C
						{:else}
							<s>{heatingStatus.trvStatusAgg.targetTemperature}&nbsp;°C</s>
						{/if}
					</div>
				</div>
				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">Ventilöffnung</div>
					<div style="text-align: right;">{heatingStatus.trvStatusAgg.valvePosition}&nbsp;%</div>
				</div>
				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">Fenster</div>
					<div style="text-align: right;">
						{#if heatingStatus.dw2StatusAgg.windowOpen && !heatingStatus.windowOverride.active}
							offen
						{:else if !heatingStatus.dw2StatusAgg.windowOpen && !heatingStatus.windowOverride.active}
							geschlossen
						{:else if heatingStatus.dw2StatusAgg.windowOpen && heatingStatus.windowOverride.active}
							<s>offen</s>
						{:else if !heatingStatus.dw2StatusAgg.windowOpen && heatingStatus.windowOverride.active}
							<s>geschlossen</s>
						{/if}
						{#if heatingStatus.windowOverride.active && heatingStatus.windowOverride.open}
							offen
						{:else if heatingStatus.windowOverride.active && !heatingStatus.windowOverride.open}
							geschlossen
						{/if}
					</div>
				</div>
				<Accordion>
					<AccordionItem title="Fenster override">
						<div class="flex-item">
							<div style="margin: auto;">
								<Toggle
									bind:toggled={heatingStatus.windowOverride.active}
									on:click={overrideActivateToggleClick}
								/>
							</div>
						</div>
						<div class="flex-item">
							<div style="margin: auto;">
								<Toggle
									bind:toggled={heatingStatus.windowOverride.open}
									on:click={overrideOpenClosedToggleClick}
									labelA="Zu"
									labelB="Auf"
								/>
							</div>
						</div>
					</AccordionItem>
					<AccordionItem open title="Details">
						{#each Object.entries(heatingStatus.trvStatus) as [key, value]}
							<div style="padding: 0 0 1rem 0; width: 100%">
								<div class="flex-row" style="width: 100%;">
									<div class="flex-item">ShellyTRV</div>
									<div style="text-align: right;">
										<OutboundLink href="http://shellytrv-{key}/">{key}</OutboundLink>
									</div>
								</div>
								<div class="flex-row" style="width: 100%;">
									<div class="flex-item">Temperatur</div>
									<div style="text-align: right;">{value.temperature}&nbsp;°C</div>
								</div>
								<div class="flex-row" style="width: 100%;">
									<div class="flex-item">Zieltemperatur</div>
									<div style="text-align: right;">
										{#if value.targetActive}
											{value.targetTemperature}&nbsp;°C
										{:else}
											<s>{value.targetTemperature}&nbsp;°C</s>
										{/if}
									</div>
								</div>
							</div>
						{/each}

						{#each Object.entries(heatingStatus.dw2Status) as [key, value]}
							<div class="flex-row" style="width: 100%;">
								<div class="flex-item">ShellyDW2</div>
								<OutboundLink href="http://shellydw2-{key}/">{key}</OutboundLink>
							</div>
							<div class="flex-row" style="width: 100%;">
								<div class="flex-item">Fenster</div>
								<div style="text-align: right;">{value.windowOpen ? 'offen' : 'geschlossen'}</div>
							</div>
						{/each}
					</AccordionItem>
				</Accordion>
			{/if}
		</div>
	</div>
</Tile>
