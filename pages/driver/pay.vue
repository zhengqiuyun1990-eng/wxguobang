<template>
	<view class="page">
		<view class="amount-card">
			<text class="lbl">应支付</text>
			<text class="amt">¥ {{ fee.toFixed(2) }}</text>
			<text class="sub">{{ fee > 0 ? '服务费 · 平台核验保障' : '免费项目' }}</text>
		</view>

		<view class="card">
			<view class="row"><text class="lbl">车号</text><text class="val">{{ form.plate }}</text></view>
			<view class="row"><text class="lbl">毛重</text><text class="val">{{ form.gross }} t</text></view>
			<view class="row"><text class="lbl">皮重</text><text class="val">{{ form.tare }} t</text></view>
			<view class="row"><text class="lbl">净重</text><text class="val">{{ form.net }} t</text></view>
		</view>

		<view class="pay-method">
			<view class="pm" :class="{active: method==='wechat'}" @tap="method='wechat'">
				<text class="pi">💚</text><text class="pt">微信支付</text>
				<text class="check">{{ method==='wechat' ? '✓' : '' }}</text>
			</view>
			<view class="pm" :class="{active: method==='alipay'}" @tap="method='alipay'">
				<text class="pi">💙</text><text class="pt">支付宝</text>
				<text class="check">{{ method==='alipay' ? '✓' : '' }}</text>
			</view>
		</view>

		<button class="primary" @tap="pay">{{ fee > 0 ? '确认支付 ¥' + fee.toFixed(2) : '确认提交（免费）' }}</button>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
import { api, uploadFile } from '@/utils/request.js'
export default {
	data() { return { form: {}, method: 'wechat', pid: '', billImg: '', placeImg: '', fee: 10 } },
	onLoad(q) {
		const data = JSON.parse(decodeURIComponent(q.data || '{}'))
		this.form = data
		this.billImg = data.billImg || ''
		this.placeImg = data.placeImg || ''
		this.pid = data.pid || data.project_id || ''
		this.fee = Number(data.fee) || 0
	},
	methods: {
		async pay() {
			uni.showLoading({ title: this.fee > 0 ? '支付中...' : '提交中...' })
			try {
				const [weight_pic, addr_pic] = await Promise.all([
					uploadFile(this.billImg),
					uploadFile(this.placeImg)
				])
				const payload = {
					project_id: this.pid,
					weight_pic,
					addr_pic,
					number: this.form.plate,
					gross: this.form.gross,
					tare: this.form.tare,
					net: this.form.net
				}
				if (this.form.type === 'recv') await api.updateReceiveInfo(payload)
				else await api.updateHairInfo(payload)
				uni.hideLoading()
				const u = db.currentUser()
				if (u) {
					db.addBill({
						id: 'B' + Date.now(),
						projectId: this.pid,
						driverId: u.id,
						driverName: u.nickname,
						driverPhone: u.phone,
						type: this.form.type || 'ship',
						plate: this.form.plate,
						gross: this.form.gross,
						tare: this.form.tare,
						net: this.form.net,
						billImg: this.billImg,
						placeImg: this.placeImg,
						createdAt: Date.now(),
						paid: this.fee,
						shipVerified: false,
						recvVerified: false,
						recv: null
					})
				}
				uni.showModal({
					title: this.fee > 0 ? '缴费成功' : '提交成功',
					content: '磅单已上传',
					confirmText: '返回首页',
					cancelText: '继续操作',
					success: (r) => {
						if (r.confirm) uni.switchTab({ url: '/pages/index/index' })
						else uni.navigateBack({ delta: 2 })
					}
				})
			} catch (e) {
				uni.hideLoading()
			}
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.amount-card { background: linear-gradient(135deg,#4ADE80,#16A34A); color:#fff; border-radius: 20rpx; padding: 60rpx; display:flex; flex-direction:column; align-items:center; }
.amount-card .lbl { font-size: 24rpx; opacity:.85; }
.amt { font-size: 84rpx; font-weight: 800; margin-top: 8rpx; }
.sub { font-size: 22rpx; opacity:.85; margin-top: 8rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 0 28rpx; margin-top: 24rpx; }
.row { display:flex; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.row:last-child { border-bottom: none; }
.row .lbl { width: 160rpx; color:#666; font-size: 26rpx; }
.val { flex:1; color:#111; font-size: 28rpx; font-weight: 600; }
.pay-method { background:#fff; border-radius: 20rpx; margin-top: 24rpx; }
.pm { display:flex; align-items:center; padding: 28rpx; border-bottom: 1rpx solid #f5f5f5; }
.pm:last-child { border-bottom: none; }
.pi { font-size: 32rpx; }
.pt { flex:1; padding-left: 20rpx; font-size: 28rpx; color:#111; }
.check { color: #4ADE80; font-size: 32rpx; font-weight: 700; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 32rpx; padding: 22rpx 0; font-weight: 600; }
</style>
