<template>
	<view class="page">
		<view class="hero" :style="{ paddingTop: statusH + 'px' }">
			<view class="hero-bar">
				<view class="hero-text">
					<text class="hero-title">过磅对账</text>
					<text class="hero-sub">磅票双向核验 · 自动核算损耗</text>
				</view>
				<view class="scan-btn" @tap="scan">
					<text class="scan-icon">扫</text>
					<text class="scan-lbl">扫一扫</text>
				</view>
			</view>
			<view class="hero-card">
				<view class="hc-item">
					<text class="hc-num">{{ stats.projects }}</text>
					<text class="hc-lbl">在运项目</text>
				</view>
				<view class="hc-divider" />
				<view class="hc-item">
					<text class="hc-num">{{ stats.bills }}</text>
					<text class="hc-lbl">磅票总数</text>
				</view>
				<view class="hc-divider" />
				<view class="hc-item">
					<text class="hc-num">{{ stats.verified }}</text>
					<text class="hc-lbl">已验票</text>
				</view>
			</view>
		</view>

		<view class="grid">
			<view class="grid-item" @tap="go('/pages/project/create', true)">
				<view class="g-icon" style="background:#ECFDF5;color:#059669">＋</view>
				<text class="g-title">创建项目</text>
				<text class="g-desc">建立独立项目空间</text>
			</view>
			<view class="grid-item" @tap="go('/pages/driver/search', true)">
				<view class="g-icon" style="background:#FEF3C7;color:#D97706">运</view>
				<text class="g-title">我是司机</text>
				<text class="g-desc">上传磅票/缴费</text>
			</view>
			<view class="grid-item" @tap="go('/pages/join/join', true)">
				<view class="g-icon" style="background:#DBEAFE;color:#2563EB">磅</view>
				<text class="g-title">加入项目</text>
				<text class="g-desc">发货/收货过磅人</text>
			</view>
			<view class="grid-item" @tap="go('/pages/print/print', true)">
				<view class="g-icon" style="background:#FCE7F3;color:#DB2777">单</view>
				<text class="g-title">打印对账单</text>
				<text class="g-desc">仅项目负责人</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db, requireLogin } from '@/utils/store.js'
export default {
	data() {
		return {
			statusH: 20,
			stats: { projects: 0, bills: 0, verified: 0 }
		}
	},
	onShow() {
		const sys = uni.getSystemInfoSync()
		this.statusH = sys.statusBarHeight || 20
		this.refresh()
	},
	methods: {
		refresh() {
			const projects = db.allProjects()
			const bills = db.allBills()
			this.stats = {
				projects: projects.length,
				bills: bills.length,
				verified: bills.filter(b => b.shipVerified || b.recvVerified).length
			}
		},
		go(url, needLogin) {
			if (needLogin && !requireLogin()) return
			uni.navigateTo({ url })
		},
		scan() {
			if (!requireLogin()) return
			uni.scanCode({
				onlyFromCamera: false,
				scanType: ['qrCode'],
				success: (res) => {
					const val = res.result || ''
					const match = val.match(/project_id=(\d+)/)
					if (match) {
						uni.navigateTo({ url: '/pages/driver/upload?project_id=' + match[1] })
					} else if (/^\d+$/.test(val)) {
						uni.navigateTo({ url: '/pages/driver/upload?project_id=' + val })
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
.page { min-height: 100vh; background: #F5F7FA; padding-bottom: 40rpx; }
.hero {
	background: linear-gradient(180deg, #4ADE80 0%, #22C55E 100%);
	padding: 0 32rpx 80rpx; color: #fff; position: relative;
}
.hero-bar { padding: 32rpx 0 24rpx; display: flex; align-items: flex-start; justify-content: space-between; }
.hero-text { flex: 1; }
.scan-btn {
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	background: rgba(255,255,255,.18);
	border: 1rpx solid rgba(255,255,255,.3);
	border-radius: 16rpx; padding: 12rpx 18rpx; min-width: 96rpx;
}
.scan-icon { font-size: 32rpx; font-weight: 700; color: #fff; line-height: 1; }
.scan-lbl { font-size: 20rpx; color: #fff; margin-top: 4rpx; opacity: .9; }
.hero-title { font-size: 44rpx; font-weight: 700; display:block; }
.hero-sub { font-size: 24rpx; opacity: .85; display:block; margin-top: 8rpx; }
.hero-card {
	margin-top: 16rpx;
	background: #fff; border-radius: 20rpx; padding: 28rpx 0;
	display:flex; align-items:center; justify-content: space-around;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06);
	color: #111;
}
.hc-item { display:flex; flex-direction:column; align-items:center; }
.hc-num { font-size: 40rpx; font-weight: 700; color: #16A34A; }
.hc-lbl { font-size: 22rpx; color: #666; margin-top: 4rpx; }
.hc-divider { width: 1rpx; height: 60rpx; background: #eee; }
.grid {
	margin: 24rpx 24rpx 0; padding: 24rpx;
	background: #fff; border-radius: 20rpx;
	display:flex; flex-wrap: wrap; gap: 16rpx 0;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,.04);
}
.grid-item { width: 25%; display:flex; flex-direction:column; align-items:center; padding: 16rpx 0; }
.g-icon {
	width: 96rpx; height: 96rpx; border-radius: 24rpx;
	display:flex; align-items:center; justify-content:center;
	font-size: 36rpx; font-weight: 600;
}
.g-title { font-size: 26rpx; color: #111; margin-top: 12rpx; font-weight: 600; }
.g-desc { font-size: 20rpx; color: #999; margin-top: 4rpx; }
</style>
