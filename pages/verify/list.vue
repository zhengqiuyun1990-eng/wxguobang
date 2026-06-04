<template>
	<view class="page">
		<view class="empty" v-if="list.length === 0"><text>暂无待验票磅单</text></view>
		<view class="card" v-for="b in list" :key="b.id" @tap="enter(b)">
			<view class="head">
				<text class="plate">{{ b.plate }}</text>
				<text class="tag" :class="role">{{ role === 'ship' ? '发货' : '收货' }}</text>
				<text class="time">{{ formatTime(b.createdAt) }}</text>
			</view>
			<view class="nums">
				<text>毛 {{ display(b).gross }}t</text>
				<text>皮 {{ display(b).tare }}t</text>
				<text>净 {{ display(b).net }}t</text>
			</view>
			<text class="driver">司机 {{ b.driverName }} · {{ b.driverPhone }}</text>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return { pid: '', role: '', list: [] } },
	onLoad(q) { this.pid = q.pid; this.role = q.role },
	onShow() {
		const bills = db.billsOfProject(this.pid)
		this.list = bills.filter(b => {
			if (this.role === 'ship') return b.type === 'ship' && !b.shipVerified
			else return !!b.recv && !b.recvVerified
		}).reverse()
	},
	methods: {
		display(b) { return this.role === 'ship' ? b : b.recv },
		enter(b) { uni.navigateTo({ url: `/pages/verify/detail?bid=${b.id}&role=${this.role}` }) },
		formatTime(t) {
			const d = new Date(t)
			return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.empty { text-align:center; padding: 80rpx 0; color:#999; font-size: 26rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-bottom: 20rpx; }
.head { display:flex; align-items:center; }
.plate { font-size: 30rpx; font-weight: 700; color:#111; }
.tag { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 999px; margin-left: 16rpx; }
.tag.ship { background:#ECFDF5; color:#16A34A; }
.tag.recv { background:#DBEAFE; color:#2563EB; }
.time { color:#999; font-size: 22rpx; margin-left:auto; }
.nums { display:flex; gap: 24rpx; padding: 12rpx 0; color: #333; font-size: 26rpx; }
.driver { color:#888; font-size: 22rpx; }
</style>
