<template>
	<div>
		<!-- image-previewer handles previews for screenshots -->
		<fullscreen-preview v-model="previewOpen" :src="header" />
		<v-card-text v-if="loading">
			<v-skeleton-loader type="heading" class="my-1" />
			<v-skeleton-loader type="text" class="my-4" style="width: 30%" />
			<v-row>
				<v-col cols="12" sm="7">
					<v-skeleton-loader type="image" />
				</v-col>
				<v-col cols="12" sm="5">
					<v-skeleton-loader type="paragraph" class="mb-4" style="width: 60%" />
					<v-skeleton-loader type="text, list-item-avatar@2" />
				</v-col>
			</v-row>
			<v-skeleton-loader type="paragraph" class="my-4" />

			<v-skeleton-loader type="text" class="mb-1 mt-5" style="width: 30%" />
			<v-skeleton-loader v-for="i in 2" :key="i" type="button" class="block mb-2" />
		</v-card-text>
		<template v-else>
			<v-card-title>
				<span class="text-h5">
					<a
						v-if="addon.approval.status === 'approved'"
						class="text--primary hover-underline"
						:href="`https://faithfulpack.net/addons/${addon.slug}`"
						target="blank"
						rel="noopener noreferrer"
					>
						{{ addon.name }}
					</a>
					<span v-else>
						{{ addon.name }}
					</span>
					<span class="text--secondary font-weight-light">{{ `#${addon.id}` }}</span>
				</span>
				<v-spacer />
				<v-btn icon :title="$root.lang().global.btn.edit" :to="`/addons/edit/${addon.id}`">
					<v-icon>mdi-pencil</v-icon>
				</v-btn>
			</v-card-title>
			<v-card-subtitle>{{ date }}</v-card-subtitle>
			<v-card-text>
				<v-row class="mb-2">
					<v-col cols="12" sm="7">
						<emitting-image :src="header" :aspect-ratio="16 / 9" @fullscreen="openHeader" />
					</v-col>
					<v-col cols="12" sm="5">
						<span class="uppercase-unsized text--primary">
							{{ $root.lang().review.addon.titles.compatibility }}
						</span>
						<div class="text--secondary mb-4">
							<div>
								<v-icon small>{{ checked(addon.options.tags.includes("Java")) }}</v-icon>
								Java Edition
							</div>
							<div>
								<v-icon small>{{ checked(addon.options.tags.includes("Bedrock")) }}</v-icon>
								Bedrock Edition
							</div>
							<div>
								<v-icon small>{{ checked(addon.options.optifine) }}</v-icon>
								{{ $root.lang().review.addon.labels.optifine }}
							</div>
						</div>

						<span class="uppercase-unsized text--primary mt-4">{{ authorTitle }}</span>

						<!-- smaller than regular list so requires extra styling-->
						<v-list nav class="mx-n2 pa-0" style="background: transparent">
							<v-list-item
								v-for="author in addonAuthors"
								:key="author.id"
								:href="`https://faithfulpack.net/user/${author.id}`"
								target="_blank"
								rel="noopener noreferrer"
								class="pa-2 my-0"
								style="min-height: 0px"
							>
								<img
									:src="`https://vzge.me/face/64/${author.uuid || 'X-Steve'}`"
									:aria-label="
										$root
											.lang()
											.global.account_manager.avatar_alt_text.replace('%s', author.username)
									"
									width="32"
									height="32"
								/>
								<v-list-item-content class="py-0 ps-2">
									<v-list-item-title>
										{{ author.username || $root.lang().database.anonymous }}
									</v-list-item-title>
									<v-list-item-subtitle>
										{{ author.id }}
									</v-list-item-subtitle>
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-col>
				</v-row>

				<template v-if="screenshots.length > 0">
					<span class="uppercase-unsized text--primary mt-4">
						{{ $root.lang().addons.images.title }}
					</span>
					<image-previewer :sources="screenshots" class="my-2" />
				</template>

				<span class="uppercase-unsized text--primary mt-4">
					{{ $root.lang().review.addon.titles.description }}
				</span>

				<!-- eslint-disable vue/no-v-html -->
				<div
					class="mt-2 mb-4 text--primary overflow-x-hidden"
					v-html="$root.compileMarkdown(addon.description)"
				/>
				<!-- eslint-enable vue/no-v-html -->

				<span class="uppercase-unsized text--primary mt-4">
					{{ downloadTitle }}
				</span>
				<v-btn
					v-for="{ name, source } in downloads"
					:key="source"
					:href="source"
					target="_blank"
					rel="noopener noreferrer"
					color="secondary"
					class="mt-2"
					block
				>
					<v-icon left>mdi-download</v-icon>
					{{ name }}
				</v-btn>
			</v-card-text>
		</template>
	</div>
</template>

<script>
import EmittingImage from "@components/emitting-image.vue";
import FullscreenPreview from "@components/fullscreen-preview.vue";
import ImagePreviewer from "../image-previewer.vue";

export default {
	name: "addon-panel",
	components: {
		EmittingImage,
		FullscreenPreview,
		ImagePreviewer,
	},
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
			required: false,
			default: () => [],
		},
	},
	data() {
		return {
			previewOpen: false,
			addonInPanelHeaderURL: "",
		};
	},
	methods: {
		openHeader() {
			this.previewOpen = true;
		},
		checked(option) {
			return option ? "mdi-checkbox-marked-outline" : "mdi-checkbox-blank-outline";
		},
	},
	computed: {
		header() {
			return this.addon.files?.find((f) => f.use === "header")?.source;
		},
		screenshots() {
			return this.addon.files?.filter((f) => f.use === "screenshot").map((f) => f.source);
		},
		downloads() {
			return this.addon.files?.filter((f) => f.use === "download");
		},
		date() {
			if (!this.addon.last_updated) return this.$root.lang().review.addon.titles.unknown_date;
			const formatted = this.$root.formatDate(this.addon.last_updated);
			return this.$root.lang().review.addon.titles.last_updated.replace("%s", formatted);
		},
		downloadTitle() {
			const key = this.downloads.length === 1 ? "download_singular" : "download_plural";
			return this.$root.lang().review.addon.titles[key];
		},
		authorTitle() {
			const key = this.addon.authors.length === 1 ? "author_singular" : "author_plural";
			return this.$root.lang().review.addon.titles[key];
		},
		addonAuthors() {
			return this.addon.authors.map((id) => this.authors.find((c) => c.id === id));
		},
	},
};
</script>
