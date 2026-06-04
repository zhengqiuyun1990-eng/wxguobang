<template>
	<view class="page">
		<view class="empty" v-if="list.length === 0">
			<text>暂无已加入的项目</text>
		</view>
		<view class="card" v-for="x in list" :key="x.id" @tap="enter(x)">
			<view class="head">
				<text class="name">{{ x.project.name }}</text>
				<text class="role" :class="x.role">{{ x.role === 'ship' ? '发货过磅' : '收货过磅' }}</text>
			</view>
			<text class="no">编号 #{{ x.project.no }}</text>
			<view class="meta">
				<text>未验 {{ x.pending }}</text>
				<text>已验 {{ x.done }}</text>
				<text class="enter">进入工作台 ›</text>
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
		const apps = db.allApps().filter(a => a.userId === u.id && a.status === 'approved')
		this.list = apps.map(a => {
			const project = db.getProject(a.projectId)
			if (!project) return null
			const bills = db.billsOfProject(project.id)
			let pending = 0, done = 0
			bills.forEach(b => {
				if (a.role === 'ship') {
					if (b.type === 'ship') (b.shipVerified ? done++ : pending++)
				} else {
					// 收货过磅：需要 b.recv 已存在但 recvVerified 否
					if (b.recv) (b.recvVerified ? done++ : pending++)
				}
			})
			return { id: a.id, role: a.role, project, pending, done }
		}).filter(Boolean)
	},
	methods: {
		enter(x) { uni.navigateTo({ url: `/pages/join/joinedDetail?pid=${x.project.id}&role=${x.role}` }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.empty { text-align:center; color:#999; padding: 80rpx 0; font-size: 26rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.head { display:flex; align-items:center; }
.name { flex:1; font-size: 30rpx; font-weight: 700; color:#111; }
.role { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 999px; }
.role.ship { background:#ECFDF5; color:#16A34A; }
.role.recv { background:#DBEAFE; color:#2563EB; }
.no { color:#16A34A; font-size: 24rpx; margin-top: 8rpx; display:block; }
.meta { display:flex; gap: 24rpx; color:#666; font-size: 24rpx; margin-top: 16rpx; }
.enter { margin-left:auto; color:#16A34A; }
</style>
