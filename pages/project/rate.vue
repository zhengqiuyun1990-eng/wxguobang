<template>
	<view class="page" v-if="ready">
		<view class="step">服务评分</view>
		<text class="hint">请对过磅服务进行评分（1-5 星）</text>

		<view class="card" v-if="needShip">
			<text class="ct">发货过磅服务</text>
			<view class="rate-row">
				<text class="rl">评分</text>
				<uni-rate v-model="shipScore" :max="5" />
			</view>
		</view>

		<view class="card" v-if="needRecv">
			<text class="ct">收货过磅服务</text>
			<view class="rate-row">
				<text class="rl">评分</text>
				<uni-rate v-model="recvScore" :max="5" />
			</view>
		</view>

		<button class="primary" :disabled="submitting" @tap="submit">
			{{ submitting ? '提交中...' : '提交评分' }}
		</button>
	</view>
</template>

<script>
import { requireLogin } from '@/utils/store.js'
import { api } from '@/utils/request.js'

export default {
	data() {
		return {
			projectId: '',
			needShip: false,
			needRecv: false,
			shipScore: 5,
			recvScore: 5,
			submitting: false,
			ready: false
		}
	},
	async onLoad(q) {
		if (!requireLogin()) return
		this.projectId = q.project_id || q.pid || ''
		if (!this.projectId) return uni.showToast({ title: '项目编号缺失', icon: 'none' })
		await this.loadState()
	},
	methods: {
		async loadState() {
			try {
				const res = await api.projectInfo(this.projectId)
				const row = res && (res.row || res)
				const hasBlock = b => b && (b.number || b.net || b['净重'])
				this.needShip = !!(row && hasBlock(row.hair))
				this.needRecv = !!(row && hasBlock(row.receive))
				if (!this.needShip && !this.needRecv) {
					uni.showToast({ title: '暂无需评分', icon: 'none' })
					setTimeout(() => uni.navigateBack(), 800)
					return
				}
				this.ready = true
			} catch (e) {
				uni.showToast({ title: '加载项目失败', icon: 'none' })
			}
		},
		async submit() {
			if (this.submitting) return
			if (this.needShip && !this.shipScore) return uni.showToast({ title: '请为发货服务评分', icon: 'none' })
			if (this.needRecv && !this.recvScore) return uni.showToast({ title: '请为收货服务评分', icon: 'none' })
			this.submitting = true
			uni.showLoading({ title: '提交中...' })
			try {
				if (this.needShip) await api.evaluate(this.projectId, 's', this.shipScore)
				if (this.needRecv) await api.evaluate(this.projectId, 'r', this.recvScore)
				uni.hideLoading()
				uni.showToast({ title: '评分成功', icon: 'success' })
				setTimeout(() => {
					uni.showModal({
						title: '下一步',
						content: '评分完成，过磅人可在「已加入的项目」中核对磅单',
						showCancel: false,
						success: () => uni.switchTab({ url: '/pages/index/index' })
					})
				}, 500)
			} catch (e) {
				uni.hideLoading()
			} finally {
				this.submitting = false
			}
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.step { font-size: 24rpx; color:#16A34A; padding: 8rpx 16rpx; background:#ECFDF5; display:inline-block; border-radius: 999px; }
.hint { display:block; color:#888; font-size: 24rpx; margin: 16rpx 0 24rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 24rpx; }
.ct { font-size: 28rpx; font-weight: 700; color:#111; margin-bottom: 16rpx; display:block; }
.rate-row { display:flex; align-items:center; }
.rl { width: 120rpx; font-size: 26rpx; color:#666; }
.primary { margin-top: 16rpx; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 22rpx 0; font-weight: 600; }
</style>
