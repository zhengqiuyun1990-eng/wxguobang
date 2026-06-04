<template>
	<view class="page">
		<view class="hint">仅项目负责人可查看 / 打印</view>
		<view class="empty" v-if="myProjects.length === 0"><text>您不是任何项目的负责人</text></view>
		<view class="card" v-for="p in myProjects" :key="p.id">
			<view class="hd">
				<text class="name">{{ p.name }}</text>
				<text class="no">#{{ p.no }}</text>
			</view>
			<view class="meta">
				<text>磅票 {{ countOf(p).total }}</text>
				<text>双向已验 {{ countOf(p).both }}</text>
			</view>
			<view class="row">
				<button class="btn" size="mini" @tap="open(p, 'simple')">简洁版</button>
				<button class="btn" size="mini" @tap="open(p, 'detail')">详版</button>
				<button class="btn primary" size="mini" @tap="open(p, 'pro')">专业分析</button>
			</view>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
import { api } from '@/utils/request.js'
export default {
	data() { return { myProjects: [] } },
	async onShow() {
		const u = db.currentUser()
		if (!u) return
		// 优先拉后端项目列表
		try {
			const res = await api.myProjects()
			const list = (res && res.list) || []
			const mapped = list.map(p => ({
				id: 'P' + p.id, remoteId: p.id, no: p.id,
				name: p.title,
				shipperCompany: p.shipper_company || '',
				receiverCompany: p.receiver_company || '',
				driverFee: Number(p.driver_fee) || 0,
				owners: (p.master || []).map(m => ({ name: m.name, phone: m.phone })),
				ownerId: u.id
			}))
			this.myProjects = mapped.filter(p => p.owners.some(o => o.phone === u.phone))
			if (this.myProjects.length > 0) return
		} catch (e) {}
		// 后端不可用：回退本地
		this.myProjects = db.allProjects().filter(p => p.ownerId === u.id || (p.owners || []).some(o => o.phone === u.phone))
	},
	methods: {
		countOf(p) {
			const bills = db.billsOfProject(p.id)
			return {
				total: bills.length,
				both: bills.filter(b => b.shipVerified && b.recvVerified).length
			}
		},
		open(p, mode) { uni.navigateTo({ url: `/pages/print/detail?id=${p.id}&mode=${mode}` }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.hint { background:#FEF3C7; color:#92400E; padding: 16rpx 24rpx; border-radius: 16rpx; font-size: 24rpx; }
.empty { text-align:center; padding: 80rpx 0; color:#999; font-size: 26rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-top: 24rpx; }
.hd { display:flex; align-items:center; }
.name { flex:1; font-size: 30rpx; font-weight: 700; }
.no { color:#16A34A; font-size: 24rpx; }
.meta { color:#666; font-size: 24rpx; margin-top: 8rpx; display:flex; gap: 24rpx; }
.row { display:flex; gap: 16rpx; margin-top: 20rpx; }
.btn { flex:1; font-size: 24rpx; background:#fff; color:#16A34A; border:1rpx solid #4ADE80; border-radius: 999px; }
.btn.primary { background:#4ADE80; color:#fff; }
</style>
