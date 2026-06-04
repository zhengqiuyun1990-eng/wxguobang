<template>
	<view class="page">
		<view class="empty" v-if="list.length === 0"><text>暂无项目</text></view>
		<view class="card" v-for="p in list" :key="p.id" @tap="enter(p)">
			<view class="hd">
				<text class="name">{{ p.name }}</text>
				<text class="no">#{{ p.no }}</text>
			</view>
			<view class="meta">
				<text>项目资金：¥ {{ fund(p) }}</text>
				<text>磅票 {{ count(p) }}</text>
				<text class="enter">›</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return { list: [] } },
	onShow() {
		const u = db.currentUser()
		if (!u) return
		this.list = db.allProjects().filter(p => p.ownerId === u.id)
	},
	methods: {
		fund(p) { return (db.billsOfProject(p.id).reduce((s,b)=>s+(b.paid||0),0)).toFixed(2) },
		count(p) { return db.billsOfProject(p.id).length },
		enter(p) { uni.navigateTo({ url: '/pages/mine/projectDetail?id=' + p.id }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.empty { text-align:center; padding: 80rpx 0; color:#999; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-bottom: 20rpx; }
.hd { display:flex; align-items:center; }
.name { flex:1; font-size: 30rpx; font-weight: 700; }
.no { color:#16A34A; font-size: 24rpx; }
.meta { display:flex; gap: 20rpx; color:#666; font-size: 24rpx; margin-top: 12rpx; }
.enter { margin-left:auto; color:#ccc; font-size: 30rpx; }
</style>
