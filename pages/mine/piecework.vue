<template>
	<view class="page">
		<view class="hd">
			<text class="lbl">累计计件</text>
			<text class="amt">¥ {{ user.totalPiece.toFixed(2) }}</text>
			<button class="cash" @tap="cash">提现</button>
		</view>

		<view class="tabs">
			<text class="tab" :class="{active: tab==='all'}" @tap="tab='all'">总览</text>
			<text class="tab" :class="{active: tab==='month'}" @tap="tab='month'">按年月</text>
			<text class="tab" :class="{active: tab==='day'}" @tap="tab='day'">按日期</text>
		</view>

		<view class="card">
			<view class="rr"><text>核验单数</text><text class="hi">{{ records.length }}</text></view>
			<view class="rr"><text>计件总额</text><text class="hi">¥ {{ totalAmount.toFixed(2) }}</text></view>
		</view>

		<view class="card">
			<view class="ct">明细</view>
			<view class="empty" v-if="records.length === 0">暂无</view>
			<view class="row" v-for="r in records" :key="r.id">
				<text class="rt">{{ formatTime(r.time) }}</text>
				<text class="rp">{{ r.project }}</text>
				<text class="ra">+ ¥ {{ r.amount.toFixed(2) }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return { user: { totalPiece: 0 }, tab: 'all', records: [] } },
	computed: {
		totalAmount() { return this.records.reduce((s, r) => s + r.amount, 0) }
	},
	onShow() {
		this.user = db.currentUser() || { totalPiece: 0 }
		const u = this.user
		const records = []
		db.allBills().forEach(b => {
			const proj = db.getProject(b.projectId)
			if (!proj) return
			if (b.shipVerifiedBy === u.id) records.push({ id: b.id+'-s', time: b.shipVerifiedAt, project: proj.name, amount: proj.allocate.ship })
			if (b.recvVerifiedBy === u.id) records.push({ id: b.id+'-r', time: b.recvVerifiedAt, project: proj.name, amount: proj.allocate.recv })
		})
		records.sort((a,b)=>b.time-a.time)
		this.records = records
	},
	methods: {
		cash() {
			if (this.user.totalPiece <= 0) return uni.showToast({ title: '暂无可提现金额', icon: 'none' })
			uni.showModal({ title: '提现', content: `提现 ¥ ${this.user.totalPiece.toFixed(2)} 到微信钱包？`, success: r => {
				if (r.confirm) {
					db.updateUser({ totalPiece: 0 })
					this.user = db.currentUser()
					uni.showToast({ title: '提现申请已提交', icon: 'success' })
				}
			}})
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
.hd { background: linear-gradient(135deg,#4ADE80,#16A34A); border-radius: 20rpx; padding: 50rpx; color:#fff; display:flex; flex-direction:column; align-items:center; }
.lbl { font-size: 24rpx; opacity:.85; }
.amt { font-size: 70rpx; font-weight: 800; margin-top: 8rpx; }
.cash { margin-top: 24rpx; background:#fff; color:#16A34A; border-radius: 999px; font-size: 26rpx; padding: 10rpx 60rpx; font-weight: 600; }
.tabs { background:#fff; border-radius: 999px; padding: 8rpx; display:flex; margin-top: 24rpx; }
.tab { flex:1; text-align:center; padding: 16rpx; font-size: 26rpx; color:#666; border-radius: 999px; }
.tab.active { background:#4ADE80; color:#fff; font-weight: 600; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-top: 24rpx; }
.rr { display:flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx dashed #f0f0f0; font-size: 26rpx; }
.rr:last-child { border-bottom: none; }
.hi { color:#16A34A; font-weight: 700; }
.ct { font-size: 28rpx; font-weight: 700; margin-bottom: 12rpx; }
.empty { text-align:center; color:#bbb; padding: 30rpx 0; font-size: 24rpx; }
.row { display:flex; align-items:center; padding: 16rpx 0; border-bottom: 1rpx dashed #f0f0f0; }
.row:last-child { border-bottom: none; }
.rt { color:#999; font-size: 22rpx; width: 200rpx; }
.rp { flex:1; color:#333; font-size: 26rpx; }
.ra { color:#16A34A; font-weight: 700; font-size: 26rpx; }
</style>
