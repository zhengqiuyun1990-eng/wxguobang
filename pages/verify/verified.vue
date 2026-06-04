<template>
	<view class="page">
		<view class="tabs">
			<text class="tab" :class="{active: tab==='all'}" @tap="tab='all'">总览</text>
			<text class="tab" :class="{active: tab==='month'}" @tap="tab='month'">按年月</text>
			<text class="tab" :class="{active: tab==='day'}" @tap="tab='day'">按日期</text>
			<text class="tab" :class="{active: tab==='err'}" @tap="tab='err'">纠错</text>
		</view>

		<view class="card" v-if="tab==='all'">
			<view class="rr"><text>已验票总数</text><text class="hi">{{ list.length }}</text></view>
			<view class="rr"><text>累计净重</text><text class="hi">{{ totalNet.toFixed(2) }} t</text></view>
		</view>

		<view class="bill" v-for="b in filtered" :key="b.id">
			<view class="bh">
				<text class="plate">{{ b.plate }}</text>
				<text class="time">{{ formatTime(timeOf(b)) }}</text>
			</view>
			<view class="bn">
				<text>毛 {{ src(b).gross }}t</text>
				<text>皮 {{ src(b).tare }}t</text>
				<text>净 {{ src(b).net }}t</text>
				<text class="err" v-if="errOf(b)">已纠错</text>
			</view>
		</view>
		<view class="empty" v-if="filtered.length === 0">暂无数据</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return { pid: '', role: '', list: [], tab: 'all' } },
	computed: {
		filtered() {
			if (this.tab === 'err') return this.list.filter(b => this.errOf(b))
			return this.list
		},
		totalNet() {
			return this.list.reduce((s, b) => s + Number(this.src(b).net||0), 0)
		}
	},
	onLoad(q) { this.pid = q.pid; this.role = q.role },
	onShow() {
		const bills = db.billsOfProject(this.pid)
		this.list = bills.filter(b => this.role === 'ship' ? b.shipVerified : b.recvVerified)
	},
	methods: {
		src(b) { return this.role === 'ship' ? b : b.recv },
		errOf(b) { return this.role === 'ship' ? b.shipCorrected : b.recvCorrected },
		timeOf(b) { return this.role === 'ship' ? b.shipVerifiedAt : b.recvVerifiedAt },
		formatTime(t) {
			const d = new Date(t || 0)
			return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.tabs { display:flex; background:#fff; border-radius: 999px; padding: 8rpx; }
.tab { flex:1; text-align:center; padding: 16rpx; font-size: 26rpx; color:#666; border-radius: 999px; }
.tab.active { background:#4ADE80; color:#fff; font-weight: 600; }
.card { background:#fff; border-radius: 20rpx; padding: 28rpx; margin-top: 24rpx; }
.rr { display:flex; justify-content: space-between; padding: 12rpx 0; font-size: 28rpx; }
.hi { color:#16A34A; font-weight: 700; }
.bill { background:#fff; border-radius: 16rpx; padding: 20rpx 24rpx; margin-top: 16rpx; }
.bh { display:flex; align-items:center; }
.plate { font-size: 28rpx; font-weight: 700; }
.time { color:#999; font-size: 22rpx; margin-left: auto; }
.bn { display:flex; gap: 24rpx; margin-top: 8rpx; color:#333; font-size: 24rpx; }
.err { color:#ef4444; margin-left:auto; }
.empty { text-align:center; padding: 80rpx 0; color:#999; }
</style>
