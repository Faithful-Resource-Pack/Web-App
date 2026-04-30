<template>
	<div>
		<slot />
		<div ref="bottomElement" />
	</div>
</template>

<script>
export default {
	name: "infinite-scroller",
	emits: ["more"],
	data() {
		return {
			// must maintain static references to listeners for unmounting
			scrollListener: () => {},
		};
	},
	methods: {
		isScrolledIntoView(el, margin = 0) {
			const rect = el.getBoundingClientRect();
			const elemTop = rect.top;
			const elemBottom = rect.bottom;
			return elemTop < window.innerHeight + margin && elemBottom >= 0;
		},
	},
	mounted() {
		// initialize callback references (they need to be the same for unmounting)
		this.scrollListener = () => {
			const el = this.$refs.bottomElement;
			this.scrollY = document.getElementById("main").scrollTop;

			if (!el || !this.isScrolledIntoView(el, 300)) return;

			// add more results when near bottom
			this.$emit("more");
		};

		// add to main since it's the scrollable container
		document.getElementById("main")?.addEventListener("scroll", this.scrollListener);
		this.scrollListener();
	},
	destroyed() {
		document.getElementById("main")?.removeEventListener("scroll", this.scrollListener);
	},
};
</script>
