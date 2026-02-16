<template>
	<v-row>
		<v-col
			v-for="item in loading ? skeletonCount : items"
			:key="item[track]"
			:cols="$vuetify.breakpoint.mdAndUp ? 4 : $vuetify.breakpoint.smAndUp ? 6 : 12"
			class="d-flex align-stretch"
		>
			<v-card class="d-flex flex-column main-container" style="width: 100%">
				<v-skeleton-loader v-if="loading" type="image, article" />
				<template v-else>
					<v-img
						style="border-radius: 5px"
						:src="getImage(item)"
						:aspect-ratio="16 / 9"
						@error="onImageFail(item)"
					>
						<template #placeholder>
							<v-row
								class="fill-height ma-0"
								align="center"
								justify="center"
								style="background-color: rgba(255, 255, 255, 0.1)"
							>
								<v-icon v-if="failed[item[track]]" x-large>mdi-image-off</v-icon>
								<v-progress-circular v-else indeterminate />
							</v-row>
						</template>
					</v-img>
					<!-- use scoped slots for more customizable layouts -->
					<slot name="title" v-bind="item" />
					<v-card-text style="flex-grow: 1">
						<slot name="text" v-bind="item" />
					</v-card-text>
					<v-card-actions style="justify-content: flex-end">
						<slot name="btns" v-bind="item" />
					</v-card-actions>
				</template>
			</v-card>
		</v-col>
	</v-row>
</template>

<script>
export default {
	name: "card-grid",
	props: {
		items: {
			type: Array,
			required: true,
		},
		// key is a reserved keyword
		track: {
			type: String,
			required: false,
			default: "id",
		},
		getImage: {
			type: Function,
			required: true,
		},
		loading: {
			type: Boolean,
			required: false,
			default: false,
		},
		skeletonCount: {
			type: Number,
			required: false,
			default: 5,
		},
	},
	data() {
		return {
			failed: {},
		};
	},
	methods: {
		onImageFail(item) {
			this.failed[item[this.track]] = true;
			this.$forceUpdate();
			return false;
		},
	},
};
</script>
