<script lang="ts">
	import 'carbon-components-svelte/css/all.css';
	import { Toggle, Grid, Column, Row, Button, ToastNotification } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { Temporal } from '@js-temporal/polyfill';
	import { zeroPad2 } from '$lib/util';

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

	export const switchClick = async (e: MouseEvent) => {
		if (switchState == true) {
			await fetch('/api-proxy/off', {
				method: 'POST'
			});
		} else {
			await fetch('/api-proxy/on', {
				method: 'POST'
			});
		}
	};

	async function plusDeltaT(tSeconds: number) {
		await fetch('/api-proxy/timer', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ delta: tSeconds * 10e8 })
		});
	}

	export const plus15min = async () => await plusDeltaT(15 * 60);
	export const minus15min = async () => await plusDeltaT(-15 * 60);
	export const plus60min = async () => await plusDeltaT(60 * 60);
	export const minus60min = async () => await plusDeltaT(-60 * 60);

	function subscribe() {
		const sse = new EventSource('/api-proxy/timer/stream');
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
			console.log('calling sse.close()');
			sse.close();
		};
	}

	onMount(() => {
		const unsub = subscribe();
		return unsub;
	});
</script>

<h1>Kitchen - Coffee Machine</h1>

{#if showWarning}
	<ToastNotification
		kind="info"
		title="5 minute warning!"
		subtitle=""
		caption={new Date().toLocaleString('de-DE')}
	/>
{/if}

<Grid>
	<Row>
		<Column><Toggle labelText="On/Off" bind:toggled={switchState} on:click={switchClick} /></Column>
	</Row>
	<Row><Column>Auto-Off um</Column><Column>{switchOffAtStr}</Column></Row>
	<Row><Column>Zeit bis Auto-Off</Column><Column>{timeToAutoOffStr}</Column></Row>
	<Row>
		<Column><Button on:click={plus15min}>+15 min</Button></Column>
		<Column><Button on:click={minus15min}>-15 min</Button></Column>
	</Row>
	<Row>
		<Column><Button on:click={plus60min}>+60 min</Button></Column>
		<Column><Button on:click={minus60min}>-60 min</Button></Column>
	</Row>
</Grid>
