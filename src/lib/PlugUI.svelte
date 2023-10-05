<script lang="ts">
	export let controllerName: string;
	export let name: string;

	import { Toggle, Button, ToastNotification, Loading, Tile } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { Temporal } from '@js-temporal/polyfill';
	import { zeroPad2 } from '$lib/util';
	import { env } from '$env/dynamic/public';

	interface SwitchOffAtStatus {
		time: Date;
		valid: boolean;
	}

	interface ButtonBatteryStatus {
		soc: number;
		valid: boolean;
	}

	interface TimerStatus {
		countdownNs: number;
		switchOffAtStatus: SwitchOffAtStatus;
		countdownRunning: boolean;
		intendedSwitchState: boolean;
		switchState: boolean;
		buttonBatteryStatus: ButtonBatteryStatus;
	}

	let timerStatus: TimerStatus | null = null;

	$: countdownNsDuration = timerStatus
		? Temporal.Duration.from({
				nanoseconds: timerStatus!.countdownNs
		  }).round({
				largestUnit: 'hour'
		  })
		: null;
	$: timeToAutoOffStr = countdownNsDuration
		? `${zeroPad2(countdownNsDuration.hours)}:${zeroPad2(countdownNsDuration.minutes)}:${zeroPad2(
				countdownNsDuration.seconds
		  )}`
		: '--:--:--';

	$: showWarning = countdownNsDuration ? countdownNsDuration.total('minute') < 5 : false;

	$: switchOffAtStr = timerStatus?.switchOffAtStatus.valid
		? new Date(timerStatus?.switchOffAtStatus.time).toLocaleString('de-DE').replace(', ', '\xa0')
		: '';

	$: buttonBatterySoCStr = timerStatus?.buttonBatteryStatus.valid
		? `${timerStatus?.buttonBatteryStatus.soc}\xa0%`
		: 'N/A';

	export const coffeeUrl = (url: string) => `/api-proxy/${env.PUBLIC_COFFEE_CTL_BASE_URL}/${controllerName}${url}`;

	export const switchClick = async (e: MouseEvent) => {
		e.preventDefault();
		console.log('mouse event', e);
		if (timerStatus!.switchState == true) {
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
		sse.onerror = async (e: Event) => {
			console.log('error connecting to coffee-ctl backend, retrying...');
			sse.close();

			const timeout = setTimeout(async () => {
				console.log('Retrying coffe-ctl backend connection');
				// await invalidateAll(); this might work if we somehow use a load fn
				// Not pretty, but for now it works
				window.location.reload();
			}, 3000);
			console.log('maybe did the thing!');
		};
		sse.onmessage = (e: MessageEvent) => {
			timerStatus = JSON.parse(e.data);
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

<Tile>
	<div class="flex-row centered">
		<div class="flex-col main-col">
			{#if timerStatus == null}
				<div><Loading withOverlay={false} /></div>
			{:else}
				<div class="flex-item">
					<div style="margin: auto;">
						<h2>{name}</h2>
					</div>
				</div>
				<div class="flex-item">
					<div style="margin: auto;">
						<Toggle bind:toggled={timerStatus.switchState} on:click={switchClick} />
					</div>
				</div>
				<div class="flex-item">
					<Button on:click={plus15min}>+15 min</Button>
					<Button on:click={minus15min}>-15 min</Button>
				</div>
				<div class="flex-item">
					<Button on:click={plus60min}>+60 min</Button>
					<Button on:click={minus60min}>-60 min</Button>
				</div>
				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">Zeit bis Auto-Off</div>
					<div style="text-align: right;">{timeToAutoOffStr}</div>
				</div>

				{#if switchOffAtStr !== ''}
					<div class="flex-row" style="width: 100%;">
						<div class="flex-item">Auto-Off um</div>
						<div style="text-align: right;">{switchOffAtStr}</div>
					</div>
				{/if}

				<div class="flex-row" style="width: 100%;">
					<div class="flex-item">Button Battery SoC</div>
					<div style="text-align: right;">{buttonBatterySoCStr}</div>
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
			{/if}
		</div>
	</div>
</Tile>
