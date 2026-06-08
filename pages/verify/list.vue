<template>
	<view class="page">
		<view class="empty" v-if="!loading && !pending"><text>暂无待核对磅单</text></view>
		<view class="card" v-if="pending" @tap="enter">
			<view class="head">
				<text class="plate">{{ pending.number || '项目磅单' }}</text>
				<text class="tag" :class="role">{{ role === 'ship' ? '发货' : '收货' }}</text>
			</view>
			<view class="nums">
				<text>毛 {{ pending.gross }}t</text>
				<text>皮 {{ pending.tare }}t</text>
				<text>净 {{ pending.net }}t</text>
			</view>
			<text class="tip">点击核对数据</text>
		</view>
	</view>
</template>

<script>
import { requireLogin } from '@/utils/store.js'
import { api } from '@/utils/request.js'
import { pickWeightBlock, isBlockPending, remoteProjectId } from '@/utils/api-util.js'

export default {
	data() { return { pid: '', role: '', pending: null, loading: true } },
	onLoad(q) {
		this.pid = remoteProjectId(q.pid || q.project_id || '')
		this.role = q.role || 'ship'
	},
	onShow() {
		if (!requireLogin()) return
		this.load()
	},
	methods: {
		async load() {
			if (!this.pid) return
			this.loading = true
			try {
				const res = await api.projectInfo(this.pid)
				const row = res && (res.row || res)
				const block = this.role === 'ship' ? row && row.hair : row && row.receive
				if (block && isBlockPending(block)) {
					this.pending = pickWeightBlock(row, this.role)
				} else {
					this.pending = null
				}
			} catch (e) {
				this.pending = null
			} finally {
				this.loading = false
			}
		},
		enter() {
			uni.navigateTo({ url: `/pages/verify/detail?project_id=${this.pid}&role=${this.role}` })
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
.nums { display:flex; gap: 24rpx; padding: 12rpx 0; color: #333; font-size: 26rpx; }
.tip { color:#16A34A; font-size: 22rpx; }
</style>
