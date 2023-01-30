<script lang="ts">
	import { Toggle, Button, ToastNotification } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { Temporal } from '@js-temporal/polyfill';
	import { zeroPad2 } from '$lib/util';

	import { PUBLIC_COFFEE_CTL_BASE_URL } from '$env/static/public';

	let timeToAutoOff: Temporal.Duration;
	$: timeToAutoOffStr =
		timeToAutoOff != null
			? `${zeroPad2(timeToAutoOff.hours)}:${zeroPad2(timeToAutoOff.minutes)}:${zeroPad2(
					timeToAutoOff.seconds
			  )}`
			: '';
	$: showWarning = timeToAutoOff != null ? timeToAutoOff.total('minute') < 5 : false;

	let switchOffAt: Date | null;
	$: switchOffAtStr = switchOffAt != null ? new Date(switchOffAt).toLocaleString('de-DE') : '';
	let switchState: boolean;

	export const coffeeUrl = (url: string) => `/api-proxy/${PUBLIC_COFFEE_CTL_BASE_URL}${url}`;

	export const switchClick = async (e: MouseEvent) => {
		if (switchState == true) {
			await fetch(coffeeUrl('/off'), {
				method: 'POST'
			});
		} else {
			await fetch(coffeeUrl('/on'), {
				method: 'POST'
			});
		}
	};

	export const plusDeltaT = async (tSeconds: number) => {
		await fetch(coffeeUrl('/timer'), {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ delta: tSeconds * 10e8 })
		});
	};

	export const plus15min = async () => await plusDeltaT(15 * 60);
	export const minus15min = async () => await plusDeltaT(-15 * 60);
	export const plus60min = async () => await plusDeltaT(60 * 60);
	export const minus60min = async () => await plusDeltaT(-60 * 60);

	function subscribe() {
		const sse = new EventSource(coffeeUrl('/timer/stream'));
		sse.onmessage = (e) => {
			const eventData = JSON.parse(e.data);
			if (eventData.switchOffAt != null) {
			}

			switchOffAt = eventData.switchOffAt != null ? new Date(eventData.switchOffAt) : null;

			timeToAutoOff = Temporal.Duration.from({ nanoseconds: eventData.countdownNs }).round({
				largestUnit: 'hour'
			});
			switchState = eventData.switchState;
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

<div class="flex-col">
	<div><Toggle bind:toggled={switchState} on:click={switchClick} /></div>
	<div>
		<Button on:click={plus15min}>+15 min</Button>
		<Button on:click={minus15min}>-15 min</Button>
	</div>
	<div>
		<Button on:click={plus60min}>+60 min</Button>
		<Button on:click={minus60min}>-60 min</Button>
	</div>
	<div>Zeit bis Auto-Off: {timeToAutoOffStr}</div>
	{#if switchOffAtStr !== ''}
		<div>Auto-Off um {switchOffAtStr}</div>
	{/if}
</div>

{#if showWarning}
	<ToastNotification
		fullWidth
		kind="info"
		title="5 minute warning!"
		subtitle=""
		caption={new Date().toLocaleString('de-DE')}
	/>
{/if}

<style>
	.flex-col {
		display: flex;
		align-content: center;
		flex-direction: column;
		row-gap: 1rem;
		align-items: center;
		justify-content: center;
	}
</style>
