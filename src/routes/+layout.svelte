<script lang="ts">
	import 'carbon-components-svelte/css/g90.css';
	import 'carbon-components-svelte/css/g10.css';
	import {
		Theme,
		RadioButtonGroup,
		RadioButton,
		Breadcrumb,
		BreadcrumbItem,
		OverflowMenu,
		OverflowMenuItem,
		Grid,
		Row,
		Column
	} from 'carbon-components-svelte';

	type CarbonTheme = 'g10' | 'g90';

	let theme: CarbonTheme = 'g90';
	let value = 0;
	let paths = $page.url.pathname.replace(/^\/|\/$/g, '').split('/');

	import { page } from '$app/stores';
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />

<Grid>
	<Row>
		<Column>
			<OverflowMenu>
				<OverflowMenuItem href="/kitchen" text="Kitchen" />
			</OverflowMenu>
		</Column>
		<Column>
			<RadioButtonGroup legendText="Carbon theme" bind:selected={theme}>
				<RadioButton labelText="Dark" value="g90" />
				<RadioButton labelText="Bright" value="g10" />
			</RadioButtonGroup>
		</Column>
	</Row>
	<Row>
		<Breadcrumb noTrailingSlash>
			<BreadcrumbItem href="/">home</BreadcrumbItem>
			{#each paths as path, i}
				<BreadcrumbItem href={paths.slice(0, i + 1).join('/')}>{path}</BreadcrumbItem>
			{/each}
		</Breadcrumb>
	</Row>
</Grid>
<div><slot /></div>
