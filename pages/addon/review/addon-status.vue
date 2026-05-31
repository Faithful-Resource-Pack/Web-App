<template>
	<div>
		<v-card-text v-if="loading" class="d-flex align-center ga-4">
			<div class="flex-grow-1 mr-auto">
				<v-skeleton-loader type="heading" />
			</div>
			<v-skeleton-loader v-for="i in 3" :key="i" type="button" />
		</v-card-text>
		<v-card-text
			v-else
			class="d-flex flex-column align-center justify-space-between flex-sm-row ga-4"
		>
			<div class="align-self-start align-self-sm-center">
				<template v-if="status === 'pending' && reason">
					<span class="uppercase-unsized">
						{{ $root.lang().addons.general.reason.title }}
					</span>
					<p class="text--secondary mb-0">{{ reason }}</p>
				</template>
				<template v-if="status === 'approved'">
					<span class="uppercase-unsized">
						{{ $root.lang().review.addon.labels.approved_by.replace("%s", username) }}
					</span>
				</template>
				<template v-if="status === 'denied' || status === 'archived'">
					<span class="uppercase-unsized">
						{{ $root.lang().review.addon.labels.denied_by.replace("%s", username) }}
					</span>
					<p class="text--secondary mb-0">{{ reason }}</p>
				</template>
			</div>
			<div class="d-flex flex-wrap flex-sm-nowrap justify-end align-self-end align-self-sm-center">
				<v-btn
					text
					color="green"
					:disabled="status === 'approved'"
					@click="$emit('reviewAddon', addon.id)"
				>
					{{ $root.lang().global.btn.approve }}
				</v-btn>
				<v-btn
					text
					color="red"
					:disabled="status === 'denied'"
					@click="$emit('openDenyPopup', addon.id)"
				>
					{{ $root.lang().global.btn.deny }}
				</v-btn>
				<v-btn
					text
					:disabled="status === 'archived'"
					@click="$emit('openDenyPopup', addon.id, 'archive')"
				>
					{{ $root.lang().global.btn.archive }}
				</v-btn>
			</div>
		</v-card-text>
	</div>
</template>

<script>
export default {
	name: "addon-status",
	props: {
		addon: {
			type: Object,
			required: true,
		},
		loading: {
			type: Boolean,
			required: false,
			default: false,
		},
		contributors: {
			type: Array,
			required: true,
		},
	},
	emits: ["reviewAddon", "openDenyPopup"],
	computed: {
		status() {
			return this.addon.approval.status;
		},
		reason() {
			return this.addon.approval.reason;
		},
		author() {
			return this.addon.approval.author;
		},
		username() {
			return this.contributors.find((c) => c.id === this.author)?.username || id;
		},
	},
};
</script>
