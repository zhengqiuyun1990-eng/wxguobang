<template>
	<view class="page">
		<!-- 项目信息 -->
		<view class="proj-bar" v-if="projectName || projectId">
			<text class="pb-name">{{ projectName || ('项目 #' + projectId) }}</text>
			<text class="pb-fee">{{ fee > 0 ? '¥' + fee + '/单' : '免费项目' }}</text>
		</view>
		<!-- 类型切换 -->
		<view class="type-switch">
			<view class="ts-item" :class="{ active: type === 'ship' }" @tap="type='ship'">发货磅单</view>
			<view class="ts-item" :class="{ active: type === 'recv' }" @tap="type='recv'">收货磅单</view>
		</view>

		<view class="card">
			<view class="ct">磅单照片</view>
			<view class="img-wrap" @tap="pickBill">
				<image v-if="billImg" :src="billImg" mode="aspectFill" class="img" />
				<view v-else class="ph">+ 上传磅单照片</view>
			</view>
			<view class="ct" style="margin-top: 24rpx;">地址照片（拍照）</view>
			<view class="img-wrap" @tap="pickPlace">
				<image v-if="placeImg" :src="placeImg" mode="aspectFill" class="img" />
				<view v-else class="ph">拍照</view>
			</view>
		</view>

		<view class="card">
			<view class="row">
				<text class="lbl">车牌号</text>
				<picker v-if="plates.length > 0" :range="plateOptions" @change="onPickPlate">
					<view class="ipt plate-picker">
						<text>{{ form.plate || '请选择车牌' }}</text>
						<text class="arr">›</text>
					</view>
				</picker>
				<input v-else class="ipt" placeholder="请输入车牌号" v-model="form.plate" />
			</view>
			<view class="plate-actions" v-if="plates.length > 0">
				<text class="pa-btn" @tap="addNewPlate">＋ 添加新车牌</text>
				<text class="pa-btn del" @tap="removePlate">删除当前</text>
			</view>
			<view class="row">
				<text class="lbl">毛重(t)</text>
				<input class="ipt" type="digit" v-model.number="form.gross" />
			</view>
			<view class="row">
				<text class="lbl">皮重(t)</text>
				<input class="ipt" type="digit" v-model.number="form.tare" />
			</view>
			<view class="row">
				<text class="lbl">净重(t)</text>
				<input class="ipt" type="digit" v-model.number="form.net" />
				<text class="auto" @tap="autoNet">自动</text>
			</view>
		</view>

		<button class="primary" :disabled="submitting" @tap="submit">{{ submitting ? '提交中...' : '确认上传' }}</button>
	</view>
</template>

<script>
import { requireLogin } from '@/utils/store.js'
import { api, uploadFile } from '@/utils/request.js'
import { parseProjectRow } from '@/utils/api-util.js'
import { getVehicles, addVehicle, removeVehicle } from '@/utils/vehicles.js'

export default {
	data() { return {
		projectId: '', type: 'ship', fee: 0, projectName: '',
		billImg: '', placeImg: '',
		form: { plate: '', gross: '', tare: '', net: '' },
		plates: [],
		submitting: false
	} },
	computed: {
		plateOptions() { return this.plates.map(p => p) }
	},
	async onLoad(q) {
		if (!requireLogin()) return
		this.projectId = q.project_id || q.pid || ''
		if (q.type) this.type = q.type
		this.fee = Number(q.fee) || 0
		this.plates = getVehicles()
		if (this.plates.length > 0) this.form.plate = this.plates[0]
		// 从后端获取项目详情（真实 fee）
		if (this.projectId) {
			try {
				const res = await api.projectInfo(this.projectId)
				const row = parseProjectRow(res && res.row ? res.row : res)
				if (row) {
					this.fee = row.driverFee || this.fee
					this.projectName = row.title || ''
				}
			} catch (e) { /* 后端不可用时用传入的 fee */ }
		}
	},
	methods: {
		onPickPlate(e) {
			this.form.plate = this.plates[e.detail.value]
		},
		addNewPlate() {
			uni.showModal({
				title: '添加新车牌',
				editable: true,
				placeholderText: '请输入车牌号',
				success: (res) => {
					if (res.confirm && res.content && res.content.trim()) {
						const r = addVehicle(res.content)
						if (!r.ok) return uni.showToast({ title: r.msg, icon: 'none' })
						this.plates = r.list
						this.form.plate = r.plate
					}
				}
			})
		},
		removePlate() {
			if (!this.form.plate) return
			this.plates = removeVehicle(this.form.plate)
			this.form.plate = this.plates.length > 0 ? this.plates[0] : ''
		},
		pickBill() {
			uni.chooseImage({ count: 1, success: r => this.billImg = r.tempFilePaths[0] })
		},
		pickPlace() {
			uni.chooseImage({ count: 1, sourceType: ['camera'], success: r => this.placeImg = r.tempFilePaths[0] })
		},
		autoNet() {
			const g = Number(this.form.gross||0), t = Number(this.form.tare||0)
			this.form.net = +(g - t).toFixed(2)
		},
		afterSubmit() {
			if (this.type === 'recv') {
				uni.showToast({ title: '上传成功，请评分', icon: 'success' })
				setTimeout(() => {
					uni.redirectTo({ url: `/pages/project/rate?project_id=${this.projectId}` })
				}, 600)
				return
			}
			uni.showModal({
				title: '发货单已上传',
				content: '请继续上传收货磅单',
				confirmText: '去上传收货单',
				cancelText: '稍后',
				success: (r) => {
					if (r.confirm) {
						uni.redirectTo({ url: `/pages/driver/upload?project_id=${this.projectId}&type=recv` })
					} else {
						uni.navigateTo({ url: `/pages/driver/project?id=${this.projectId}` })
					}
				}
			})
		},
		async submit() {
			if (this.submitting) return
			if (!this.projectId) return uni.showToast({ title: '项目编号缺失', icon: 'none' })
			if (!this.billImg) return uni.showToast({ title: '请上传磅单照片', icon: 'none' })
			if (!this.placeImg) return uni.showToast({ title: '请上传地址照片', icon: 'none' })
			if (!this.form.plate) return uni.showToast({ title: '请选择或输入车牌号', icon: 'none' })
			if (!this.form.gross || !this.form.tare || !this.form.net)
				return uni.showToast({ title: '请填写毛/皮/净重', icon: 'none' })

			// 自动绑定车牌
			const bind = addVehicle(this.form.plate)
			if (!bind.ok) return uni.showToast({ title: bind.msg, icon: 'none' })
			this.plates = bind.list
			this.form.plate = bind.plate

			// 如果有费用，跳支付页
			if (this.fee > 0) {
				const data = encodeURIComponent(JSON.stringify({
					pid: this.projectId, type: this.type, fee: this.fee,
					plate: this.form.plate, gross: this.form.gross, tare: this.form.tare, net: this.form.net,
					billImg: this.billImg, placeImg: this.placeImg
				}))
				return uni.navigateTo({ url: '/pages/driver/pay?data=' + data })
			}

			// 免费项目直接提交
			this.submitting = true
			uni.showLoading({ title: '上传中...' })
			try {
				const [weight_pic, addr_pic] = await Promise.all([
					uploadFile(this.billImg),
					uploadFile(this.placeImg)
				])
				const payload = {
					project_id: this.projectId,
					weight_pic,
					addr_pic,
					number: this.form.plate,
					gross: this.form.gross,
					tare: this.form.tare,
					net: this.form.net
				}
				if (this.type === 'ship') await api.updateHairInfo(payload)
				else await api.updateReceiveInfo(payload)
				uni.hideLoading()
				this.afterSubmit()
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
.page { padding: 24rpx; padding-bottom: 60rpx; }
.proj-bar { display:flex; align-items:center; justify-content:space-between; background: linear-gradient(135deg,#4ADE80,#16A34A); color:#fff; border-radius: 16rpx; padding: 20rpx 28rpx; margin-bottom: 16rpx; }
.pb-name { font-size: 28rpx; font-weight: 700; }
.pb-fee { font-size: 26rpx; font-weight: 700; background: rgba(255,255,255,.25); padding: 4rpx 18rpx; border-radius: 999px; }
.type-switch { display: flex; background: #fff; border-radius: 16rpx; overflow: hidden; margin-bottom: 12rpx; }
.ts-item { flex: 1; text-align: center; padding: 22rpx 0; font-size: 28rpx; color: #666; font-weight: 600; }
.ts-item.active { background: #4ADE80; color: #fff; }
.card { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 24rpx 28rpx; }
.ct { font-size: 26rpx; color:#666; margin-bottom: 16rpx; }
.img-wrap { width: 100%; height: 280rpx; background:#F5F7FA; border-radius: 16rpx; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.img { width: 100%; height: 100%; }
.ph { color:#999; font-size: 26rpx; }
.row { display:flex; align-items:center; padding: 24rpx 0; border-bottom: 1rpx solid #F5F7FA; }
.row:last-child { border-bottom: none; }
.lbl { width: 160rpx; font-size: 28rpx; color: #333; }
.ipt { flex:1; font-size: 28rpx; }
.plate-picker { display: flex; align-items: center; justify-content: space-between; }
.arr { color: #ccc; font-size: 32rpx; }
.plate-actions { display: flex; justify-content: flex-end; gap: 24rpx; padding: 8rpx 0 16rpx; }
.pa-btn { font-size: 24rpx; color: #16A34A; }
.pa-btn.del { color: #ef4444; }
.auto { color:#16A34A; font-size: 24rpx; padding-left: 16rpx; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 22rpx 0; font-weight: 600; }
</style>
