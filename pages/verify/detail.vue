<template>
	<view class="page" v-if="weights">
		<view class="banner" :class="role">{{ role === 'ship' ? '发货站核对' : '收货站核对' }}</view>

		<view class="card" v-if="weights.weight_pic">
			<view class="ct">磅单照片</view>
			<image :src="imgUrl(weights.weight_pic)" mode="aspectFill" class="img" />
		</view>

		<view class="card">
			<view class="row"><text class="lbl">车号</text><text class="val">{{ weights.number }}</text></view>
			<view class="row"><text class="lbl">毛重</text><text class="val">{{ weights.gross }} t</text></view>
			<view class="row"><text class="lbl">皮重</text><text class="val">{{ weights.tare }} t</text></view>
			<view class="row"><text class="lbl">净重</text><text class="val">{{ weights.net }} t</text></view>
		</view>

		<view class="actions">
			<button class="ghost" @tap="correct">数据有误，纠错</button>
			<button class="primary" :disabled="submitting" @tap="confirm">{{ submitting ? '提交中...' : '已对账' }}</button>
		</view>
	</view>
</template>

<script>
import { requireLogin } from '@/utils/store.js'
import { api, imgUrl } from '@/utils/request.js'
import { pickWeightBlock, remoteProjectId } from '@/utils/api-util.js'

export default {
	data() { return { projectId: '', role: '', weights: null, submitting: false } },
	onLoad(q) {
		this.projectId = remoteProjectId(q.project_id || q.pid || '')
		this.role = q.role || 'ship'
	},
	onShow() {
		if (!requireLogin()) return
		this.load()
	},
	methods: {
		imgUrl,
		async load() {
			if (!this.projectId) return
			try {
				const res = await api.projectInfo(this.projectId)
				const row = res && (res.row || res)
				this.weights = pickWeightBlock(row, this.role)
				if (!this.weights) uni.showToast({ title: '暂无待核对数据', icon: 'none' })
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' })
			}
		},
		payloadFrom(w) {
			return {
				project_id: this.projectId,
				gross: String(w.gross),
				tare: String(w.tare),
				net: String(w.net)
			}
		},
		async submitCorrect(w) {
			this.submitting = true
			uni.showLoading({ title: '提交中...' })
			try {
				const payload = this.payloadFrom(w)
				if (this.role === 'ship') await api.correctHairInfo(payload)
				else await api.correctReceiveInfo(payload)
				uni.hideLoading()
				uni.showToast({ title: '核对成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 700)
			} catch (e) {
				uni.hideLoading()
			} finally {
				this.submitting = false
			}
		},
		confirm() {
			if (!this.weights) return
			this.submitCorrect(this.weights)
		},
		correct() {
			uni.showModal({
				title: '纠错',
				content: '请输入正确净重(t)',
				editable: true,
				placeholderText: '净重',
				success: async (r) => {
					if (!r.confirm || !r.content) return
					const newNet = Number(r.content)
					if (isNaN(newNet)) return uni.showToast({ title: '请输入有效数字', icon: 'none' })
					const w = { ...this.weights, net: newNet }
					await this.submitCorrect(w)
				}
			})
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.banner { padding: 24rpx; border-radius: 20rpx; color:#fff; font-size: 30rpx; font-weight: 700; }
.banner.ship { background: linear-gradient(135deg,#4ADE80,#16A34A); }
.banner.recv { background: linear-gradient(135deg,#60A5FA,#2563EB); }
.card { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 24rpx 28rpx; }
.ct { font-size: 26rpx; color:#666; margin-bottom: 16rpx; }
.img { width: 100%; height: 360rpx; border-radius: 16rpx; }
.row { display:flex; padding: 22rpx 0; border-bottom: 1rpx solid #F5F7FA; }
.row:last-child { border-bottom: none; }
.row .lbl { width: 160rpx; color:#666; font-size: 26rpx; }
.val { flex:1; color:#111; font-size: 28rpx; font-weight: 600; }
.actions { margin-top: 40rpx; display:flex; gap: 24rpx; }
.ghost { flex:1; background:#fff; color:#D97706; border:1rpx solid #FCD34D; border-radius: 999px; font-size: 28rpx; padding: 20rpx 0; }
.primary { flex:1; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 28rpx; padding: 20rpx 0; font-weight: 600; }
</style>
