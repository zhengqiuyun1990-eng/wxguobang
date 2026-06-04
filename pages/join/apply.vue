<template>
	<view class="page">
		<view class="step">{{ role === 'ship' ? '发货过磅人 申请' : '收货过磅人 申请' }}</view>

		<view class="card">
			<view class="row">
				<text class="lbl">选择项目</text>
				<picker :range="projects" range-key="display" @change="onPick">
					<text class="ipt">{{ picked ? picked.display : '请选择项目' }}</text>
				</picker>
			</view>
			<view class="row">
				<text class="lbl">姓名</text>
				<input class="ipt" placeholder="真实姓名" v-model="form.name" />
			</view>
			<view class="row">
				<text class="lbl">电话</text>
				<input class="ipt" type="number" maxlength="11" placeholder="联系电话" v-model="form.phone" />
			</view>
		</view>

		<button class="primary" @tap="submit">提交申请</button>
		<view class="hint">提交后等待项目创建人审批通过</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return {
		role: 'ship', allProjects: [], picked: null,
		form: { name: '', phone: '' }
	} },
	computed: {
		projects() { return this.allProjects.map(p => ({ ...p, display: `#${p.no} ${p.name}` })) }
	},
	onLoad(q) {
		this.role = q.role
		this.allProjects = db.allProjects()
		const u = db.currentUser()
		if (u) this.form.phone = u.phone
	},
	methods: {
		onPick(e) { this.picked = this.projects[e.detail.value] },
		submit() {
			if (!this.picked) return uni.showToast({ title: '请选择项目', icon: 'none' })
			if (!this.form.name) return uni.showToast({ title: '请输入姓名', icon: 'none' })
			if (!/^1\d{10}$/.test(this.form.phone)) return uni.showToast({ title: '手机号格式错误', icon: 'none' })
			const proj = db.getProject(this.picked.id)

			const u = db.currentUser()
			db.addApp({
				id: 'A' + Date.now(),
				projectId: proj.id,
				userId: u.id,
				role: this.role, // ship | recv
				name: this.form.name,
				phone: this.form.phone,
				status: 'pending',
				createdAt: Date.now()
			})
			uni.showToast({ title: '申请已提交，等待审批', icon: 'success' })
			setTimeout(() => uni.navigateBack(), 800)
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.step { font-size: 24rpx; color:#16A34A; padding: 8rpx 16rpx; background:#ECFDF5; display:inline-block; border-radius: 999px; }
.card { background:#fff; border-radius: 20rpx; padding: 0 28rpx; margin-top: 24rpx; }
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.row:last-child { border-bottom: none; }
.lbl { width: 160rpx; font-size: 28rpx; color:#333; }
.ipt { flex:1; font-size: 28rpx; color:#111; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 22rpx 0; font-weight: 600; }
.hint { color:#999; text-align:center; font-size: 22rpx; margin-top: 16rpx; }
</style>
