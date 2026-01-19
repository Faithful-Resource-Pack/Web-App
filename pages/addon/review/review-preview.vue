<template>
	<div class="review-preview d-flex flex-column">
		<v-card
			style="height: 100%"
			class="rounded-lg pa-2 flex-grow-1 overflow-y-auto overflow-x-hidden"
		>
			<fullscreen-preview v-model="previewOpen" :src="addonInPanelHeaderURL" />
			<div
				v-if="addonInPanelLoading === true"
				class="d-flex flex-column align-center justify-center"
				style="height: 100%"
			>
				<v-progress-circular indeterminate :size="150" :width="10" />
				<p class="text-h6 my-5">{{ $root.lang().global.loading }}</p>
			</div>
			<template v-else>
				<div class="pb-2 d-flex align-center">
					<div>
						<h2 class="h6" style="line-height: 24px">
							<a
								v-if="addonInPanel.approval.status === 'approved'"
								class="text--primary hover-underline"
								:href="`https://www.faithfulpack.net/addons/${addonInPanel.slug}`"
								target="blank"
								rel="noopener noreferrer"
							>
								{{ addonInPanel.name }}
							</a>
							<span v-else>
								{{ addonInPanel.name }}
							</span>
							<span class="text--secondary font-weight-regular">{{ `#${addonInPanel.id}` }}</span>
						</h2>
						<div class="text--secondary subtitle-2 mt-1" style="line-height: 14px">
							{{
								Array.from(addonInPanel.options.tags || [])
									.sort()
									.join(" • ")
							}}
						</div>
					</div>
					<v-btn icon class="ml-auto" :href="`/addons/edit/${addonInPanel.id}`">
						<v-icon>mdi-pencil</v-icon>
					</v-btn>
				</div>
				<v-row>
					<v-col cols="12" sm="7">
						<emitting-image
							:src="addonInPanelHeaderURL"
							:aspect-ratio="16 / 9"
							@fullscreen="openHeader"
						/>
					</v-col>
					<v-col cols="12" sm="5">
						<addon-info :addonInPanel="addonInPanel" :getUsername="getUsername" />
					</v-col>
				</v-row>

				<template v-if="addonSources.length > 0">
					<v-list-item-title class="uppercase my-2">
						{{ $root.lang().addons.images.title }}
					</v-list-item-title>
					<image-previewer :sources="addonSources" />
				</template>

				<v-list-item-title class="uppercase pb-2 py-4">
					{{ $root.lang().review.addon.titles.description }}
				</v-list-item-title>

				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="$root.compileMarkdown(addonInPanel.description)" />
			</template>
		</v-card>
		<div v-if="status === 'pending' && addonInPanel.approval.reason" class="mt-2 rounded-lg pa-2">
			<v-list-item-title class="uppercase pb-1">
				{{ $root.lang().addons.general.reason.title }}
			</v-list-item-title>
			<div>{{ addonInPanel.approval.reason }}</div>
		</div>
		<v-card v-if="addonInPanelLoading === false" class="mt-2 rounded-lg pa-2">
			<div class="d-flex align-center">
				<div class="mr-auto">
					<div v-if="status === 'approved'">
						{{ $root.lang().review.addon.labels.approved_by.replace("%s", approvalAuthor) }}
					</div>
					<div v-if="status === 'denied' || status === 'archived'">
						<v-list-item-title class="uppercase">
							{{ $root.lang().review.addon.labels.denied_by.replace("%s", approvalAuthor) }}:
						</v-list-item-title>
						<p class="text--secondary mb-0">{{ addonInPanel.approval.reason }}</p>
					</div>
				</div>
				<v-btn
					text
					:color="colors['approved']"
					:disabled="status === 'approved'"
					@click="$emit('reviewAddon', addonId, 'approved')"
				>
					{{ $root.lang().global.btn.approve }}
				</v-btn>
				<v-btn
					text
					:color="colors['denied']"
					:disabled="status === 'denied'"
					@click="$emit('openDenyPopup', addonInPanel)"
				>
					{{ $root.lang().global.btn.deny }}
				</v-btn>
				<v-btn
					text
					:disabled="status === 'archived'"
					@click="$emit('openDenyPopup', addonInPanel, 'archive')"
				>
					{{ $root.lang().global.btn.archive }}
				</v-btn>
			</div>
		</v-card>
	</div>
</template>

<script>
import axios from "axios";

import FullscreenPreview from "@components/fullscreen-preview.vue";
import ImagePreviewer from "../image-previewer.vue";
import AddonInfo from "./addon-info.vue";
import EmittingImage from "@components/emitting-image.vue";

export default {
	name: "review-preview",
	components: {
		FullscreenPreview,
		ImagePreviewer,
		AddonInfo,
		EmittingImage,
	},
	props: {
		addonId: {
			type: String,
			required: false,
			default: undefined,
		},
		colors: {
			type: Object,
			required: false,
			default: () => ({}),
		},
	},
	data() {
		return {
			modalData: {},
			modalOpen: false,
			previewOpen: false,
			addonInPanelLoading: true,
			addonInPanel: {},
			addonInPanelHeaderURL: "",
			contributors: [],
		};
	},
	methods: {
		getAddon(id) {
			this.addonInPanelLoading = true;

			// allSettled if no header res
			Promise.allSettled([
				axios.get(`${this.$root.apiURL}/addons/${id}/all`, this.$root.apiOptions),
				axios.get(`${this.$root.apiURL}/addons/${id}/files/header`, this.$root.apiOptions),
			]).then(([res, headerRes]) => {
				// void value if already here (closing tab)
				if (this.addonInPanel.id === res.value.data.id) {
					this.addonInPanel = {};
					this.addonInPanelLoading = true;
					return;
				}

				this.addonInPanel = res.value.data;
				this.addonInPanelLoading = false;

				if (headerRes.value)
					this.addonInPanelHeaderURL = `${headerRes.value.data}?t=${new Date().getTime()}`;
				else this.addonInPanelHeaderURL = null;
			});
		},
		openModal() {
			this.modalData = this.addonInPanel;
			this.modalOpen = true;
		},
		closeModal() {
			this.modalOpen = false;
			this.modalData = {};
			this.update();
		},
		getUsername(id) {
			if (id === null || id === undefined) return "Herobrine";
			return this.contributors.find((c) => c.id === id)?.username || "Unknown User";
		},
		openHeader() {
			this.previewOpen = true;
		},
	},
	computed: {
		addonSources() {
			return (this.addonInPanel.files || [])
				.filter((f) => f.use === "carousel" || f.use === "screenshot")
				.map((f) => f.source);
		},
		status() {
			return this.addonInPanel && this.addonInPanel.approval
				? this.addonInPanel.approval.status
				: undefined;
		},
		approvalAuthor() {
			return this.getUsername(this.addonInPanel.approval.author);
		},
	},
	watch: {
		addonId: {
			handler(n) {
				if (n === undefined) return;
				this.getAddon(n);
			},
			immediate: true,
		},
	},
	created() {
		axios
			.get(`${this.$root.apiURL}/users/names`)
			.then((res) => {
				this.contributors = res.data;
			})
			.catch((err) => {
				console.error(err);
				this.$root.showSnackBar(err, "error");
			});
	},
};
</script>
