<template>
	<view class="page">
		<view class="ok">✓</view>
		<text class="title">项目创建成功</text>
		<text class="sub">项目编号</text>
		<text class="no">{{ no }}</text>

		<view class="qr-section">
			<text class="qr-title">项目专属二维码</text>
			<text class="qr-hint">司机扫码可直接进入磅单上传</text>
			<canvas canvas-id="qrCanvas" class="qr-canvas" style="width:400rpx;height:400rpx;" />
			<button class="save-btn" @tap="saveQr">保存到相册</button>
		</view>

		<view class="actions">
			<button class="primary" @tap="goHome">返回首页</button>
			<button class="ghost" @tap="goDetail">查看项目</button>
		</view>
	</view>
</template>

<script>
import { drawQr } from '@/utils/qrcode.js'
export default {
	data() { return { no: '', id: '' } },
	onLoad(q) {
		this.no = q.no
		this.id = q.id
	},
	onReady() {
		const content = 'project_id=' + this.no
		drawQr(this, 'qrCanvas', content, 200)
	},
	methods: {
		goHome() { uni.switchTab({ url: '/pages/index/index' }) },
		goDetail() { uni.redirectTo({ url: '/pages/mine/projectDetail?id=' + this.id }) },
		saveQr() {
			uni.canvasToTempFilePath({
				canvasId: 'qrCanvas',
				success: (res) => {
					uni.saveImageToPhotosAlbum({
						filePath: res.tempFilePath,
						success: () => uni.showToast({ title: '已保存', icon: 'success' }),
						fail: () => uni.showToast({ title: '保存失败', icon: 'none' })
					})
				},
				fail: () => uni.showToast({ title: '生成图片失败', icon: 'none' })
			}, this)
		}
	}
}
</script>

<style lang="scss">
.page { min-height: 100vh; padding: 60rpx 40rpx; display:flex; flex-direction:column; align-items:center; }
.ok {
	width: 140rpx; height: 140rpx; border-radius: 50%;
	background: #4ADE80; color:#fff; font-size: 80rpx;
	display:flex; align-items:center; justify-content:center;
	box-shadow: 0 12rpx 40rpx rgba(74,222,128,.4);
}
.title { font-size: 36rpx; font-weight: 700; margin-top: 24rpx; color:#111; }
.sub { color:#888; font-size: 24rpx; margin-top: 24rpx; }
.no { font-size: 52rpx; font-weight: 800; color: #16A34A; letter-spacing: 8rpx; margin-top: 4rpx; }
.qr-section { margin-top: 40rpx; display: flex; flex-direction: column; align-items: center; }
.qr-title { font-size: 28rpx; font-weight: 600; color: #111; }
.qr-hint { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.qr-canvas { margin-top: 20rpx; background: #fff; border-radius: 16rpx; }
.save-btn { margin-top: 16rpx; font-size: 24rpx; color: #16A34A; background: #ECFDF5; border-radius: 999px; padding: 12rpx 40rpx; }
.actions { width: 100%; margin-top: 60rpx; display:flex; flex-direction:column; gap: 24rpx; }
.primary { background:#4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 20rpx 0; font-weight: 600; }
.ghost { background:#fff; color:#16A34A; border: 1rpx solid #4ADE80; border-radius: 999px; font-size: 30rpx; padding: 20rpx 0; }
</style>
