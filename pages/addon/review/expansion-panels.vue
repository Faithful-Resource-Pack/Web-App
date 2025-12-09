<template>
	<v-container class="px-0">
		<fullscreen-preview v-model="previewOpen" :src="addonInPanelHeaderURL" />
		<v-expansion-panel
			v-for="addon in addons"
			:key="addon.id"
			:ref="addon.id"
			class="review-expansion-panel"
			rounded
			@click="getAddon(addon.id)"
		>
			<v-expansion-panel-header expand-icon="mdi-menu-down">
				<v-list-item class="flex-column align-start px-0" style="min-height: 0px">
					<v-list-item-title class="align-self-start">{{ addon.name }}</v-list-item-title>
					<v-list-item-subtitle>{{ addon.options.tags.join(" • ") }}</v-list-item-subtitle>
				</v-list-item>
			</v-expansion-panel-header>

			<v-expansion-panel-content>
				<template v-if="addonInPanelLoading === true">
					<p>{{ $root.lang().global.loading }}</p>
				</template>
				<template v-else>
					<div style="position: relative">
						<v-img
							:src="addonInPanelHeaderURL"
							:aspect-ratio="16 / 9"
							style="border-radius: 5px"
							alt="Header not found!"
							@click.stop="openHeader"
						>
							<template #placeholder>
								<v-row
									class="fill-height ma-0"
									align="center"
									justify="center"
									style="background-color: rgba(255, 255, 255, 0.1)"
								>
									<v-progress-circular
										v-if="addonInPanelHeaderURL != null"
										indeterminate
										color="grey lighten-5"
									/>
									<v-icon v-else x-large>mdi-image-off</v-icon>
								</v-row>
							</template>
						</v-img>
						<v-card
							class="ma-2"
							rounded
							dark
							style="display: inline-block; position: absolute; right: 0; top: 0"
						>
							<v-icon small class="ma-1" @click.stop="openHeader">mdi-fullscreen</v-icon>
						</v-card>
					</div>

					<addon-info class="pt-4" :addonInPanel="addonInPanel" :getUsername="getUsername" />

					<template v-if="addonSources.length > 0">
						<v-list-item-title class="uppercase my-2">
							{{ $root.lang().addons.images.title }}
						</v-list-item-title>
						<image-previewer :sources="addonSources" :deletable="false" />
					</template>

					<v-list-item-title class="uppercase my-2">
						{{ $root.lang().review.addon.titles.description }}
					</v-list-item-title>

					<!-- eslint-disable-next-line vue/no-v-html -->
					<div v-html="$root.compileMarkdown(addonInPanel.description)" />

					<div v-if="status === 'approved'" class="my-2">
						<v-list-item-title class="uppercase my-2">
							{{ $root.lang().review.addon.labels.approved_by.replace("%s", approvalAuthor) }}
						</v-list-item-title>
					</div>

					<div v-if="status === 'denied' || status === 'archived'" class="my-2">
						<v-list-item-title class="uppercase mt-2">
							{{ $root.lang().review.addon.labels.denied_by.replace("%s", approvalAuthor) }}
						</v-list-item-title>
						<p class="text--secondary">{{ addon.approval.reason }}</p>
					</div>

					<div class="text-right mt-4">
						<v-btn
							v-show="status !== 'approved'"
							text
							color="green"
							@click="$emit('reviewAddon', addon, 'approved')"
						>
							{{ $root.lang().global.btn.approve }}
						</v-btn>
						<v-btn
							v-show="status !== 'denied'"
							text
							color="red"
							@click="$emit('openDenyPopup', addonInPanel)"
						>
							{{ $root.lang().global.btn.deny }}
						</v-btn>
						<v-btn
							v-show="status !== 'archived'"
							text
							color="gray"
							@click="$emit('openDenyPopup', addonInPanel, 'archive')"
						>
							{{ $root.lang().global.btn.archive }}
						</v-btn>
						<v-btn text color="yellow" :href="`/addons/edit/${addonInPanel.id}`">
							{{ $root.lang().global.btn.edit }}
						</v-btn>
					</div>
				</template>
			</v-expansion-panel-content>
		</v-expansion-panel>
	</v-container>
</template>

<script>
import axios from "axios";

import FullscreenPreview from "@components/fullscreen-preview.vue";
import ImagePreviewer from "../image-previewer.vue";
import AddonInfo from "./addon-info.vue";

export default {
	name: "expansion-panels",
	components: {
		ImagePreviewer,
		FullscreenPreview,
		AddonInfo,
	},
	props: {
		addons: {
			type: Array,
			required: true,
		},
		contributors: {
			type: Array,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
		color: {
			type: String,
			required: false,
			default: "primary",
		},
		value: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			modalData: {},
			modalOpen: false,
			previewOpen: false,
			addonInPanelLoading: true,
			addonInPanel: {},
			addonURL: undefined,
			addonInPanelHeaderURL: "",
		};
	},
	methods: {
		getAddon(id) {
			this.addonInPanelLoading = true;

			this.$emit("input", id);

			// allSettled if no header res
			Promise.allSettled([
				axios.get(`${this.$root.apiURL}/addons/${id}/all`, this.$root.apiOptions),
				axios.get(`${this.$root.apiURL}/addons/${id}/files/header`, this.$root.apiOptions),
			]).then(([res, header_res]) => {
				// void value if already here (closing tab)
				if (this.addonInPanel.id === res.value.data.id) {
					this.addonInPanel = {};
					this.addonInPanelLoading = true;
					return;
				}

				this.addonInPanel = res.value.data;
				this.addonInPanelLoading = false;

				if (header_res.value)
					this.addonInPanelHeaderURL = `${header_res.value.data}?t=${new Date().getTime()}`;
				else this.addonInPanelHeaderURL = null;
			});
		},
		openHeader() {
			this.previewOpen = true;
		},
		openModal() {
			this.modalData = this.addonInPanel;
			this.modalOpen = true;
		},
		closeModal() {
			this.modalOpen = false;
			this.modalData = {};
			this.$emit("close");
		},
		getUsername(id) {
			if (id === null || id === undefined) return "Herobrine";
			return this.contributors.find((c) => c.id === id)?.username || "Unknown User";
		},
	},
	computed: {
		addonSources() {
			return (this.addonInPanel.files || [])
				.filter((f) => f.use === "carousel" || f.use === "screenshot")
				.map((f) => f.source);
		},
		approvalAuthor() {
			return this.getUsername(this.addonInPanel.approval.author);
		},
	},
	mounted() {
		const foundAddon = this.addons.find((a) => a.id === this.value);

		if (foundAddon) {
			const refs = this.$refs[this.value];
			if (refs === undefined) return;

			const ref = refs[0];
			ref.$children[0].$el.click();
		}
	},
};
</script>
