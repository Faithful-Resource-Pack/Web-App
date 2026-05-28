<template>
	<v-container class="flex-grow-1">
		<v-row no-gutters class="py-0 my-0" align="center">
			<v-col cols="12" sm="6">
				<div class="text-h4 py-4 d-flex flex-row align-center">
					{{ $root.lang().posts.titles.list }}
					<v-progress-circular v-if="loading" indeterminate class="ml-5" />
				</div>
			</v-col>
			<v-col cols="12" sm="6">
				<v-btn block color="secondary" to="/posts/new">
					<v-icon left>mdi-plus</v-icon>
					{{ $root.lang().posts.titles.new }}
				</v-btn>
			</v-col>
		</v-row>

		<ascii-error
			v-if="!loading && !posts.length"
			:subtitle="error || $root.lang().global.no_results"
			:errorCode="errorCode"
		/>
		<div v-else class="my-2 text-h5">
			<card-grid
				:items="posts"
				:getImage="
					(post) =>
						post.header_img ||
						'https://database.faithfulpack.net/images/website/posts/placeholder.jpg'
				"
				:loading="loading"
			>
				<template #title="{ title, permalink }">
					<v-card-title style="word-break: break-word">{{ title }}</v-card-title>
					<v-card-subtitle>{{ permalink }}</v-card-subtitle>
				</template>
				<template #text="{ published, permalink }">
					<v-badge dot inline :color="published ? 'green' : 'yellow'" />
					{{ $root.lang().posts.status[published ? "published" : "draft"] }}
					<v-btn
						v-if="published"
						color="blue"
						:href="`https://faithfulpack.net${permalink}`"
						target="_blank"
						rel="noopener noreferrer"
						icon
						small
					>
						<v-icon small>mdi-open-in-new</v-icon>
					</v-btn>
				</template>
				<template #btns="post">
					<v-btn text :to="`/posts/edit/${post.id}`">
						{{ $root.lang().global.btn.edit }}
					</v-btn>
					<v-btn color="red" text @click="deletePost(post)">
						{{ $root.lang().global.btn.delete }}
					</v-btn>
				</template>
			</card-grid>
		</div>

		<post-remove-confirm v-model="removeOpen" :post="removeData" @close="getPosts" />
	</v-container>
</template>

<script>
import axios from "axios";
import PostRemoveConfirm from "./post-remove-confirm.vue";
import CardGrid from "@layouts/card-grid.vue";
import AsciiError from "@components/ascii-error.vue";

export default {
	name: "post-grid",
	components: {
		AsciiError,
		CardGrid,
		PostRemoveConfirm,
	},
	data() {
		return {
			removeOpen: false,
			removeData: {},
			posts: [],
			loading: true,
			errorCode: undefined,
			error: undefined,
			failed: {},
		};
	},
	methods: {
		getPosts() {
			axios
				.get(`${this.$root.apiURL}/posts/raw`, this.$root.apiOptions)
				.then((res) => {
					this.posts = Object.values(res.data).sort((a, b) => new Date(b.date) - new Date(a.date));
				})
				.catch((err) => {
					console.error(err);
					this.errorCode = err.response?.status;
					this.error =
						err.response.data?.message ||
						err.response.statusText ||
						this.$root.lang().global.no_results;
				})
				.finally(() => {
					this.loading = false;
				});
		},
		deletePost(post) {
			this.removeOpen = true;
			this.removeData = post;
		},
	},
	created() {
		this.getPosts();
	},
};
</script>
