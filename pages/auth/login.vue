<template>
	<view class="page">
		<view class="title">手机号登录</view>
		<view class="sub">输入手机号即可登录（测试环境，无需验证码）</view>

		<view class="form">
			<view class="row">
				<text class="lbl">手机号</text>
				<input class="ipt" type="number" maxlength="11" placeholder="请输入手机号" v-model="phone" />
			</view>
		</view>

		<button class="primary" :disabled="loading" @tap="submit">{{ loading ? '登录中...' : '登录' }}</button>
	</view>
</template>

<script>
import { api } from '@/utils/request.js'
import { applyLoginUser } from '@/utils/store.js'
export default {
	data() { return { phone: '', loading: false } },
	methods: {
		async submit() {
			if (!/^1\d{10}$/.test(this.phone)) return uni.showToast({ title: '手机号格式错误', icon: 'none' })
			this.loading = true
			try {
				const res = await api.login(this.phone)
				applyLoginUser(this.phone, res)
				uni.showToast({ title: '登录成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 600)
			} catch (e) {}
			finally { this.loading = false }
		}
	}
}
</script>

<style lang="scss">
.page { padding: 48rpx 40rpx; }
.title { font-size: 44rpx; font-weight: 700; color: #111; }
.sub { font-size: 24rpx; color: #999; margin-top: 8rpx; }
.form { background: #fff; border-radius: 20rpx; margin-top: 40rpx; padding: 0 28rpx; }
.row { display:flex; align-items:center; padding: 28rpx 0; }
.lbl { width: 140rpx; color: #333; font-size: 28rpx; }
.ipt { flex:1; font-size: 28rpx; }
.primary {
	margin-top: 60rpx; background: #4ADE80; color: #fff;
	border-radius: 999px; font-size: 30rpx; font-weight: 600;
	padding: 20rpx 0;
}
</style>
