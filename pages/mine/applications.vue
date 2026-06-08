<template>
	<view class="page">
		<view class="empty" v-if="list.length === 0"><text>暂无收到的申请</text></view>
		<view class="card" v-for="a in list" :key="a.id">
			<view class="hd">
				<text class="name">{{ a.name }}</text>
				<text class="role" :class="a.role">{{ a.role === 'ship' ? '发货过磅' : '收货过磅' }}</text>
			</view>
			<text class="meta">📞 {{ a.phone }} · 项目 #{{ projectNo(a) }}</text>
			<text class="meta">提交时间 {{ formatTime(a.createdAt) }}</text>
			<view class="actions" v-if="a.status === 'pending'">
				<button class="ghost" size="mini" @tap="reject(a)">拒绝</button>
				<button class="primary" size="mini" @tap="approve(a)">通过</button>
			</view>
			<text class="status" :class="a.status" v-else>{{ a.status === 'approved' ? '已通过' : '已拒绝' }}</text>
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
		this.list = db.appsForOwner(u.id).reverse()
	},
	methods: {
		projectNo(a) { return db.getProject(a.projectId)?.no || '' },
		approve(a) { db.updateApp(a.id, { status: 'approved' }); this.refresh() },
		reject(a) { db.updateApp(a.id, { status: 'rejected' }); this.refresh() },
		refresh() {
			const u = db.currentUser()
			this.list = db.appsForOwner(u.id).reverse()
		},
		formatTime(t) {
			const d = new Date(t)
			return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.empty { text-align:center; padding: 80rpx 0; color:#999; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-bottom: 20rpx; }
.hd { display:flex; align-items:center; }
.name { flex:1; font-size: 30rpx; font-weight: 700; }
.role { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 999px; }
.role.ship { background:#ECFDF5; color:#16A34A; }
.role.recv { background:#DBEAFE; color:#2563EB; }
.meta { display:block; color:#666; font-size: 24rpx; margin-top: 8rpx; }
.actions { display:flex; gap: 16rpx; margin-top: 20rpx; }
.ghost { flex:1; background:#fff; border:1rpx solid #ddd; color:#666; border-radius: 999px; font-size: 26rpx; }
.primary { flex:1; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 26rpx; }
.status { display:block; margin-top: 16rpx; font-size: 24rpx; }
.status.approved { color:#16A34A; }
.status.rejected { color:#ef4444; }
</style>
