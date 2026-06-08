<template>
	<view class="page">
		<view class="header">
			<view class="avatar">{{ avatarChar }}</view>
			<view class="info">
				<text class="name">{{ user ? user.nickname : '未登录' }}</text>
				<text class="phone">{{ user ? user.phone : '点击登录 / 注册' }}</text>
			</view>
			<text class="login-btn" v-if="!user" @tap="goLogin">登录</text>
			<text class="login-btn" v-else @tap="logout">退出</text>
		</view>

		<view class="stat-card" v-if="user">
			<view class="stat-item">
				<text class="sn">¥{{ user.totalPiece.toFixed(2) }}</text>
				<text class="sl">累计计件</text>
			</view>
			<view class="vline" />
			<view class="stat-item">
				<text class="sn">{{ user.score }}</text>
				<text class="sl">星级积分</text>
			</view>
		</view>

		<view class="menu">
			<view class="m-row" @tap="go('/pages/mine/piecework')">
				<text class="m-l">件</text><text class="m-t">我的计件</text><text class="m-r">›</text>
			</view>
			<view class="m-row" @tap="go('/pages/mine/score')">
				<text class="m-l">评</text><text class="m-t">我的服务评分</text><text class="m-r">›</text>
			</view>
			<view class="m-row" @tap="go('/pages/mine/projects')">
				<text class="m-l">项</text><text class="m-t">我的项目</text><text class="m-r">›</text>
			</view>
			<view class="m-row" @tap="go('/pages/mine/vehicles')">
				<text class="m-l">车</text><text class="m-t">我的车辆</text><text class="m-r">›</text>
			</view>
			<view class="m-row" @tap="go('/pages/mine/applications')">
				<text class="m-l">申</text><text class="m-t">收到的申请</text><text class="m-r">›</text>
			</view>
			<view class="m-row" @tap="go('/pages/join/joined')">
				<text class="m-l">加</text><text class="m-t">已加入的项目</text><text class="m-r">›</text>
			</view>
			<view class="m-row" @tap="go('/pages/mine/service')">
				<text class="m-l">服</text><text class="m-t">客服</text><text class="m-r">›</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
import { api } from '@/utils/request.js'
export default {
	data() { return { user: null } },
	computed: {
		avatarChar() { return this.user ? (this.user.nickname || this.user.phone).slice(-2) : '游' }
	},
	async onShow() {
		this.user = db.currentUser()
		if (!this.user) return
		const fresh = db.allUsers().find(u => u.id === this.user.id)
		if (fresh) { this.user = fresh; db.setCurrentUser(fresh) }
		try {
			const info = await api.getUserInfo()
			if (info) {
				const next = {
					...this.user,
					nickname: info.nickname || info.name || this.user.nickname,
					score: info.score != null ? info.score : this.user.score,
					totalPiece: info.total_piece != null ? info.total_piece : (info.totalPiece != null ? info.totalPiece : this.user.totalPiece)
				}
				db.setCurrentUser(next)
				db.upsertUser(next)
				this.user = next
			}
		} catch (e) {}
	},
	methods: {
		goLogin() { uni.navigateTo({ url: '/pages/auth/login' }) },
		logout() {
			uni.showModal({ title: '退出登录', content: '确定要退出吗？', success: r => {
				if (r.confirm) { db.logout(); this.user = null }
			}})
		},
		go(url) {
			if (!this.user) return this.goLogin()
			uni.navigateTo({ url })
		}
	}
}
</script>

<style lang="scss">
.page { min-height: 100vh; background: #F5F7FA; padding-bottom: 40rpx; }
.header {
	background: linear-gradient(180deg, #4ADE80 0%, #22C55E 100%);
	padding: 60rpx 40rpx 100rpx; color:#fff;
	display:flex; align-items:center;
}
.avatar {
	width: 110rpx; height: 110rpx; border-radius: 50%;
	background: rgba(255,255,255,.25); display:flex; align-items:center; justify-content:center;
	font-size: 36rpx; font-weight: 700;
}
.info { flex:1; margin-left: 24rpx; }
.name { font-size: 34rpx; font-weight: 700; display:block; }
.phone { font-size: 24rpx; opacity:.85; display:block; margin-top: 6rpx; }
.login-btn {
	background: rgba(255,255,255,.25); padding: 10rpx 24rpx; border-radius: 999px; font-size: 24rpx;
}
.stat-card {
	margin: -50rpx 24rpx 0; background: #fff; border-radius: 20rpx; padding: 30rpx 0;
	display:flex; align-items:center; justify-content: space-around;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06);
}
.stat-item { display:flex; flex-direction:column; align-items:center; }
.sn { font-size: 34rpx; font-weight: 700; color: #16A34A; }
.sl { font-size: 22rpx; color: #888; margin-top: 4rpx; }
.vline { width:1rpx; height: 56rpx; background: #eee; }
.menu { margin: 24rpx; background: #fff; border-radius: 20rpx; overflow:hidden; }
.m-row {
	display:flex; align-items:center; padding: 28rpx 32rpx; border-bottom: 1rpx solid #f5f5f5;
}
.m-row:last-child { border-bottom: none; }
.m-l {
	font-size: 28rpx; width: 60rpx; height: 60rpx; border-radius: 12rpx;
	background: #ECFDF5; color: #16A34A; font-weight: 700;
	display: flex; align-items: center; justify-content: center;
}
.m-t { flex:1; font-size: 28rpx; color:#333; margin-left: 8rpx; }
.m-r { color: #ccc; font-size: 32rpx; }
</style>
