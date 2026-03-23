<template>
	<v-container>
		<div class="d-flex align-center py-4">
			<v-btn large icon class="mx-2" to="/posts/list">
				<v-icon large>mdi-chevron-left</v-icon>
			</v-btn>
			<h4 class="text-h4">
				{{ $root.lang().posts.titles.edit }}
				<span class="font-weight-light text--secondary">#{{ id }}</span>
			</h4>
		</div>
		<post-form v-model="post" :loading="loading" />
	</v-container>
</template>

<script>
import axios from "axios";
import PostForm from "./form/index.vue";

export default {
	name: "edit-post",
	components: {
		PostForm,
	},
	data() {
		return {
			loading: true,
			post: {},
		};
	},
	computed: {
		id() {
			return this.$route.params.id;
		},
	},
	created() {
		axios
			.get(`${this.$root.apiURL}/posts/${this.id}`, this.$root.apiOptions)
			.then((res) => {
				this.post = res.data;
				// set default values for optional fields
				this.post.discontinued ||= false;
			})
			.catch((err) => {
				console.error(err);
				this.$root.showSnackBar(err, "error");
			})
			.finally(() => {
				this.loading = false;
			});
	},
};
</script>
