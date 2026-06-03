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
				<span class="uppercase-unsized">
					{{ title.replace("%s", username) }}
				</span>
				<p v-if="status !== 'approved'" class="text--secondary mb-0">
					<template v-if="reason">{{ reason }}</template>
					<i v-else>{{ $root.lang().review.addon.labels.no_reason }}</i>
				</p>
			</div>
			<div
				class="d-flex flex-wrap flex-sm-nowrap justify-end align-self-end align-self-sm-center ga-2"
			>
				<v-btn
					text
					color="green"
					:disabled="status === 'approved'"
					@click="$emit('reviewAddon', addon.id)"
				>
					<v-icon left>mdi-check</v-icon>
					{{ $root.lang().global.btn.approve }}
				</v-btn>
				<v-btn
					text
					color="red"
					:disabled="status === 'denied'"
					@click="$emit('openDenyPopup', addon.id)"
				>
					<v-icon left>mdi-cancel</v-icon>
					{{ $root.lang().global.btn.deny }}
				</v-btn>
				<v-btn
					text
					:disabled="status === 'archived'"
					@click="$emit('openDenyPopup', addon.id, 'archive')"
				>
					<v-icon left>mdi-archive</v-icon>
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
		authors: {
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
		username() {
			return (
				this.authors.find((c) => c.id === this.addon.approval.author)?.username ||
				this.addon.approval.author
			);
		},
		title() {
			switch (this.status) {
				case "pending":
					return this.$root.lang().addons.general.reason.title;
				case "approved":
					return this.$root.lang().review.addon.labels.approved_by;
				case "denied":
					return this.$root.lang().review.addon.labels.denied_by;
				case "archived":
					return this.$root.lang().review.addon.labels.archived_by;
			}
			return this.$root.lang().review.addon.labels.unknown_status.replace("%s", this.status);
		},
	},
};
</script>
