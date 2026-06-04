<template>
	<view class="page">
		<view class="hero">
			<text class="hero-icon">🚚</text>
			<text class="hero-title">司机上传磅单</text>
			<text class="hero-sub">扫码或输入项目编号，进入磅单上传</text>
		</view>

		<view class="input-area">
			<input class="ipt" type="number" placeholder="输入项目编号" v-model="projectNo" @confirm="goByNo" />
			<button class="go-btn" @tap="goByNo">进入</button>
		</view>

		<view class="divider"><text class="divider-text">或</text></view>

		<button class="scan-btn" @tap="scan">📷 扫码进入项目</button>
	</view>
</template>

<script>
export default {
	data() { return { projectNo: '' } },
	methods: {
		goByNo() {
			const no = this.projectNo.trim()
			if (!no) return uni.showToast({ title: '请输入项目编号', icon: 'none' })
			this.goUpload(no)
		},
		goUpload(no, fee = 0) {
			uni.navigateTo({ url: `/pages/driver/upload?project_id=${no}&fee=${fee}` })
		},
		scan() {
			uni.scanCode({
				onlyFromCamera: false,
				scanType: ['qrCode'],
				success: (res) => {
					const val = res.result || ''
					const match = val.match(/project_id=(\d+)/)
					if (match) {
						this.goUpload(match[1])
					} else if (/^\d+$/.test(val)) {
						this.goUpload(val)
					} else {
						uni.showToast({ title: '无法识别的二维码', icon: 'none' })
					}
				},
				fail: () => {
					uni.showToast({ title: '扫码已取消', icon: 'none' })
				}
			})
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; min-height: 100vh; background: #f7f8fa; }
.hero { text-align: center; padding: 80rpx 0 40rpx; }
.hero-icon { font-size: 80rpx; }
.hero-title { display: block; font-size: 36rpx; font-weight: 700; color: #111; margin-top: 16rpx; }
.hero-sub { display: block; font-size: 24rpx; color: #999; margin-top: 8rpx; }
.input-area { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 12rpx 16rpx; margin-top: 40rpx; }
.ipt { flex: 1; font-size: 30rpx; height: 72rpx; }
.go-btn { background: #4ADE80; color: #fff; font-size: 28rpx; border-radius: 12rpx; padding: 0 36rpx; height: 72rpx; line-height: 72rpx; margin-left: 16rpx; font-weight: 600; }
.divider { text-align: center; margin: 40rpx 0; position: relative; }
.divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 1rpx solid #e5e5e5; }
.divider-text { position: relative; background: #f7f8fa; padding: 0 24rpx; color: #bbb; font-size: 24rpx; }
.scan-btn { background: #fff; color: #16A34A; font-size: 30rpx; border-radius: 16rpx; padding: 28rpx 0; font-weight: 600; border: 2rpx solid #4ADE80; }
</style>
