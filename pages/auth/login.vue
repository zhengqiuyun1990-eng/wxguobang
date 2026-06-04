<template>
	<view class="page">
		<view class="title">手机号 + 验证码</view>
		<view class="sub">未注册手机号将自动创建账号</view>

		<view class="form">
			<view class="row">
				<text class="lbl">手机号</text>
				<input class="ipt" type="number" maxlength="11" placeholder="请输入手机号" v-model="phone" />
			</view>
			<view class="row">
				<text class="lbl">验证码</text>
				<input class="ipt" type="number" maxlength="6" placeholder="6 位验证码" v-model="code" />
				<text class="send" :class="{disabled: counting>0}" @tap="sendCode">{{ counting>0 ? counting+'s' : '获取' }}</text>
			</view>
		</view>

		<button class="primary" @tap="submit">登录 / 注册</button>
		<view class="hint">演示环境：验证码任意 6 位即可</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return { phone: '', code: '', counting: 0, timer: null } },
	methods: {
		sendCode() {
			if (!/^1\d{10}$/.test(this.phone)) return uni.showToast({ title: '手机号格式错误', icon: 'none' })
			if (this.counting > 0) return
			this.counting = 60
			this.timer = setInterval(() => {
				this.counting--
				if (this.counting <= 0) clearInterval(this.timer)
			}, 1000)
			uni.showToast({ title: '验证码已发送', icon: 'success' })
		},
		submit() {
			if (!/^1\d{10}$/.test(this.phone)) return uni.showToast({ title: '手机号格式错误', icon: 'none' })
			if (!/^\d{6}$/.test(this.code)) return uni.showToast({ title: '请输入6位验证码', icon: 'none' })
			db.loginByPhone(this.phone)
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => uni.navigateBack(), 600)
		}
	}
}
</script>

<style lang="scss">
.page { padding: 48rpx 40rpx; }
.title { font-size: 44rpx; font-weight: 700; color: #111; }
.sub { font-size: 24rpx; color: #999; margin-top: 8rpx; }
.form { background: #fff; border-radius: 20rpx; margin-top: 40rpx; padding: 0 28rpx; }
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.row:last-child { border-bottom: none; }
.lbl { width: 140rpx; color: #333; font-size: 28rpx; }
.ipt { flex:1; font-size: 28rpx; }
.send { color: #4ADE80; font-size: 26rpx; padding-left: 20rpx; }
.send.disabled { color: #bbb; }
.primary {
	margin-top: 60rpx; background: #4ADE80; color: #fff;
	border-radius: 999px; font-size: 30rpx; font-weight: 600;
	padding: 20rpx 0;
}
.hint { text-align:center; color:#bbb; font-size:22rpx; margin-top: 24rpx; }
</style>
